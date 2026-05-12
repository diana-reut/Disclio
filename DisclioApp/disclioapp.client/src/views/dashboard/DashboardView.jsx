import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { GridView } from '../mainViews/GridView';
import { StatisticsView } from '../statistics/StatisticsView';
import './DashboardView.css';
import { GRAPHQL_ENDPOINT, WS_ENDPOINT } from '../../api/client';

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

    return (
        <div className="dashboard-outer-wrapper">
            <div className="dashboard-container">

                <header className="dashboard-header">
                    {isAdmin && (
                        <>
                            <button
                                onClick={toggleAutoAdd}
                                className={`small-btn ${isAutoAdding ? 'active-stop' : ''}`}
                            >
                                {isAutoAdding ? 'Stop Generator' : 'Start Generator'}
                            </button>

                            <span style={{ marginLeft: '15px' }}>
                                {isAutoAdding ? "Running..." : "Stopped"}
                            </span>
                        </>
                    )}
                </header>

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
