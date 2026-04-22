import React, { useState, useEffect, useRef } from 'react';
import { GridView } from '../mainViews/GridView';
import { StatisticsView } from '../statistics/StatisticsView';
import './DashboardView.css';

const generateRandomCD = () => {
    const artists = ["Pink Floyd", "Daft Punk", "Miles Davis", "Radiohead", "The Beatles", "Led Zeppelin", "Green Day", "Dua Lipa", "Billie Eilish"];
    const albums = ["The Dark Side of the Moon", "Discovery", "Kind of Blue", "OK Computer", "Abbey Road", "American Idiot", "Future Nostalgia", "Happier Than Ever"];
    const genres = ["Rock", "Electronic", "Jazz", "Alternative", "Pop"];

    const randomArtist = artists[Math.floor(Math.random() * artists.length)];
    const randomAlbum = albums[Math.floor(Math.random() * albums.length)];
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];

    return {
        title: randomAlbum,
        artist: randomArtist,
        category: randomGenre,
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
    loadMore,     
    hasMore,      
    loading,     
    fetchRatingStats
}) {

    const [isAutoAdding, setIsAutoAdding] = useState(false);
    const intervalRef = useRef(null);

    const toggleAutoAdd = () => {
        setIsAutoAdding(prev => !prev);
    };

    useEffect(() => {
        if (isAutoAdding) {
            intervalRef.current = setInterval(() => {
                saveCD(generateRandomCD());
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
                            <StatisticsView fetchRatingStats={fetchRatingStats} />
                        </div>
                    </aside>

                    {/* GRID */}
                    <main className="gallery-column">
                        <section className="dashboard-section gallery-card">

                            <GridView
                                cds={cds}
                                deleteCD={deleteCD}
                                loadMore={loadMore}     
                                hasMore={hasMore}      
                                loading={loading}       
                            />

                        </section>
                    </main>

                </div>
            </div>
        </div>
    );
}