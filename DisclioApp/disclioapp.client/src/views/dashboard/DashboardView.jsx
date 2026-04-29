import React, { useState, useEffect, useRef } from 'react';
import { GridView } from '../mainViews/GridView';
import { StatisticsView } from '../statistics/StatisticsView';
import './DashboardView.css';

const generateRandomCD = () => {
    const artists = ["Pink Floyd", "Daft Punk", "Miles Davis", "Radiohead", "The Beatles", "Led Zeppelin", "Green Day", "Dua Lipa", "Billie Eilish"];
    const albums = ["The Dark Side of the Moon", "Discovery", "Kind of Blue", "OK Computer", "Abbey Road", "American Idiot", "Future Nostalgia", "Happier Than Ever"];
    const genres = ["Rock", "Electronic", "Jazz", "Alternative", "Pop"];

    const songNouns = ["Silence", "Fire", "Moon", "Dream", "Echo", "City", "Night", "River", "Heart", "Shadow"];
    const songAdjectives = ["Electric", "Broken", "Golden", "Silent", "Midnight", "Lost", "Infinite", "Wild", "Neon"];

    const randomArtist = artists[Math.floor(Math.random() * artists.length)];
    const randomAlbum = albums[Math.floor(Math.random() * albums.length)];
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    
    const numberOfSongs = Math.floor(Math.random() * 11) + 5;
    const randomSongs = Array.from({ length: numberOfSongs }, (_, i) => {
        const adj = songAdjectives[Math.floor(Math.random() * songAdjectives.length)];
        const noun = songNouns[Math.floor(Math.random() * songNouns.length)];

        return {
            title: `${adj} ${noun}`,
            duration: `${Math.floor(Math.random() * 5) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            trackNumber: i + 1
        };
    });

    return {
        title: randomAlbum,
        artist: randomArtist,
        category: randomGenre,
        manufacturer: "Random Records Inc.",
        year: 1970 + Math.floor(Math.random() * 56), 
        condition: "Near Mint",
        rating: Math.floor(Math.random() * 5) + 1,
        description: "Auto generated CD with dynamic song list",
        songs: randomSongs,
        photos: ["/pompom.jpg"],
        cover: "/pompom.jpg"
    };
};

export function DashboardView({
    cds,
    saveCD,
    deleteCD,
    fetchRatingStats,
    fetchSongFrequencyStats,
    loadMore,
    hasMore,
    loading
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

                    <aside className="stats-column">
                        <div className="dashboard-section stats-card sticky-stats">
                            <StatisticsView fetchRatingStats={fetchRatingStats} fetchSongFrequencyStats={fetchSongFrequencyStats} />
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