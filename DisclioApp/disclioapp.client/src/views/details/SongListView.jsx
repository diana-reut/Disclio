import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './SongListView.css';

export function SongListView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cd, setCd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newSongTitle, setNewSongTitle] = useState("");

    const GRAPHQL_ENDPOINT = 'http://localhost:8080/graphql';

    const fetchCdData = () => {
        const query = `
            query GetSongs($id: Int!) {
                cd(id: $id) {
                    id title artist rating photos
                    songs { id title trackNumber }
                }
            }
        `;
        fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { id: parseInt(id, 10) } }),
        })
            .then(res => res.json())
            .then(json => {
                if (json.data?.cd) setCd(json.data.cd);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCdData();
    }, [id]);

    // This handles BOTH adding and updating
    const handleSaveSong = async (songId, title, trackNo) => {
        if (!title.trim()) return;

        const query = `
            mutation AddSong($id: Int, $cdId: Int!, $title: String!, $trackNumber: Int) {
                addSong(id: $id, cdId: $cdId, title: $title, trackNumber: $trackNumber) { id title }
            }
        `;

        await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: {
                    id: songId ? parseInt(songId) : null, // ID present = Update
                    cdId: parseInt(id),
                    title: title,
                    trackNumber: trackNo
                }
            }),
        });
        fetchCdData();
    };

    const handleDeleteSong = async (songId) => {
        const query = `mutation DeleteSong($id: Int!) { deleteSong(id: $id) }`;
        await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { id: parseInt(songId) } }),
        });
        fetchCdData();
    };

    if (loading) return <div className="error-msg">Loading...</div>;
    if (!cd) return <div className="error-msg">Album not found</div>;

    const songs = cd.songs || [];
    const half = Math.ceil(songs.length / 2);
    const leftColumn = songs.slice(0, half);
    const rightColumn = songs.slice(half);

    const listContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemFade = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

    // Helper to render the song text or input
    const renderSongContent = (song, displayIndex) => {
        const isEven = displayIndex % 2 === 0;

        if (isEditing) {
            return (
                <input
                    className="song-edit-input"
                    defaultValue={song.title}
                    onBlur={(e) => handleSaveSong(song.id, e.target.value, song.trackNumber)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSong(song.id, e.target.value, song.trackNumber)}
                    autoFocus={false}
                />
            );
        }

        return (
            <span className="song-text" style={{ color: isEven ? 'black' : 'purple' }}>
                {String(displayIndex).padStart(2, '0')}. {song.title}
            </span>
        );
    };

    return (
        <motion.div className="song-view-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button className="back-btn" onClick={() => navigate(-1)}>Back</button>

            <motion.div className="song-display-grid" variants={listContainer} initial="hidden" animate="show">
                {/* LEFT COLUMN */}
                <div className="song-column left">
                    {leftColumn.map((song, i) => (
                        <motion.div key={song.id} className="song-item" variants={itemFade}>
                            {isEditing && <button className="del-song-btn" onClick={() => handleDeleteSong(song.id)}>✕</button>}
                            {renderSongContent(song, i + 1)}
                            <div className="connector-line"></div>
                        </motion.div>
                    ))}
                </div>

                {/* CENTER ART */}
                <motion.div className="center-art-section">
                    <h2 className="album-title-top">{cd.title?.toUpperCase()}</h2>
                    <img
                        src={cd.photos || 'placeholder.jpg'}
                        alt={cd.title}
                        className="center-album-art"
                    />
                    <p className="artist-name-bottom">{cd.artist}</p>

                    {isEditing && (
                        <div className="add-song-mini-form">
                            <input
                                type="text"
                                placeholder="New track title..."
                                value={newSongTitle}
                                onChange={(e) => setNewSongTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveSong(null, newSongTitle, songs.length + 1)}
                            />
                            <button onClick={() => { handleSaveSong(null, newSongTitle, songs.length + 1); setNewSongTitle(""); }}>Add</button>
                        </div>
                    )}
                </motion.div>

                {/* RIGHT COLUMN */}
                <div className="song-column right">
                    {rightColumn.map((song, i) => (
                        <motion.div key={song.id} className="song-item" variants={itemFade}>
                            <div className="connector-line"></div>
                            {renderSongContent(song, i + half + 1)}
                            {isEditing && <button className="del-song-btn" onClick={() => handleDeleteSong(song.id)}>✕</button>}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <button className="edit-link" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Finish Editing" : "Edit Songs"}
            </button>
        </motion.div>
    );
}