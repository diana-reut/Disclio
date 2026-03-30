import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { initialCDs } from './models/CDs';
import './App.css'
import { AddCDForm } from './forms/AddCDForm';
import { DetailsView } from './views/DetailsView';
import { MasterView } from './views/MasterView';
import { GridView } from './views/GridView';
import { SongListView } from './views/SongListView';
import { StatisticsView } from './views/statistics/StatisticsView';
import { LandingPage } from './presentation/LandingPage';
import { AuthView } from './authentication/AuthView'

function App() {
    const [cds, setCds] = useState(initialCDs);
    const [currentPage, setCurrentPage] = useState(1);

    const handleSaveCD = (newCd, id) => {
        if (id !== null && id !== undefined) {
            const updatedCds = [...cds];
            updatedCds[id] = newCd;
            setCds(updatedCds);
        } else {
            setCds([...cds, newCd]);
        }
    };
    const deleteCD = (index) => setCds(cds.filter((_, i) => i !== index));

    return (
        <div className="container">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthView />} />
                <Route path="/master-view" element={
                    <MasterView
                        deleteCD={deleteCD}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        cds={cds}
                    />
                } />
                <Route path="/grid-view" element={
                    <GridView
                        deleteCD={deleteCD}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        cds={cds}
                    />
                } />
                <Route path="/add" element={<AddCDForm onSave={handleSaveCD} />} />
                <Route path="/edit/:id" element={<AddCDForm onSave={handleSaveCD} cds={cds} />} />
                <Route path="/details/:id" element={<DetailsView cds={cds} />} />
                <Route path="/details/:id/songs" element={<SongListView cds={cds} />} />
                <Route path="/stats" element={<StatisticsView cds={cds} />} />
            </Routes>
        </div>
    );
}

export default App;