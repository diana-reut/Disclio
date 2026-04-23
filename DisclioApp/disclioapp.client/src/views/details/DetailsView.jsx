import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './DetailsView.css';

export function DetailsView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cd, setCd] = useState(null);
    const [activePhotoIdx, setActivePhotoIdx] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const query = `
            query GetCDDetails($id: Int!) {
                cd(id: $id) {
                    id
                    title
                    artist
                    category
                    manufacturer
                    year
                    condition
                    rating
                    description
                    photos
                    songs {
                        id
                        title
                        duration
                    }
                }
            }
        `;

        fetch(`http://localhost:8080/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: { id: parseInt(id, 10) }
            }),
        })
            .then(res => res.json())
            .then(json => {
                if (json.errors) {
                    throw new Error(json.errors.message);
                }
                setCd(json.data.cd);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch CD via GraphQL:", err);
                setCd(null);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="detail-page"><h2>Loading...</h2></div>;
    if (!cd) return <div className="detail-page"><h2>CD Not Found</h2></div>;

    const photos = cd.photos || [];

    const nextPhoto = () => setActivePhotoIdx((prev) => (prev + 1) % photos.length);
    const prevPhoto = () => setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);

    return (
        <div className="detail-page-container">
            <div className="top-nav">
                <button className="back-link" onClick={() => navigate(-1)}>← Back</button>
                <button className="edit-top-btn" onClick={() => navigate(`/edit/${cd.id}`)}>Edit</button>
            </div>

            <div className="detail-main-content">
                <div className="left-panel">
                    <div className="gallery-section">
                        <div className="main-photo-view">
                            {photos.length > 1 && <button className="nav-arrow left" onClick={prevPhoto}>&lt;</button>}

                            <img
                                src={photos.length > 0 ? photos[activePhotoIdx] : 'placeholder.jpg'}
                                alt={cd.title}
                                className="featured-image"
                            />

                            {photos.length > 1 && <button className="nav-arrow right" onClick={nextPhoto}>&gt;</button>}
                        </div>

                        <div className="thumbnail-list">
                            {photos.map((pic, i) => (
                                <img key={i} src={pic} className={i === activePhotoIdx ? "thumb active" : "thumb"} onClick={() => setActivePhotoIdx(i)} alt="thumbnail" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="right-panel">
                    <div className="header-info">
                        <h2>{cd.title?.toUpperCase()}</h2>
                        <div className="meta-info">
                            <span>{cd.artist}</span>
                            <span className="separator">|</span>
                            <span>Format: CD</span>
                        </div>
                        <div className="stars-display">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < cd.rating ? "star-filled" : "star-empty"}>★</span>
                            ))}
                        </div>
                    </div>

                    <div className="info-grid">
                        <div className="info-row">
                            <strong>CATEGORY</strong> <span>{cd.category}</span>
                        </div>
                        <div className="info-row">
                            <strong>MANUFACTURER</strong> <span>{cd.manufacturer}</span>
                        </div>
                        <div className="info-row">
                            <strong>SONGS</strong> <span>{cd.songs?.length || 0}</span>
                        </div>
                        <div className="info-row">
                            <strong>YEAR</strong> <span>{cd.year}</span>
                        </div>
                        <div className="info-row">
                            <strong>CONDITION</strong> <span>{cd.condition}</span>
                        </div>
                    </div>

                    <div className="song-list-link">
                        <Link to={`/details/${cd.id}/songs`}>VIEW SONG LIST »</Link>
                    </div>

                    <div className="description-box">
                        <h3>DESCRIPTION</h3>
                        <p>{cd.description || "No description provided."}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}