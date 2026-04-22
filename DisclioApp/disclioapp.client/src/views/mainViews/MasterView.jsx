import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterView.css';

export function MasterView({
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
        <div id="main-page" ref={scrollContainerRef}>
            <div className="table-container">
                <div className="table-actions-header">
                    <button className="small-btn" onClick={() => navigate('/add')}>+ Add Album</button>
                    <button className="small-btn" onClick={() => navigate('/stats')}>Stats</button>
                    <button className="small-btn" onClick={() => navigate('/grid-view')}>Grid View</button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cover</th>
                            <th>Title</th>
                            <th>Artist</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {cds.length > 0 ? (
                            cds.map((cd, index) => (
                                <tr
                                    key={cd.id}
                                    onClick={() => navigate(`/details/${cd.id}`)}
                                    className="table-row-hover"
                                >
                                    <td>{index + 1}</td>
                                    <td>
                                        <img className="cover-image-small" src={cd.cover} alt={cd.title} />
                                    </td>
                                    <td>{cd.title}</td>
                                    <td>{cd.artist}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                className="small-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/edit/${cd.id}`);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="small-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteCD(cd.id);
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center' }}>
                                    No CDs found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div ref={lastElementRef} style={{ height: '40px', margin: '20px 0', textAlign: 'center' }}>
                {loading && <p style={{ color: '#666' }}>Loading more albums...</p>}
                {!hasMore && cds.length > 0 && <p style={{ color: '#666' }}>You've reached the end of the collection.</p>}
            </div>
        </div>
    );
}
