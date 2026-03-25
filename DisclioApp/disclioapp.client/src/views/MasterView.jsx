import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterView.css'

export function MasterView({ currentItems, indexOfFirstItem, deleteCD, currentPage, setCurrentPage, indexOfLastItem, cds }) {
    const navigate = useNavigate();
    return (
        <div id="main-page">
            <div className="table-container">
                <button className="add-btn" onClick={() => navigate('/add')}>+ Add Album</button>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th></th>
                            <th>Title</th>
                            <th>Artist</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((cd, index) => (
                            <tr key={index}>
                                <td>{indexOfFirstItem + index + 1}</td>
                                <td>
                                    <img className="cover-image-small"
                                        src={cd.cover}
                                        alt={cd.title} />
                                </td>
                                <td>{cd.title}</td>
                                <td>{cd.artist}</td>
                                <td>
                                    <button onClick={() => navigate(`/details/${indexOfFirstItem + index}`)}>View</button>
                                    <button id="delete-btn" onClick={() => deleteCD(indexOfFirstItem + index)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                <span> Page {currentPage} </span>
                <button disabled={indexOfLastItem >= cds.length} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
            </div>
        </div>
    );
}
