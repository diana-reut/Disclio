import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { initialCDs } from './models/CDs';
import './App.css'
import { AddCDForm } from './forms/AddCDForm';
import { DetailsView } from './views/DetailsView';
import { MasterView } from './views/MasterView';

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