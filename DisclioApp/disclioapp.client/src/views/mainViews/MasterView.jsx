import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterView.css'

export function MasterView({ deleteCD, currentPage, setCurrentPage, cds }) {
    const navigate = useNavigate();
    const itemsPerPage = 5;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = cds.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div id="main-page">
            <div className="table-container">
                <div className="table-actions-header">
                    <button className="small-btn" onClick={() => navigate('/add')}>+ Add Album</button>
                    <button className="small-btn" onClick={() => navigate('/stats')}>Stats</button>
                    <button className="small-btn" onClick={() => { setCurrentPage(1); navigate('/grid-view')}}>Grid View</button>
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
                        {currentItems.map((cd, index) => (
                            <tr
                                key={index}
                                onClick={() => navigate(`/details/${indexOfFirstItem + index}`)}
                                className="table-row-hover"
                            >
                                <td data-label="ID">{indexOfFirstItem + index + 1}</td>
                                <td data-label="Cover">
                                    <img className="cover-image-small" src={cd.cover} alt={cd.title} />
                                </td>
                                <td data-label="Title">{cd.title}</td>
                                <td data-label="Artist">{cd.artist}</td>
                                <td data-label="Actions">
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            className="small-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/edit/${indexOfFirstItem + index}`);
                                            }}>Edit</button>
                                        <button
                                            className="small-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCD(indexOfFirstItem + index);
                                            }}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                <span> {currentPage} </span>
                <button className="page-btn" disabled={indexOfLastItem >= cds.length} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
            </div>
        </div>
    );
}
