import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { initialCDs } from './models/CDs';
import './App.css'
import { AddCDForm } from './forms/AddCDForm';
import { DetailsView } from './views/details/DetailsView';
import { MasterView } from './views/mainViews/MasterView';
import { GridView } from './views/mainViews/GridView';
import { SongListView } from './views/details/SongListView';
import { StatisticsView } from './views/statistics/StatisticsView';
import { DashboardView } from './views/dashboard/DashboardView';
import { LandingPage } from './presentation/LandingPage';
import { AuthView } from './authentication/AuthView'


const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};
function ProtectedRoute({ children }) {
    const isLoggedIn = getCookie('isLoggedIn');

    if (!isLoggedIn) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}

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

    const handleSave = (newCD, index) => {
        if (index !== null) {
            const updated = [...cds];
            updated[index] = newCD;
            setCds(updated);
        } else {
            setCds([...cds, newCD]);
        }
    };

    return (
        <div className="container">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthView />} />
                <Route path="/master-view" element={
                    <ProtectedRoute>
                        <MasterView
                            deleteCD={deleteCD}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            cds={cds}
                            />
                     </ProtectedRoute>
                } />
                <Route path="/grid-view" element={
                    <ProtectedRoute>
                        <GridView
                            deleteCD={deleteCD}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            cds={cds}
                            />
                     </ProtectedRoute>
                } />
                <Route path="/add" element={
                    <ProtectedRoute>
                        <AddCDForm onSave={handleSaveCD} />
                    </ProtectedRoute>
                } />
                <Route path="/edit/:id" element={
                    <ProtectedRoute>
                        <AddCDForm onSave={handleSaveCD} cds={cds} />
                    </ProtectedRoute>
                } />
                <Route path="/details/:id" element={
                    <ProtectedRoute>
                        <DetailsView cds={cds} />
                    </ProtectedRoute>
                } />
                <Route path="/details/:id/songs" element={
                    <ProtectedRoute>
                        <SongListView cds={cds} />
                    </ProtectedRoute>
                } />
                <Route path="/stats" element={
                    <ProtectedRoute>
                        <StatisticsView cds={cds} />
                    </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardView
                            cds={cds}
                            deleteCD={deleteCD}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            onSave={handleSave}
                        />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
}

export default App;