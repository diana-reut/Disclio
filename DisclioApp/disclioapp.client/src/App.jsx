import React, { useState } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { initialCDs } from './models/CDs';
import './App.css'
import { AddCDForm } from './AddCDForm';

function MasterView({ currentItems, indexOfFirstItem, deleteCD, currentPage, setCurrentPage, indexOfLastItem, cds }) {
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
                                        alt={cd.title}
                                    />
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

function DetailsView({ cds }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const cd = cds[id];

    if (!cd) return <h2>CD Not Found</h2>;

    return (
        <div className="detail-page">
            <h2>{cd.title} Details</h2>
            <p><strong>Artist:</strong> {cd.artist}</p>
            <p><strong>Year:</strong> {cd.year}</p>
            <h3>Tracks:</h3>
            <ul>{cd.songs.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <button onClick={() => navigate('/')}>Back</button>
        </div>
    );
}

function App() {
    const [cds, setCds] = useState(initialCDs);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = cds.slice(indexOfFirstItem, indexOfLastItem);

    const addCD = (newCd) => setCds([...cds, newCd]);
    const deleteCD = (index) => setCds(cds.filter((_, i) => i !== index));

    return (
        <div className="container">
            <h1>CD Collection</h1>
            <Routes>
                <Route path="/" element={
                    <>
                        <MasterView currentItems={currentItems} indexOfFirstItem={indexOfFirstItem} deleteCD={deleteCD} currentPage={currentPage} setCurrentPage={setCurrentPage} indexOfLastItem={indexOfLastItem} cds={cds} />
                    </>
                } />
                <Route path="/add" element={<AddCDForm onSave={addCD} />} />
                <Route path="/details/:id" element={<DetailsView cds={cds} />} />
            </Routes>
        </div>
    );
}

export default App;