import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './GridView.css';

export function GridView({
    cds,
    deleteCD,
    loadMore,
    hasMore,
    loading
}) {
    const navigate = useNavigate();
    const observer = useRef();
    const scrollContainerRef = useRef(null);

    const lastElementRef = useCallback(node => {
        if (loading) return;

        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        }, {
            root: scrollContainerRef.current,
            rootMargin: '100px',
            threshold: 0
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, loadMore]);

    return (
        <div className="grid-view-container" ref={scrollContainerRef}>

            <div className="table-actions-header" style={{ margin: '20px' }}>
                <button
                    className="small-btn"
                    onClick={() => navigate('/add')}
                >
                    + Add Album
                </button>

                <button
                    className="small-btn"
                    onClick={() => navigate('/stats')}
                >
                    See Stats
                </button>

                <button
                    className="small-btn"
                    onClick={() => navigate('/master-view')}
                >
                    Switch to Tabular View
                </button>
            </div>

            <div className="album-grid">
                {cds.length > 0 ? (
                    cds.map(cd => (
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
                    <p className="no-albums">No albums available.</p>
                )}
            </div>

            <div
                ref={lastElementRef}
                style={{ height: '40px', margin: '20px', textAlign: 'center' }}
            >
                {loading && <p style={{ color: '#666' }}>Loading more albums...</p>}
                {!hasMore && cds.length > 0 && (
                    <p style={{ color: '#666' }}>
                        You've reached the end of the collection.
                    </p>
                )}
            </div>

        </div>
    );
}