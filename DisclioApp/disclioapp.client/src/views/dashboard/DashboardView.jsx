import React, { useState, useEffect, useRef } from 'react';
import { GridView } from '../mainViews/GridView';
import { StatisticsView } from '../statistics/StatisticsView';
import './DashboardView.css';

const generateRandomCD = () => {
    const artists = ["Pink Floyd", "Daft Punk", "Miles Davis", "Radiohead", "The Beatles", "Led Zeppelin", "Green Day", "Dua Lipa", "Billie Eilish"];
    const albums = ["The Dark Side of the Moon", "Discovery", "Kind of Blue", "OK Computer", "Abbey Road", "American Idiot", "Future Nostalgia", "Happier Than Ever"];
    const genres = ["Rock", "Electronic", "Jazz", "Alternative", "Pop"];
    const randomIndex = Math.floor(Math.random() * artists.length);

    return {
        title: albums[randomIndex] || "New Album",
        artist: artists[randomIndex] || "Unknown Artist",
        category: genres[randomIndex] || "General",
        manufacturer: "Random Records Inc.",
        year: Math.floor(Math.random() * (2026 - 1960) + 1960),
        condition: "Near Mint",
        rating: Math.floor(Math.random() * 5) + 1,
        description: "Automatically generated CD for collection testing.",
        songs: ["Track 1", "Track 2", "Track 3"],
        photos: ["/pompom.jpg"],
        cover: "/pompom.jpg"
    };
};

export function DashboardView({ cds, deleteCD, currentPage, setCurrentPage, onSave }) {
    const [isAutoAdding, setIsAutoAdding] = useState(false);
    const intervalRef = useRef(null);

    const toggleAutoAdd = () => {
        setIsAutoAdding(prev => !prev);
    };

    useEffect(() => {
        if (isAutoAdding) {
            intervalRef.current = setInterval(() => {
                onSave(generateRandomCD(), null);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => clearInterval(intervalRef.current);
    }, [isAutoAdding, onSave]);

    return (
        <div className="dashboard-outer-wrapper">
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <button
                        onClick={toggleAutoAdd}
                        className={`small-btn ${isAutoAdding ? 'active-stop' : ''}`}
                    >
                        {isAutoAdding ? 'Stop Adding' : 'Start Adding'}
                    </button>
                </header>

                <div className="dashboard-grid">
                    <aside className="stats-column">
                        <div className="dashboard-section stats-card sticky-stats">
                            <div className="stats-force-visible">
                                <StatisticsView cds={cds} />
                            </div>
                        </div>
                    </aside>

                    <main className="gallery-column">
                        <section className="dashboard-section gallery-card">
                            <div className="gallery-content-wrapper">
                                <GridView
                                    cds={cds}
                                    deleteCD={deleteCD}
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                />
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
}