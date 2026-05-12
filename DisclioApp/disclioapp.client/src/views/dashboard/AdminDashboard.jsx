import React, { useCallback, useEffect, useRef, useState } from 'react';
import './AdminDashboard.css';
import { useLogPagination } from '../../hooks/useLogPagination';
import { GRAPHQL_ENDPOINT } from '../../api/client';

const AdminDashboard = () => {
    const [susUsers, setSusUsers] = useState([]);
    const [observationsLoading, setObservationsLoading] = useState(true);
    const [observationsError, setObservationsError] = useState(null);
    const {
        logs,
        loading: logsLoading,
        error: logsError,
        hasMore,
        loadMore
    } = useLogPagination(10);
    const observer = useRef(null);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const fetchObservationList = async () => {
            const query = `
                query {
                    getObservationList {
                        id
                        username
                        reason
                        detectedAt
                    }
                }
            `;

            try {
                const response = await fetch(GRAPHQL_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ query })
                });

                const result = await response.json();

                if (result.errors) {
                    throw new Error(result.errors[0].message);
                }

                setSusUsers(result.data?.getObservationList ?? []);
            } catch (err) {
                setObservationsError(err.message);
            } finally {
                setObservationsLoading(false);
            }
        };

        fetchObservationList();
    }, []);

    const lastElementRef = useCallback((node) => {
        if (logsLoading) return;

        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        }, {
            root: scrollContainerRef.current,
            rootMargin: '100px',
            threshold: 0
        });

        if (node) observer.current.observe(node);
    }, [hasMore, loadMore, logsLoading]);

    if (observationsLoading && logsLoading && logs.length === 0) {
        return <div className="admin-message">Scanning databases...</div>;
    }

    if (observationsError && !susUsers.length && logsError && !logs.length) {
        return <div className="admin-message error">Access Denied: {observationsError}</div>;
    }

    return (
        <div className="admin-container" ref={scrollContainerRef}>
            <div className="admin-header">
                <h2>Admin Logs</h2>
                <p>Review suspicious activity and browse the full system log history.</p>
            </div>

            <section className="admin-section">
                <div className="section-heading">
                    <h3>Observation List</h3>
                    <p>Suspicious behavior detected by the monitoring rules.</p>
                </div>

                {observationsError ? (
                    <div className="admin-message error">Access Denied: {observationsError}</div>
                ) : susUsers.length === 0 ? (
                    <div className="admin-empty">No suspicious activity detected. The server is safe.</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Target User</th>
                                    <th>Detected At</th>
                                    <th>Behavior / Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {susUsers.map(user => (
                                    <tr key={user.id}>
                                        <td className="user-cell">@{user.username}</td>
                                        <td className="time-cell">{user.detectedAt}</td>
                                        <td className="reason-cell">{user.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="admin-section">
                <div className="section-heading">
                    <h3>System Logs</h3>
                    <p>Newest entries appear first. Scroll to load older activity.</p>
                </div>

                {logsError && logs.length === 0 ? (
                    <div className="admin-message error">Access Denied: {logsError}</div>
                ) : logs.length === 0 && !logsLoading ? (
                    <div className="admin-empty">No system logs available yet.</div>
                ) : (
                    <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Role</th>
                                <th>Timestamp</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className="user-cell">{log.userId ?? 'System'}</td>
                                    <td className="role-cell">{log.groupRole}</td>
                                    <td className="time-cell">{log.timestamp}</td>
                                    <td className="action-cell">{log.actionInformation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}

                <div ref={lastElementRef} className="admin-load-state">
                    {logsLoading && <p>Loading more logs...</p>}
                    {!hasMore && logs.length > 0 && <p>You've reached the oldest available log.</p>}
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;
