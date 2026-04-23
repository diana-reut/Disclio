import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddCDForm.css';

export function AddCDForm({ saveCD }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = id !== undefined;

    const [loading, setLoading] = useState(isEditMode);

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

    const [songs, setSongs] = useState([]);
    const [photos, setPhotos] = useState([]);

    const [errors, setErrors] = useState({ title: false, artist: false });

    useEffect(() => {
        if (isEditMode) {
            // Using GraphQL instead of REST to be consistent with the app
            const query = `query GetCD($id: Int!) { 
                cd(id: $id) { 
                    title artist category manufacturer year condition rating description photos 
                    songs { title } 
                } 
            }`;
            fetch(`http://localhost:8080/graphql`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, variables: { id: parseInt(id) } })
            })
                .then(res => res.json())
                .then(json => {
                    const data = json.data.cd;
                    setFormData({ ...data, year: data.year || '' });
                    // Convert object array back to string array for the form inputs
                    setSongs(data.songs ? data.songs.map(s => s.title) : []);
                    setPhotos(data.photos || []);
                    setLoading(false);
                })
                .catch(err => setLoading(false));
        }
    }, [id, isEditMode]);

const handleSongChange = (index, value) => {
    const newSongs = [...songs];
    newSongs[index] = value;
    setSongs(newSongs);
};

const addSongField = () => setSongs([...songs, '']);

const removeSongField = (indexToRemove) => {
    setSongs(songs.filter((_, index) => index !== indexToRemove));
};

const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => URL.createObjectURL(file));
    setPhotos([...photos, ...newPhotos]);
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

        try {
            await saveCD(cdPayload, isEditMode ? id : null);

            alert(isEditMode ? "Updated successfully!" : "Added successfully!");
            navigate(-1);

        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save.");
        }
    };

if (loading) return <p>Loading...</p>;

return (
    <div id="form-container">
        <form onSubmit={handleSubmit} className="album-form">
            <div className="form-grid">

                <div className="form-column">
                    <label>Title:</label>
                    <input
                        type="text"
                        className={`form-input ${errors.title ? "error-shake" : ""}`}
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />

                    <label>Artist:</label>
                    <input
                        type="text"
                        className={`form-input ${errors.artist ? "error-shake" : ""}`}
                        value={formData.artist}
                        onChange={e => setFormData({ ...formData, artist: e.target.value })}
                    />

                    <label>Category:</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                    />

                    <label>Manufacturer:</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.manufacturer}
                        onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                    />

                    <label>Year:</label>
                    <input
                        type="number"
                        className="form-input"
                        value={formData.year}
                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                    />

                    <label>Condition:</label>
                    <select
                        className="form-input"
                        value={formData.condition}
                        onChange={e => setFormData({ ...formData, condition: e.target.value })}
                    >
                        <option>Mint</option>
                        <option>Near Mint</option>
                        <option>Very good</option>
                        <option>Good</option>
                        <option>Fair</option>
                        <option>Poor</option>
                    </select>

                    <label>Rating:</label>
                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map(star => (
                            <span
                                key={star}
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
                            <span>{index + 1}.</span>
                            <input
                                type="text"
                                className="form-input"
                                value={song}
                                onChange={(e) => handleSongChange(index, e.target.value)}
                            />
                            <button type="button" onClick={() => removeSongField(index)}>🗑️</button>
                        </div>
                    ))}
                    <button type="button" onClick={addSongField}>+</button>

                    <label style={{ marginTop: '20px' }}>Photos:</label>
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} />
                    <div>
                        {photos.map((p, i) => (
                            <div key={i}>
                                <img src={p} alt="preview" width="50" />
                                <button type="button" onClick={() => removePhoto(i)}>x</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <label>Description:</label>
                <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="form-actions">
                <button type="submit">{isEditMode ? "Update" : "Add"}</button>
                <button type="button" onClick={() => navigate(-1)}>Cancel</button>
            </div>
        </form>
    </div>
);
}