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
                    <BarChart
                        data={data}
                        margin={{ top: 40, right: 30, left: 60, bottom: 70 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(0,0,0,0.1)"
                        />

                        <XAxis
                            dataKey="rating"
                            axisLine={{ stroke: '#333' }}
                            tick={{ fill: '#333', fontSize: 14, fontFamily: 'Courier New' }}
                            label={{
                                value: 'Rating (Stars)',
                                position: 'bottom', 
                                offset: 20,
                                style: { fill: '#333', fontWeight: 'bold', fontFamily: 'Courier New' }
                            }}
                        />

                        <YAxis
                            axisLine={{ stroke: '#333' }}
                            tick={{ fill: '#333' }}
                            allowDecimals={false}
                            tickCount={6}
                            domain={[0, (dataMax) => Math.ceil(dataMax * 1.2) || 5]}

                            label={{
                                value: 'Number of Albums',
                                angle: -90,
                                position: 'outsideLeft', 
                                dx: -40,                 
                                style: {
                                    fill: '#333',
                                    fontWeight: 'bold',
                                    fontFamily: 'Courier New',
                                    textAnchor: 'middle'
                                }
                            }}
                        />

                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.2)' }} />

                        <Bar dataKey="count" radius={0}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                            <LabelList
                                dataKey="count"
                                position="top"
                                offset={10}
                                style={{ fontFamily: 'Courier New', fontWeight: 'bold' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}