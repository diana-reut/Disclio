import React, { useState, useEffect, useRef } from 'react';
import { GridView } from '../mainViews/GridView';
import { StatisticsView } from '../statistics/StatisticsView';
import './DashboardView.css';

const generateRandomCD = () => {
    const artists = ["Pink Floyd", "Daft Punk", "Miles Davis", "Radiohead", "The Beatles", "Led Zeppelin", "Green Day", "Dua Lipa", "Billie Eilish"];
    const albums = ["The Dark Side of the Moon", "Discovery", "Kind of Blue", "OK Computer", "Abbey Road", "American Idiot", "Future Nostalgia", "Happier Than Ever"];
    const genres = ["Rock", "Electronic", "Jazz", "Alternative", "Pop"];

    const i = Math.floor(Math.random() * artists.length);

    return {
        title: albums[i],
        artist: artists[i],
        category: genres[i],
        manufacturer: "Random Records Inc.",
        year: 1970 + Math.floor(Math.random() * 50),
        condition: "Near Mint",
        rating: Math.floor(Math.random() * 5) + 1,
        description: "Auto generated CD",
        songs: ["Track 1", "Track 2"],
        photos: ["/pompom.jpg"],
        cover: "/pompom.jpg"
    };
};

export function DashboardView({
    cds,
    saveCD,
    deleteCD,
    currentPage,
    setCurrentPage
}) {

    const [isAutoAdding, setIsAutoAdding] = useState(false);
    const intervalRef = useRef(null);

    const toggleAutoAdd = () => {
        setIsAutoAdding(prev => !prev);
    };

    useEffect(() => {
        if (isAutoAdding) {
            intervalRef.current = setInterval(() => {
                saveCD(generateRandomCD()); // 🔥 CLEAN: uses App.jsx
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isAutoAdding, saveCD]);

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

                    {/* STATS */}
                    <aside className="stats-column">
                        <div className="dashboard-section stats-card sticky-stats">
                            <StatisticsView cds={cds} />
                        </div>
                    </aside>

                    {/* GRID */}
                    <main className="gallery-column">
                        <section className="dashboard-section gallery-card">

                            <GridView
                                cds={cds}
                                deleteCD={deleteCD}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                            />

                        </section>
                    </main>

                </div>
            </div>
        </div>
    );
}