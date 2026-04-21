import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GridView.css';

export function GridView({
    cds,
    deleteCD,
    currentPage,
    setCurrentPage
}) {
    const navigate = useNavigate();

    const itemsPerPage = 9;

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;

    const currentItems = cds.slice(indexOfFirst, indexOfLast);

    return (
        <div className="grid-view-container">

            <div className="table-actions-header" style={{ margin: '20px' }}>

                <button className="small-btn" onClick={() => navigate('/add')}>
                    + Add Album
                </button>

                <button className="small-btn" onClick={() => navigate('/stats')}>
                    See Stats
                </button>

                <button
                    className="small-btn"
                    onClick={() => {
                        setCurrentPage(1);
                        navigate('/master-view');
                    }}
                >
                    Switch to Tabular View
                </button>

            </div>

            <div className="album-grid">

                {currentItems.length > 0 ? (
                    currentItems.map((cd) => (
                        <div
                            key={cd.id}
                            className="grid-item"
                            onClick={() => navigate(`/details/${cd.id}`)}
                        >
                            <div className="album-card">

                                <img
                                    src={cd.cover}
                                    className="grid-cover"
                                    alt={cd.title}
                                />

                                <div className="album-info-overlay">

                                    <h3 className="grid-title">
                                        {cd.title?.toUpperCase()}
                                    </h3>

                                    <p className="grid-artist">
                                        {cd.artist}
                                    </p>

                                    <footer>
                                        <button
                                            type="button"
                                            className="small-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCD(cd.id);
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </footer>

                                </div>

                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-albums">
                        No albums available.
                    </p>
                )}

            </div>

            <div className="pagination">

                <button
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                >
                    Prev
                </button>

                <span className="pg-text">
                    Page {currentPage}
                </span>

                <button
                    className="page-btn"
                    disabled={indexOfLast >= cds.length}
                    onClick={() => setCurrentPage(p => p + 1)}
                >
                    Next
                </button>

            </div>

        </div>
    );
}