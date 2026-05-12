import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import QRCode from 'qrcode';
import { GridView } from '../mainViews/GridView';
import { StatisticsView } from '../statistics/StatisticsView';
import './DashboardView.css';
import { getGraphQLErrorMessage, GRAPHQL_ENDPOINT, graphqlRequest, WS_ENDPOINT } from '../../api/client';

export function DashboardView({
    cds,
    deleteCD,
    fetchRatingStats,
    fetchSongFrequencyStats,
    loadMore,
    hasMore,
    loading,
    refresh,
    isAdmin = false
}) {
    const [isAutoAdding, setIsAutoAdding] = useState(false);
    const [totpEnabled, setTotpEnabled] = useState(false);
    const [totpMessage, setTotpMessage] = useState('');
    const [isTotpBusy, setIsTotpBusy] = useState(false);
    const [totpSecret, setTotpSecret] = useState('');
    const [totpUri, setTotpUri] = useState('');
    const [totpQrCode, setTotpQrCode] = useState('');
    const [totpCode, setTotpCode] = useState('');

    const stompClient = useRef(null);

    useEffect(() => {
        stompClient.current = new Client({
            brokerURL: WS_ENDPOINT,
            onConnect: () => {
                console.log("Connected");
                stompClient.current.subscribe('/topic/cds', () => {
                    refresh(); 
                });
            },
        });

        stompClient.current.activate();

        return () => {
            if (stompClient.current) stompClient.current.deactivate();
        };
    }, []); 

    useEffect(() => {
        const loadTotpStatus = async () => {
            try {
                const result = await graphqlRequest({
                    query: `query { totpEnabled }`
                });

                if (!result.errors && typeof result.data?.totpEnabled === 'boolean') {
                    setTotpEnabled(result.data.totpEnabled);
                }
            } catch {
            }
        };

        loadTotpStatus();
    }, []);

    useEffect(() => {
        if (!totpUri) {
            setTotpQrCode('');
            return;
        }

        let active = true;
        QRCode.toDataURL(totpUri, { margin: 1, width: 180 })
            .then((dataUrl) => {
                if (active) {
                    setTotpQrCode(dataUrl);
                }
            })
            .catch(() => {
                if (active) {
                    setTotpQrCode('');
                }
            });

        return () => {
            active = false;
        };
    }, [totpUri]);

    const toggleAutoAdd = async () => {
        const mutation = isAutoAdding
            ? `mutation { stopGenerator }`
            : `mutation { startGenerator }`;

        try {
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ query: mutation }),
            });

            const json = await response.json();

            if (json.errors) {
                console.error(json.errors);
                return;
            }

            setIsAutoAdding(!isAutoAdding);

        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const startTotpSetup = async () => {
        setIsTotpBusy(true);
        setTotpMessage('');

        try {
            const startResult = await graphqlRequest({
                query: `
                    mutation {
                        startTotpSetup {
                            secret
                            otpauthUri
                        }
                    }
                `
            });

            const setup = startResult.data?.startTotpSetup;
            if (!setup?.secret || !setup?.otpauthUri) {
                setTotpMessage(getGraphQLErrorMessage(startResult) || 'Could not start authenticator setup.');
                return;
            }

            setTotpSecret(setup.secret);
            setTotpUri(setup.otpauthUri);
            setTotpCode('');
            setTotpMessage('Scan the QR code in Microsoft Authenticator, then enter the 6-digit code to confirm setup.');
        } catch (error) {
            console.error("TOTP setup start failed:", error);
            if (error?.message) {
                setTotpMessage(error.message);
            } else {
                setTotpMessage('Could not start authenticator setup.');
            }
        } finally {
            setIsTotpBusy(false);
        }
    };

    const confirmTotpSetup = async () => {
        setIsTotpBusy(true);
        setTotpMessage('');

        try {
            const finishResult = await graphqlRequest({
                query: `
                    mutation FinishTotpSetup($code: String!) {
                        finishTotpSetup(code: $code)
                    }
                `,
                variables: {
                    code: totpCode
                }
            });

            if (finishResult.data?.finishTotpSetup) {
                setTotpEnabled(true);
                setTotpMessage('Authenticator verification is ready for secure login.');
                setTotpCode('');
            } else {
                setTotpMessage(getGraphQLErrorMessage(finishResult) || 'Could not finish authenticator setup.');
            }
        } catch (error) {
            console.error("TOTP setup verification failed:", error);
            setTotpMessage(error?.message || 'Could not finish authenticator setup.');
        } finally {
            setIsTotpBusy(false);
        }
    };

    return (
        <div className="dashboard-outer-wrapper">
            <div className="dashboard-container">

                <header className="dashboard-header">
                    <button
                        onClick={startTotpSetup}
                        className="small-btn"
                        disabled={isTotpBusy}
                    >
                        {isTotpBusy
                            ? 'Setting up authenticator...'
                            : totpEnabled
                                ? 'Reset Authenticator Setup'
                                : 'Enable Authenticator Verification'}
                    </button>

                    <span style={{ marginLeft: '15px' }}>
                        {totpEnabled ? 'Authenticator ready' : 'Authenticator not configured'}
                    </span>

                    {isAdmin && (
                        <>
                            <button
                                onClick={toggleAutoAdd}
                                className={`small-btn ${isAutoAdding ? 'active-stop' : ''}`}
                                style={{ marginLeft: '20px' }}
                            >
                                {isAutoAdding ? 'Stop Generator' : 'Start Generator'}
                            </button>

                            <span style={{ marginLeft: '15px' }}>
                                {isAutoAdding ? "Running..." : "Stopped"}
                            </span>
                        </>
                    )}
                </header>

                {totpMessage && (
                    <p style={{ margin: '8px 0 0', fontSize: '0.95rem' }}>
                        {totpMessage}
                    </p>
                )}

                {totpSecret && (
                    <section style={{ marginTop: '14px', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div>
                            {totpQrCode && <img src={totpQrCode} alt="Authenticator QR code" style={{ width: '180px', height: '180px', borderRadius: '12px', background: '#fff', padding: '8px' }} />}
                        </div>
                        <div style={{ maxWidth: '420px' }}>
                            <p style={{ margin: '0 0 10px' }}>Secret: <strong>{totpSecret}</strong></p>
                            <div className="input-group" style={{ marginBottom: '10px' }}>
                                <label>Authenticator Code</label>
                                <input
                                    name="totpCode"
                                    value={totpCode}
                                    className="auth-input"
                                    type="text"
                                    onChange={(event) => setTotpCode(event.target.value)}
                                    placeholder="Enter the 6-digit code"
                                />
                            </div>
                            <button
                                onClick={confirmTotpSetup}
                                className="small-btn"
                                disabled={isTotpBusy}
                            >
                                Confirm Authenticator
                            </button>
                        </div>
                    </section>
                )}

                <div className="dashboard-grid">
                    <aside className="stats-column">
                        <StatisticsView
                            fetchRatingStats={fetchRatingStats}
                            fetchSongFrequencyStats={fetchSongFrequencyStats}
                        />
                    </aside>

                    <main className="gallery-column">
                        <GridView
                            cds={cds}
                            deleteCD={deleteCD}
                            loadMore={loadMore}
                            hasMore={hasMore}
                            loading={loading}
                        />
                    </main>
                </div>
            </div>
        </div>
    );
}
