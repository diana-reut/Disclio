import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import './StatisticsView.css';

export function StatisticsView({ cds = [] }) {
    const navigate = useNavigate();

    const data = [1, 2, 3, 4, 5].map(starLevel => ({
        rating: `${starLevel} ⭐`,
        count: cds.filter(cd => Number(cd.rating) === starLevel).length
    }));

    const colors = ['#2e2b5f', '#8e2e7a', '#327d8a', '#6a2c4a', '#7a2e8e'];

    return (
        <div className="stats-container">
            <button className="back-btn" onClick={() => navigate(-1)}>Back</button>

            <h2 className="stats-title">ALBUM RATINGS DISTRIBUTION</h2>
            <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                        <XAxis
                            dataKey="rating"
                            axisLine={{ stroke: '#333' }}
                            tick={{ fill: '#333', fontSize: 14, fontFamily: 'Courier New' }}
                        />
                        <YAxis
                            axisLine={{ stroke: '#333' }}
                            tick={{ fill: '#333' }}
                            allowDecimals={false} 
                        />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.2)' }} />

                        <Bar dataKey="count" radius={0}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                            <LabelList dataKey="count" position="top" style={{ fontFamily: 'Courier New', fontWeight: 'bold' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}