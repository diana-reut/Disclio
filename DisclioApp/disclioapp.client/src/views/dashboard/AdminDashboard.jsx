import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [susUsers, setSusUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                const response = await fetch(`http://${window.location.hostname}:8080/graphql`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ query })
                });

                const result = await response.json();

                if (result.errors) {
                    throw new Error(result.errors[0].message);
                }

                setSusUsers(result.data.getObservationList);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchObservationList();
    }, []);

    if (loading) return <div className="admin-message">Scanning databases...</div>;
    if (error) return <div className="admin-message error">Access Denied: {error}</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Admin Logs</h2>
                <p>Observation List - Suspicious Behavior Detected</p>
            </div>

            {susUsers.length === 0 ? (
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
        </div>
    );
};

export default AdminDashboard;