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
            if (response.ok) refresh();
        } catch (error) {
            console.error("Network error while deleting:", error);
        }
    };

    const saveCD = async (cdData, id) => {
        const isUpdate = !!id;

        const query = isUpdate ? `
        mutation UpdateCD($id: Int!, $title: String!, $artist: String!, $category: String, $manufacturer: String, $year: Int, $condition: String, $rating: Int, $description: String, $photos: [String], $songs: [SongInput]) {
            updateCD(id: $id, title: $title, artist: $artist, category: $category, manufacturer: $manufacturer, year: $year, condition: $condition, rating: $rating, description: $description, photos: $photos, songs: $songs) {
                id
            }
        }
    ` : `
        mutation AddCD($title: String!, $artist: String!, $category: String, $manufacturer: String, $year: Int, $condition: String, $rating: Int, $description: String, $photos: [String], $songs: [SongInput]) {
            addCD(title: $title, artist: $artist, category: $category, manufacturer: $manufacturer, year: $year, condition: $condition, rating: $rating, description: $description, photos: $photos, songs: $songs)
        }
    `;

        // --- CRITICAL FIX START ---
        // Map your string array to an array of objects for the SongInput type
        const sanitizedSongs = (cdData.songs || []).map((song, index) => {
            if (typeof song === 'string') {
                return {
                    title: song,
                    duration: "0:00", // Default value since form only provides title
                    trackNumber: index + 1
                };
            }
            return song; // Already an object
        });
        // --- CRITICAL FIX END ---

        const variables = {
            ...cdData,
            songs: sanitizedSongs // Use the sanitized array here
        };

        if (isUpdate) variables.id = parseInt(id, 10);
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
                alert("GraphQL Error: " + json.errors.message);
                return;
            }
            refresh();
        } catch (err) {
            console.error("Network error:", err);
        }
    };

    const addSong = async (cdId, songData) => {
        const query = `
            mutation AddSong($cdId: Int!, $title: String!, $duration: String, $trackNumber: Int) {
                addSong(cdId: $cdId, title: $title, duration: $duration, trackNumber: $trackNumber) {
                    id
                    title
                }
            }
        `;
        const variables = {
            cdId: parseInt(cdId, 10),
            title: songData.title,
            duration: songData.duration,
            trackNumber: parseInt(songData.trackNumber, 10) || 0
        };

        try {
            await fetch(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables }),
            });
            refresh();
        } catch (err) {
            console.error("Error adding song:", err);
        }
    };

    const fetchRatingStats = async () => {
        const query = `query { ratingStats { rating count } }`;
        try {
            const res = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });
            const json = await res.json();
            const statsMap = {};
            json.data.ratingStats.forEach(s => statsMap[s.rating] = s.count);
            return statsMap;
        } catch (err) { return {}; }
    };

    const fetchSongFrequencyStats = async () => {
        const query = `query { songFrequencyStats { songCount numberOfCds } }`;
        try {
            const res = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });
            const json = await res.json();
            return json.data.songFrequencyStats;
        } catch (err) { return []; }
    };

    return (
        <div className="container">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthView />} />

                <Route path="/master-view" element={
                    <ProtectedRoute>
                        <MasterView cds={cds} deleteCD={deleteCD} loadMore={loadMore} hasMore={hasMore} loading={loading} />
                    </ProtectedRoute>
                } />

                <Route path="/grid-view" element={
                    <ProtectedRoute>
                        <GridView cds={cds} deleteCD={deleteCD} loadMore={loadMore} hasMore={hasMore} loading={loading} />
                    </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardView
                            cds={cds} saveCD={saveCD} deleteCD={deleteCD}
                            fetchRatingStats={fetchRatingStats}
                            loadMore={loadMore} hasMore={hasMore} loading={loading}
                        />
                    </ProtectedRoute>
                } />

                <Route path="/add" element={<ProtectedRoute><AddCDForm saveCD={saveCD} /></ProtectedRoute>} />
                <Route path="/edit/:id" element={<ProtectedRoute><AddCDForm saveCD={saveCD} /></ProtectedRoute>} />
                <Route path="/details/:id" element={<ProtectedRoute><DetailsView /></ProtectedRoute>} />

                {/* RESTORED PROPS */}
                <Route path="/details/:id/songs" element={
                    <ProtectedRoute>
                        <SongListView
                            addSong={addSong}
                        />
                    </ProtectedRoute>
                } />

                <Route path="/stats" element={
                    <ProtectedRoute>
                        <StatisticsView
                            fetchRatingStats={fetchRatingStats}
                            fetchSongFrequencyStats={fetchSongFrequencyStats}
                        />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
}

export default App;