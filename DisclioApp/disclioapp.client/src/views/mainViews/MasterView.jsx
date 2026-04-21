import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterView.css';

export function MasterView({
    cds,
    deleteCD,
    currentPage,
    setCurrentPage
}) {
    const navigate = useNavigate();

    const itemsPerPage = 5;

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;

    const currentItems = cds.slice(indexOfFirst, indexOfLast);

    return (
        <div id="main-page">
            <div className="table-container">

                <div className="table-actions-header">
                    <button className="small-btn" onClick={() => navigate('/add')}>
                        + Add Album
                    </button>

                    <button className="small-btn" onClick={() => navigate('/stats')}>
                        Stats
                    </button>

                    <button
                        className="small-btn"
                        onClick={() => {
                            setCurrentPage(1);
                            navigate('/grid-view');
                        }}
                    >
                        Grid View
                    </button>
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
                        {currentItems.length > 0 ? (
                            currentItems.map((cd, index) => (
                                <tr
                                    key={cd.id}
                                    onClick={() => navigate(`/details/${cd.id}`)}
                                    className="table-row-hover"
                                >
                                    <td>
                                        {indexOfFirst + index + 1}
                                    </td>

                                    <td>
                                        <img
                                            className="cover-image-small"
                                            src={cd.cover}
                                            alt={cd.title}
                                        />
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

            <div className="pagination">
                <button
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                >
                    Prev
                </button>

                <span>{currentPage}</span>

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