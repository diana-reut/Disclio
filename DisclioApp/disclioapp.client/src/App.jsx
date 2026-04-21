import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
    const [cds, setCds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchCDs = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/cds');
            const data = await res.json();
            setCds(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCDs();
    }, []);

    const deleteCD = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/cds/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchCDs();
            }
        } catch (error) {
            console.error("Network error while deleting:", error);
        }
    };

    const saveCD = async (cd, id) => {
        try {
            const url = id
                ? `http://localhost:8080/api/cds/${id}`
                : 'http://localhost:8080/api/cds';

            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cd),
            });

            if (response.ok) {
                await fetchCDs();
            } else {
                console.error("Save failed");
            }
        } catch (err) {
            console.error("Network error:", err);
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
                            cds={cds}
                            deleteCD={deleteCD}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                        />
                     </ProtectedRoute>
                } />
                <Route path="/grid-view" element={
                    <ProtectedRoute>
                        <GridView
                            cds={cds}
                            deleteCD={deleteCD}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                        />
                     </ProtectedRoute>
                } />
                <Route path="/add" element={
                    <ProtectedRoute>
                        <AddCDForm saveCD={saveCD} />
                    </ProtectedRoute>
                } />

                <Route path="/edit/:id" element={
                    <ProtectedRoute>
                        <AddCDForm saveCD={saveCD} />
                    </ProtectedRoute>
                } />
                <Route path="/details/:id" element={
                    <ProtectedRoute>
                        <DetailsView/>
                    </ProtectedRoute>
                } />
                <Route path="/details/:id/songs" element={
                    <ProtectedRoute>
                        <SongListView/>
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
                            saveCD={saveCD}
                            deleteCD={deleteCD}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                        />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
}

export default App;