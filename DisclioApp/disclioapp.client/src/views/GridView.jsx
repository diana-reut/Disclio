import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GridView.css';

export function GridView({ deleteCD, currentPage, setCurrentPage, cds }) {
    const navigate = useNavigate();

    const itemsPerPage = 9;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = cds.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="grid-view-container">
            <div className="table-actions-header" style={{ margin: '20px' }}>
                <button className="small-btn" onClick={() => navigate('/add')} style={{ color: 'white' }}>
                    + Add Album
                </button>
                <button className="small-btn" onClick={() => navigate('/')} style={{ color: 'white' }}>
                    Switch to Tabular View
                </button>
            </div>
            <div className="album-grid">
                {currentItems.map((cd, index) => (
                    <div
                        key={index}
                        className="grid-item"
                        onClick={() => navigate(`/details/${indexOfFirstItem + index}`)}
                    >
                        <div className="album-card">
                            <img src={cd.cover} className="grid-cover" alt={cd.title} />

                            <div className="album-info-overlay">
                                <h3 className="grid-title">{cd.title.toUpperCase()}</h3>
                                <p className="grid-artist">{cd.artist}</p>
                                <footer> <button
                                    type="button"
                                    className="small-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteCD(indexOfFirstItem + index)
                                    }}>
                                    🗑️
                                </button></footer>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="pagination">
                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                <span className="pg-text" > Page {currentPage} </span>
                <button className="page-btn" disabled={indexOfLastItem >= cds.length} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
            </div>
        </div>
    );
}