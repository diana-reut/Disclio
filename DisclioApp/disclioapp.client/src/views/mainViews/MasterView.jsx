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
                        {currentItems.map((cd, rowIndex) => (
                            <tr
                                key={indexOfFirstItem + rowIndex}
                                onClick={() => navigate(`/details/${indexOfFirstItem + rowIndex}`)}
                                className="table-row-hover"
                                style={{ perspective: "1000px" }} 
                            >
                                {[
                                    { label: "ID", content: indexOfFirstItem + rowIndex + 1 },
                                    { label: "Cover", content: <img className="cover-image-small" src={cd.cover} alt={cd.title} /> },
                                    { label: "Title", content: cd.title },
                                    { label: "Artist", content: cd.artist },
                                    {
                                        label: "Actions", content: (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button className="small-btn" onClick={(e) => { e.stopPropagation(); navigate(`/edit/${indexOfFirstItem + rowIndex}`); }}>Edit</button>
                                                <button className="small-btn" onClick={(e) => { e.stopPropagation(); deleteCD(indexOfFirstItem + rowIndex); }}>🗑️</button>
                                            </div>
                                        )
                                    }
                                ].map((column, colIndex) => (
                                    <td
                                        key={colIndex}
                                        data-label={column.label}
                                        className="table-cell-animate"
                                        style={{
                                            
                                            animationDelay: `${(rowIndex * 0.15) + (colIndex * 0.05)}s`
                                        }}
                                    >
                                        {column.content}
                                    </td>
                                ))}
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
