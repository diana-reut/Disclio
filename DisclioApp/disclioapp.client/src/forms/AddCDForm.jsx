import React from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddCDForm.css'

export function AddCDForm({ onSave, cds }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = id !== undefined;

    const existingCD = isEditMode ? cds[Number(id)] : null;

    const [formData, setFormData] = useState({
        title: existingCD?.title || '',
        artist: existingCD?.artist || '',
        category: existingCD?.category || '',
        manufacturer: existingCD?.manufacturer || '',
        year: existingCD?.year || '',
        condition: existingCD?.condition || 'Very good',
        rating: existingCD?.rating || 0,
        description: existingCD?.description || ''
    });

    const [songs, setSongs] = useState(existingCD?.songs || []);
    const [photos, setPhotos] = useState(existingCD?.photos || []);

    const [errors, setErrors] = useState({ title: false, artist: false });

    const handleSongChange = (index, value) => {
        const newSongs = [...songs];
        newSongs[index] = value;
        setSongs(newSongs);
    };

    const addSongField = () => setSongs([...songs, '']);

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = files.map(file => URL.createObjectURL(file));
        setPhotos([...photos, ...newPhotos]);

    };

    const removeSongField = (indexToRemove) => {
        setSongs(songs.filter((_, index) => index !== indexToRemove));
    };

    const removePhoto = (indexToRemove) => {
        setPhotos(photos.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const titleError = !formData.title;
        const artistError = !formData.artist;

        if (titleError || artistError) {
            setErrors({ title: titleError, artist: artistError });
            setTimeout(() => setErrors({ title: false, artist: false }), 500);
            return;
        }

        const cover = photos.length > 0 ? photos : null;
        const cdPayload = { ...formData, songs, photos, cover };

        const url = isEditMode
            ? `http://localhost:8080/api/cds/${id}`
            : 'http://localhost:8080/api/cds';

        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cdPayload),
            });

            if (response.ok) {
                alert(isEditMode ? "Updated in RAM!" : "Saved to RAM!");

                onSave(cdPayload, isEditMode ? Number(id) : null);

                navigate(-1);
            } else {
                const errorMsg = await response.text();
                alert("Server Error: " + errorMsg);
            }
        } catch (error) {
            console.error("Failed to connect to IntelliJ:", error);
            alert("Connection failed. Is the backend running?");
        }
    };

    return (
        <div id="form-container">
            <form onSubmit={handleSubmit} className="album-form">
                <div className="form-grid">
                    
                    <div className="form-column">
                        <label htmlFor="title">Title:</label>
                        <input
                            id="title"
                            type="text"
                            className={`form-input ${errors.title ? "error-shake" : ""}`}
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />

                        <label htmlFor="artist">Artist:</label>
                        <input
                            id="artist"
                            type="text"
                            className={`form-input ${errors.artist ? "error-shake" : ""}`}
                            value={formData.artist}
                            onChange={e => setFormData({ ...formData, artist: e.target.value })}
                        />

                        <label htmlFor="category">Category:</label>
                        <input id="category" type="text" className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />

                        <label htmlFor="manufacturer">Manufacturer:</label>
                        <input id="manufacturer" type="text" className="form-input" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />

                        <label htmlFor="year">Year of Publication:</label>
                        <input id="year" type="number" className="form-input" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />

                        <label htmlFor="condition">Condition:</label>
                        <select
                            className="form-input"
                            id="condition"
                            value={formData.condition}
                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                        >
                            <option value="Mint">Mint</option>
                            <option value="Near Mint">Near Mint</option>
                            <option value="Very good">Very good</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                        </select>

                        <label>Rating:</label>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={star <= formData.rating ? "star filled" : "star"}
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    style={{ cursor: 'pointer', fontSize: '24px' }}
                                >
                                    {star <= formData.rating ? '★' : '☆'}
                                </span>
                            ))}
                        </div>
                    </div>

                    
                    <div className="form-column">
                        <label>Songs:</label>
                        {songs.map((song, index) => (
                            <div key={index} className="list-item-input">
                                <span>{index + 1}. </span>
                                <input
                                    aria-label={`Song ${index + 1}`}
                                    type="text"
                                    className="form-input"
                                    value={song}
                                    onChange={(e) => handleSongChange(index, e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="small-btn"
                                    onClick={() => removeSongField(index)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                        <button type="button" aria-label="Add Song" onClick={addSongField} className="small-btn">+</button>

                        <label style={{ marginTop: '20px' }}>Photos:</label>
                        <div className="photo-upload-section">
                            <input
                                type="file"
                                id="photo-input"
                                data-testid="photo-input"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                style={{ display: 'none' }} />
                            <div className="photo-previews">
                                {photos.map((p, i) => (
                                    <div
                                        key={i}
                                        className="preview-wrapper"
                                        style={{
                                            position: 'relative',
                                            display: 'inline-block',
                                            marginRight: '15px',
                                            marginTop: '10px'
                                        }}
                                    >
                                        <img src={p} alt="preview" width="50" />
                                        <button
                                            type="button"
                                            className="delete-photo-btn"
                                            onClick={() => removePhoto(i)}
                                        >
                                            x
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button type="button" aria-label="Add Photo" className="small-btn" onClick={() => document.getElementById('photo-input').click()}>+</button>
                    </div>
                </div>

                <div className="full-width">
                    <label htmlFor="description">Description:</label>
                    <textarea id="description" className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="form-actions">
                    <button className="small-btn" type="submit">{isEditMode ? "Update" : "Add"}</button>
                    <button className="small-btn" type="button" onClick={() => navigate(-1)}>Cancel</button>
                </div>
            </form>
        </div>
    );
}
