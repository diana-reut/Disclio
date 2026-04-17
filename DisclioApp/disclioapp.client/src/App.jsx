import React, { useState, useEffect, useRef } from 'react';
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
    const [cds, setCds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const hasInitialized = useRef(false);

    useEffect(() => {
        const syncAndLoadData = async () => {
            if (hasInitialized.current) return;
            hasInitialized.current = true;

            try {
                const response = await fetch('http://localhost:8080/api/cds');
                const dataFromJava = await response.json();

                setCds(dataFromJava);
                console.log("Data loaded from Spring Boot RAM");
            } catch (error) {
                console.error("Failed to fetch from backend:", error);
            }
        };

        syncAndLoadData();
    }, []);

    const handleSaveCD = (newCd, id) => {
        if (id !== null && id !== undefined) {
            const updatedCds = [...cds];
            updatedCds[id] = newCd;
            setCds(updatedCds);
        } else {
            setCds([...cds, newCd]);
        }
    };

    const deleteCD = async (index) => {
        try {
            const response = await fetch(`http://localhost:8080/api/cds/${index}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setCds(prevCds => prevCds.filter((_, i) => i !== index));
                console.log(`Deleted index ${index} from RAM`);
            } else {
                alert("Failed to delete from server.");
            }
        } catch (error) {
            console.error("Network error while deleting:", error);
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
                            onSave={handleSaveCD}
                        />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
}

export default App;