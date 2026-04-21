import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { AddCDForm } from './forms/AddCDForm';
import { DetailsView } from './views/details/DetailsView';
import { MasterView } from './views/mainViews/MasterView';
import { GridView } from './views/mainViews/GridView';
import { SongListView } from './views/details/SongListView';
import { StatisticsView } from './views/statistics/StatisticsView';
import { DashboardView } from './views/dashboard/DashboardView';
import { LandingPage } from './presentation/LandingPage';
import { AuthView } from './authentication/AuthView';

import { useCDPagination } from './hooks/useCDPagination';

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
    const {
        cds,
        currentPage,
        goToPage,
        nextPage,
        prevPage,
        totalPages,
        refresh
    } = useCDPagination(5);

    const deleteCD = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/cds/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                refresh();
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cd),
            });

            if (response.ok) {
                refresh();
            }
        } catch (err) {
            console.error("Network error:", err);
        }
    };

    const fetchRatingStats = async () => {
        try {
            const res = await fetch(
                "http://localhost:8080/api/cds/stats/ratings"
            );

            if (!res.ok) {
                throw new Error("Failed to fetch rating stats");
            }

            return await res.json(); // {1: x, 2: y, ...}
        } catch (err) {
            console.error("Rating stats error:", err);
            return {};
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
                            goToPage={goToPage}
                            nextPage={nextPage}
                            prevPage={prevPage}
                            totalPages={totalPages}
                        />
                    </ProtectedRoute>
                } />

                <Route path="/grid-view" element={
                    <ProtectedRoute>
                        <GridView
                            cds={cds}
                            deleteCD={deleteCD}
                            currentPage={currentPage}
                            goToPage={goToPage}
                            nextPage={nextPage}
                            prevPage={prevPage}
                            totalPages={totalPages}
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
                        <DetailsView />
                    </ProtectedRoute>
                } />

                <Route path="/details/:id/songs" element={
                    <ProtectedRoute>
                        <SongListView />
                    </ProtectedRoute>
                } />

                <Route path="/stats" element={
                    <ProtectedRoute>
                        <StatisticsView fetchRatingStats={fetchRatingStats} />
                    </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardView
                            cds={cds}
                            saveCD={saveCD}
                            deleteCD={deleteCD}
                            currentPage={currentPage}
                            goToPage={goToPage}
                            nextPage={nextPage}
                            prevPage={prevPage}
                            totalPages={totalPages}
                            fetchRatingStats={fetchRatingStats}
                        />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
}

export default App;