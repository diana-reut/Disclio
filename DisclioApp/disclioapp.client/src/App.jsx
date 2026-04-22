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
        loadMore,
        hasMore,
        loading,
        refresh
    } = useCDPagination(10);

    const GRAPHQL_ENDPOINT = 'http://localhost:8080/graphql';

    const deleteCD = async (id) => {
        const query = `
            mutation DeleteCD($id: Int!) {
                deleteCD(id: $id)
            }
        `;
        try {
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    variables: { id: parseInt(id, 10) }
                }),
            });

            if (response.ok) {
                refresh();
            }
        } catch (error) {
            console.error("Network error while deleting:", error);
        }
    };

    const saveCD = async (cd, id) => {
        const isUpdate = !!id;

        const query = isUpdate ? `
            mutation UpdateCD($id: Int!, $title: String!, $artist: String!, $category: String, $manufacturer: String, $year: Int, $condition: String, $rating: Int, $description: String, $songs: [String], $photos: [String]) {
                updateCD(id: $id, title: $title, artist: $artist, category: $category, manufacturer: $manufacturer, year: $year, condition: $condition, rating: $rating, description: $description, songs: $songs, photos: $photos) {
                    id
                }
            }
        ` : `
            mutation AddCD($title: String!, $artist: String!, $category: String, $manufacturer: String, $year: Int, $condition: String, $rating: Int, $description: String, $songs: [String], $photos: [String]) {
                addCD(title: $title, artist: $artist, category: $category, manufacturer: $manufacturer, year: $year, condition: $condition, rating: $rating, description: $description, songs: $songs, photos: $photos)
            }
        `;

        const variables = { ...cd };

        if (isUpdate) {
            variables.id = parseInt(id, 10);
        }

        variables.year = variables.year ? parseInt(variables.year, 10) : null;
        variables.rating = variables.rating ? parseInt(variables.rating, 10) : null;

        try {
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables }),
            });

            const json = await response.json();

            if (json.errors) {
                console.error("GraphQL Mutation Rejected:", json.errors);
                alert("Failed to save CD. Check the browser console for exact details.");
                return;
            }

            refresh();

        } catch (err) {
            console.error("Network error:", err);
        }
    };

    const fetchRatingStats = async () => {
        const query = `
            query GetRatingStats {
                ratingStats {
                    rating
                    count
                }
            }
        `;
        try {
            const res = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });

            if (!res.ok) throw new Error("Failed to fetch rating stats");

            const json = await res.json();

            const statsMap = {};
            json.data.ratingStats.forEach(stat => {
                statsMap[stat.rating] = stat.count;
            });

            return statsMap;
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
                            loadMore={loadMore}
                            hasMore={hasMore}
                            loading={loading}
                        />
                    </ProtectedRoute>
                } />

                <Route path="/grid-view" element={
                    <ProtectedRoute>
                        <GridView
                            cds={cds}
                            deleteCD={deleteCD}
                            loadMore={loadMore}
                            hasMore={hasMore}
                            loading={loading}
                        />
                    </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardView
                            cds={cds}
                            saveCD={saveCD}
                            deleteCD={deleteCD}
                            fetchRatingStats={fetchRatingStats}
                            loadMore={loadMore}
                            hasMore={hasMore}
                            loading={loading}
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
            </Routes>
        </div>
    );
}

export default App;