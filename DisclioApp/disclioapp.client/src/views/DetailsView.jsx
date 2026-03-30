import React from 'react';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './DetailsView.css'

export function DetailsView({ cds }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const cd = cds[Number(id)];

    const [activePhotoIdx, setActivePhotoIdx] = useState(0);

    if (!cd) return <div className="detail-page"><h2>CD Not Found</h2></div>;

    const nextPhoto = () => {
        setActivePhotoIdx((prev) => (prev + 1) % cd.photos.length);
    };

    const prevPhoto = () => {
        setActivePhotoIdx((prev) => (prev - 1 + cd.photos.length) % cd.photos.length);
    };

    console.log("Current CD:", cd);
    console.log("Current Photo Path:", cd?.photos[activePhotoIdx]);
    return (
        <div className="detail-page-container">
            <button className="back-link" onClick={() => navigate(-1)}>Back</button>

            <div className="detail-main-content">
                {/* LEFT SECTION: Gallery and Description */}
                <div className="left-panel">
                    <div className="gallery-section">
                        <div className="thumbnail-list">
                            {cd.photos.map((pic, i) => (
                                <img
                                    key={i}
                                    src={pic}
                                    className={i === activePhotoIdx ? "thumb active" : "thumb"}
                                    onClick={() => setActivePhotoIdx(i)}
                                    alt="thumbnail" />
                            ))}
                            <button className="thumb-add-btn">+</button>
                        </div>

                        <div className="main-photo-view">
                            <button className="nav-arrow left" onClick={prevPhoto}>&lt;</button>
                            <img src={cd.photos[activePhotoIdx]} alt={cd.title} className="featured-image" />
                            <button className="nav-arrow right" onClick={nextPhoto}>&gt;</button>
                        </div>
                    </div>

                    <div className="description-box">
                        <h3>DESCRIPTION:</h3>
                        <p>{cd.description || "No description provided."}</p>
                    </div>
                </div>

                {/* RIGHT SECTION: Info and Stats */}
                <div className="right-panel">
                    <div className="header-info">
                        <h2>{cd.title.toUpperCase()}</h2>
                        <p>{cd.artist} | Format: Audio CD |
                            <span className="stars-display">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < cd.rating ? "star-filled" : "star-empty"}>★</span>
                                ))}
                            </span>
                        </p>
                    </div>

                    <div className="info-grid">
                        <div className="info-row"><strong>CATEGORY:</strong> <span>{cd.category}</span></div>
                        <div className="info-row"><strong>ARTIST:</strong> <span>{cd.artist}</span></div>
                        <div className="info-row"><strong>MANUFACTURER:</strong> <span>{cd.manufacturer}</span></div>
                        <div className="info-row"><strong>NUMBER OF SONGS:</strong> <span>{cd.songs.length}</span></div>
                        <div className="info-row"><strong>DATE OF PUBLICATION:</strong> <span>{cd.year}</span></div>
                        <div className="info-row"><strong>CONDITION:</strong> <span>{cd.condition}</span></div>
                    </div>

                    <div className="song-list-link">
                        <Link to={`/details/${id}/songs`}>View song list &gt;&gt;</Link>
                    </div>

                    <button
                        className="edit small-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit/${id}`);
                        }}>
                        Edit
                    </button>
                </div>
            </div>
        </div>
    );
}
