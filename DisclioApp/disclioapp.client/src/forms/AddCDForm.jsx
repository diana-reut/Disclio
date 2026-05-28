import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddCDForm.css';
import { GRAPHQL_ENDPOINT } from '../api/client';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file) {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: 'POST',
            body: formData
        }
    );

    const result = await response.json();

    if (!response.ok || !result.secure_url) {
        throw new Error(result?.error?.message || 'Failed to upload image to Cloudinary.');
    }

    return result.secure_url;
}

export function AddCDForm({ saveCD, getCachedCDById }) {
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
            const query = `query GetCD($id: Int!) { 
                cd(id: $id) { 
                    title artist category manufacturer year condition rating description photos 
                    songs { title } 
                } 
            }`;
            fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({ query, variables: { id: parseInt(id) } })
            })
                .then(res => res.json())
                .then(json => {
                    const data = json.data.cd;

                    const cached = JSON.parse(localStorage.getItem("cached_cds") || "[]");

                    const updated = cached.map(cd =>
                        cd.id === parseInt(id, 10)
                            ? {
                                ...cd,
                                ...data,
                                cover: data.photos?.[0] || cd.cover || null,
                                photos: []
                            }
                            : cd
                    );

                    localStorage.setItem("cached_cds", JSON.stringify(updated));

                    setFormData({ ...data, year: data.year || '' });
                    setSongs(data.songs ? data.songs.map(s => s.title) : []);
                    setPhotos(data.photos || []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch CD for edit:", err);

                    const cachedCd = getCachedCDById(id);

                    if (cachedCd) {
                        setFormData({
                            title: cachedCd.title || '',
                            artist: cachedCd.artist || '',
                            category: cachedCd.category || '',
                            manufacturer: cachedCd.manufacturer || '',
                            year: cachedCd.year || '',
                            condition: cachedCd.condition || 'Very good',
                            rating: cachedCd.rating || 0,
                            description: cachedCd.description || ''
                        });

                        setSongs(cachedCd.songs ? cachedCd.songs.map(s => s.title || s) : []);
                        setPhotos(cachedCd.photos || []);
                    }

                    setLoading(false);
                });
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

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) {
            return;
        }

        try {
            const newPhotos = await Promise.all(files.map(uploadToCloudinary));
            setPhotos(currentPhotos => [...currentPhotos, ...newPhotos]);
        } catch (error) {
            console.error("Failed to process photo upload:", error);
            alert(error.message || "Failed to upload one or more photos.");
        } finally {
            e.target.value = '';
        }
    };

    const removePhoto = (indexToRemove) => {
        setPhotos(currentPhotos => currentPhotos.filter((_, index) => index !== indexToRemove));
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

        const cover = photos.length > 0 ? photos[0] : null;
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
