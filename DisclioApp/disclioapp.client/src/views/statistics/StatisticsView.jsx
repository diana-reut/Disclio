import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, LabelList
} from 'recharts';
import './StatisticsView.css';

export function StatisticsView({ fetchRatingStats, fetchSongFrequencyStats }) {
    const navigate = useNavigate();
    const [ratings, setRatings] = useState({});
    const [songFreq, setSongFreq] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [ratingData, freqData] = await Promise.all([
                    fetchRatingStats ? fetchRatingStats() : Promise.resolve({}),
                    fetchSongFrequencyStats ? fetchSongFrequencyStats() : Promise.resolve([])
                ]);

                setRatings(ratingData || {});
                setSongFreq(freqData || []);
            } catch (error) {
                console.error("Error loading statistics:", error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [fetchRatingStats, fetchSongFrequencyStats]);

    const ratingChartData =[1,2,3,4,5].map(starLevel => ({
        label: `${starLevel} ⭐`,
        count: ratings[starLevel] || 0
    }));

    const freqChartData = Object.entries(songFreq)
        .map(([songCount, numberOfCds]) => ({
            label: `${songCount}`,
            count: numberOfCds
        }))
        .sort((a, b) => parseInt(a.label) - parseInt(b.label));

    const colors = ['#2e2b5f', '#8e2e7a', '#327d8a', '#6a2c4a', '#7a2e8e'];

    if (loading) {
        return <div className="stats-container"><h2 className="stats-title">Loading stats...</h2></div>;
    }

    return (
        <div className="stats-container">
            <div className="stats-nav">
                <button className="back-btn-static" onClick={() => navigate(-1)}>
                    Back
                </button>
                <button className="back-btn-static" onClick={() => navigate('/dashboard')}>
                    Dashboard
                </button>
            </div>

            <h2 className="stats-title">ALBUM RATINGS DISTRIBUTION</h2>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={ratingChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                        <XAxis dataKey="label" tick={{ fontFamily: 'Courier New' }} />
                        <YAxis allowDecimals={false} tick={{ fontFamily: 'Courier New' }} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.2)' }} />
                        <Bar dataKey="count">
                            {ratingChartData.map((_, i) => (
                                <Cell key={i} fill={colors[i % colors.length]} />
                            ))}
                            <LabelList dataKey="count" position="top" style={{ fontFamily: 'Courier New', fontWeight: 'bold' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <hr className="stats-divider" />

            <h2 className="stats-title">SONGS PER CD DISTRIBUTION</h2>
            <div className="chart-wrapper">
                {freqChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={freqChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                            <XAxis dataKey="label" tick={{ fontFamily: 'Courier New' }} />
                            <YAxis allowDecimals={false} tick={{ fontFamily: 'Courier New' }} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.2)' }} />
                            <Bar dataKey="count" fill="#327d8a">
                                <LabelList dataKey="count" position="top" style={{ fontFamily: 'Courier New', fontWeight: 'bold' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p style={{ textAlign: 'center', fontFamily: 'Courier New' }}>No song data available.</p>
                )}
            </div>
        </div>
    );
}