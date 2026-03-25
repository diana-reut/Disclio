import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddCdForm.css'

export function AddCDForm({ onSave }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        category: '',
        manufacturer: '',
        year: '',
        condition: 'Very good',
        rating: 0,
        description: ''
    });

    const [songs, setSongs] = useState(['']);
    const [photos, setPhotos] = useState([]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.artist) {
            alert("Title and Artist are required!");
            return;
        }
        onSave({ ...formData, songs, photos });
        navigate('/');
    };

    return (
        <div className="form-container">
            <h2>Add New Album</h2>
            <form onSubmit={handleSubmit} className="album-form">
                <div className="form-grid">
                    {/* Left Column */}
                    <div className="form-column">
                        <label>Title:</label>
                        <input type="text" onChange={e => setFormData({ ...formData, title: e.target.value })} />

                        <label>Artist:</label>
                        <input type="text" onChange={e => setFormData({ ...formData, artist: e.target.value })} />

                        <label>Category:</label>
                        <input type="text" onChange={e => setFormData({ ...formData, category: e.target.value })} />

                        <label>Manufacturer:</label>
                        <input type="text" onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />

                        <label>Date of Publication:</label>
                        <input type="number" onChange={e => setFormData({ ...formData, year: e.target.value })} />

                        <label>Condition:</label>
                        <select
                            value={formData.condition}
                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                        >
                            <option value="New">New</option>
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

                    {/* Right Column */}
                    <div className="form-column">
                        <label>Songs:</label>
                        {songs.map((song, index) => (
                            <div key={index} className="list-item-input">
                                <span>{index + 1}. </span>
                                <input
                                    type="text"
                                    value={song}
                                    onChange={(e) => handleSongChange(index, e.target.value)} />
                            </div>
                        ))}
                        <button type="button" onClick={addSongField} className="add-small-btn">+</button>

                        <label style={{ marginTop: '20px' }}>Photos:</label>
                        <div className="photo-upload-section">
                            <input
                                type="file"
                                id="photo-input"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                style={{ display: 'none' }} />
                            <button type="button" onClick={() => document.getElementById('photo-input').click()}>
                                Select Images
                            </button>
                            <button type="button" className="add-small-btn" onClick={() => document.getElementById('photo-input').click()}>+</button>
                            <div className="photo-previews">
                                {photos.map((p, i) => <img key={i} src={p} alt="preview" width="50" />)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="full-width">
                    <label>Description:</label>
                    <textarea onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="form-actions">
                    <button type="submit">Add</button>
                    <button type="button" onClick={() => navigate('/')}>Cancel</button>
                </div>
            </form>
        </div>
    );
}
