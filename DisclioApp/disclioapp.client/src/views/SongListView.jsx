import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SongListView.css';

export function SongListView({ cds }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const cd = cds[Number(id)];

    if (!cd) return <div>Album not found</div>;

    // Split songs into two columns
    const half = Math.ceil(cd.songs.length / 2);
    const leftColumn = cd.songs.slice(0, half);
    const rightColumn = cd.songs.slice(half);

    return (
        <div className="song-view-container">
            <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
            
            <div className="song-display-grid">
                {/* LEFT COLUMN */}
                <div className="song-column left">
                    {leftColumn.map((song, i) => (
                        <div key={i} className="song-item">
                            <span className="song-text">{String(i + 1).padStart(2, '0')}. {song}</span>
                            <div className="connector-line"></div>
                        </div>
                    ))}
                </div>

                {/* CENTER ART */}
                <div className="center-art-section">
                    <h2 className="album-title-top">{cd.title.toUpperCase()}</h2>
                    <img src={cd.cover} alt={cd.title} className="center-album-art" />
                    <p className="artist-name-bottom">{cd.artist}</p>
                    <div className="stars-display">
                        {"★".repeat(cd.rating)}{"☆".repeat(5 - cd.rating)}
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="song-column right">
                    {rightColumn.map((song, i) => (
                        <div key={i} className="song-item">
                            <div className="connector-line"></div>
                            <span className="song-text">{String(i + half + 1).padStart(2, '0')}. {song}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button className="edit-link" onClick={() => navigate(`/edit/${id}`)}>Edit</button>
        </div>
    );
}