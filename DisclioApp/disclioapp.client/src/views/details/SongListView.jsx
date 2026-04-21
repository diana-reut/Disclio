import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './SongListView.css';

export function SongListView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cd, setCd] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:8080/api/cds/${id}`)
            .then(res => {
    if (!res.ok) throw new Error("Album not found");
    return res.json();
})
    .then(data => {
        setCd(data);
        setLoading(false);
    })
    .catch(err => {
        console.error("Failed to load CD:", err);
        setCd(null);
        setLoading(false);
    });
    }, [id]);

if (loading) return <div className="error-msg">Loading...</div>;
if (!cd) return <div className="error-msg">Album not found</div>;

const songs = cd.songs || [];
const half = Math.ceil(songs.length / 2);
const leftColumn = songs.slice(0, half);
const rightColumn = songs.slice(half);

const listContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
};

const itemFade = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

return (
    <motion.div
        className="song-view-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
        <button className="back-btn" onClick={() => navigate(-1)}>
            Back
        </button>

        <motion.div
            className="song-display-grid"
            variants={listContainer}
            initial="hidden"
            animate="show"
        >

            {/* LEFT */}
            <div className="song-column left">
                {leftColumn.map((song, i) => {
                    const trackNumber = i + 1;
                    const isEven = trackNumber % 2 === 0;

                    return (
                        <motion.div key={i} className="song-item" variants={itemFade}>
                            <span
                                className="song-text"
                                style={{ color: isEven ? 'black' : 'purple' }}
                            >
                                {String(trackNumber).padStart(2, '0')}. {song}
                            </span>
                            <div className="connector-line"></div>
                        </motion.div>
                    );
                })}
            </div>

            {/* CENTER */}
            <motion.div
                className="center-art-section"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <h2 className="album-title-top">
                    {cd.title?.toUpperCase()}
                </h2>

                <img
                    src={cd.cover}
                    alt={cd.title}
                    className="center-album-art"
                />

                <p className="artist-name-bottom">{cd.artist}</p>

                <div className="stars-display">
                    {"★".repeat(cd.rating || 0)}
                    {"☆".repeat(5 - (cd.rating || 0))}
                </div>
            </motion.div>

            {/* RIGHT */}
            <div className="song-column right">
                {rightColumn.map((song, i) => {
                    const trackNumber = i + half + 1;
                    const isEven = trackNumber % 2 === 0;

                    return (
                        <motion.div key={i} className="song-item" variants={itemFade}>
                            <div className="connector-line"></div>
                            <span
                                className="song-text"
                                style={{ color: isEven ? 'black' : 'purple' }}
                            >
                                {String(trackNumber).padStart(2, '0')}. {song}
                            </span>
                        </motion.div>
                    );
                })}
            </div>

        </motion.div>

        <button
            className="edit-link"
            onClick={() => navigate(`/edit/${cd.id}`)}
        >
            Edit
        </button>
    </motion.div>
);
}