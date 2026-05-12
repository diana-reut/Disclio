import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AddCDForm } from './forms/AddCDForm';
import { DetailsView } from './views/details/DetailsView';
import { MasterView } from './views/mainViews/MasterView';
import { GridView } from './views/mainViews/GridView';
import { SongListView } from './views/details/SongListView';
import { ChatView } from './views/chatView/ChatView';
import { StatisticsView } from './views/statistics/StatisticsView';
import { DashboardView } from './views/dashboard/DashboardView';
import AdminDashboard from './views/dashboard/AdminDashboard';
import { LandingPage } from './presentation/LandingPage';
import { AuthView } from './authentication/AuthView';
import { useCDPagination } from './hooks/useCDPagination';
import { addToQueue, getQueue, removeFromQueue } from './hooks/offlineSupport.js';
import { getGraphQLErrorMessage, graphqlRequest, hasAuthError } from './api/client';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

function ProtectedRoute({ children, currentUser, authReady }) {
    if (!authReady) {
        return <div>Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/auth" replace />;
    }
    return children;
}

const AdminRoute = ({ children, currentUser, authReady }) => {
    if (!authReady) {
        return <div>Loading...</div>;
    }

    if (!currentUser || currentUser.role !== 'ADMIN') {
        return <Navigate to="/" />;
    }
    return children;
};

const normalizeUser = (user) => user
    ? {
        username: user.username,
        firstName: user.firstName,
        role: user.role?.name || 'USER'
    }
    : null;

function App() {
    const isSyncingRef = useRef(false);
    const inactivityTimerRef = useRef(null);
    const currentUserRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const {
        cds,
        loadMore,
        hasMore,
        loading,
        refresh,
        addCdOffline,
        updateCdOffline,
        deleteCdOffline,
        getCachedCDById
    } = useCDPagination(10);
    const isAdmin = currentUser?.role === 'ADMIN';

    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    const deleteCD = async (id) => {
        const query = `
        mutation DeleteCD($id: Int!) {
            deleteCD(id: $id)
        }
    `;

        const variables = { id: parseInt(id, 10) };
        const payload = { query, variables };

        if (!navigator.onLine) {
            deleteCdOffline(id);
            await addToQueue(payload);
            alert("You are offline. Delete was saved locally and will sync later.");
            return;
        }

        try {
            const json = await graphqlRequest({ query, variables });

            if (json.errors) {
                console.error("Delete rejected:", json.errors);
                if (hasAuthError(json)) {
                    setCurrentUser(null);
                }
                alert("Delete failed.");
                return;
            }

            deleteCdOffline(id);
        } catch (error) {
            console.error("Network error while deleting:", error);
            deleteCdOffline(id);
            await addToQueue(payload);
            alert("Network error. Delete was saved offline and will sync later.");
        }
    };

    const syncOfflineData = async () => {
        if (isSyncingRef.current) {
            console.log("Sync already running. Skipping duplicate sync.");
            return;
        }

        isSyncingRef.current = true;
        console.log("Attempting to sync offline data...");

        try {
            const queue = await getQueue();

            if (queue.length === 0) {
                console.log("No offline data to sync.");
                return;
            }

            queue.sort((a, b) => a.timestamp - b.timestamp);

            for (const item of queue) {
                try {
                    const json = await graphqlRequest({
                        query: item.query,
                        variables: item.variables
                    });

                    if (!json.errors) {
                        await removeFromQueue(item.queueId);
                        console.log(`Successfully synced queue item: ${item.queueId}`);
                    } else {
                        console.error("Server rejected queued item:", json.errors);
                        if (hasAuthError(json)) {
                            setCurrentUser(null);
                        }
                        break;
                    }
                } catch (err) {
                    console.error("Failed to sync item:", err);
                    break;
                }
            }

            refresh();
        } catch (error) {
            console.error("Error accessing IndexedDB during sync:", error);
        } finally {
            isSyncingRef.current = false;
        }
    };

    useEffect(() => {
        let ignore = false;

        const loadAuthenticatedUser = async () => {
            try {
                const result = await graphqlRequest({
                    query: `
                        query {
                            me {
                                username
                                firstName
                                role { name }
                            }
                        }
                    `
                });

                if (!ignore) {
                    setCurrentUser(normalizeUser(result.data?.me));
                }
            } catch {
                if (!ignore) {
                    setCurrentUser(null);
                }
            } finally {
                if (!ignore) {
                    setAuthReady(true);
                }
            }
        };

        const handleOnline = () => {
            console.log("Back online! Triggering sync...");
            if (currentUserRef.current) {
                syncOfflineData();
            }
        };

        const handleFocus = () => {
            loadAuthenticatedUser();
        };

        loadAuthenticatedUser();
        window.addEventListener('online', handleOnline);
        window.addEventListener('focus', handleFocus);

        return () => {
            ignore = true;
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    useEffect(() => {
        if (!authReady || !currentUser) {
            if (inactivityTimerRef.current) {
                window.clearTimeout(inactivityTimerRef.current);
            }
            return undefined;
        }

        const logoutForInactivity = async () => {
            try {
                await graphqlRequest({
                    query: `mutation { logout }`
                });
            } catch {
            } finally {
                setCurrentUser(null);
            }
        };

        const resetTimer = () => {
            if (inactivityTimerRef.current) {
                window.clearTimeout(inactivityTimerRef.current);
            }

            inactivityTimerRef.current = window.setTimeout(() => {
                logoutForInactivity();
            }, INACTIVITY_TIMEOUT_MS);
        };

        const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
        activityEvents.forEach(eventName => window.addEventListener(eventName, resetTimer));
        resetTimer();

        return () => {
            activityEvents.forEach(eventName => window.removeEventListener(eventName, resetTimer));
            if (inactivityTimerRef.current) {
                window.clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [authReady, currentUser]);

    useEffect(() => {
        if (authReady && currentUser && navigator.onLine) {
            syncOfflineData();
        }
    }, [authReady, currentUser]);

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

        const sanitizedSongs = (cdData.songs || []).map((song, index) => {
            if (typeof song === 'string') {
                return {
                    title: song,
                    duration: "0:00", 
                    trackNumber: index + 1
                };
            }
            return song; 
        });

        const variables = {
            ...cdData,
            songs: sanitizedSongs 
        };

        if (isUpdate) variables.id = parseInt(id, 10);
        variables.year = variables.year ? parseInt(variables.year, 10) : null;
        variables.rating = variables.rating ? parseInt(variables.rating, 10) : null;

        const payload = { query, variables };

        if (!navigator.onLine) {
            console.log("App is offline. Queuing request...");

            if (isUpdate) {
                updateCdOffline(id, variables);
            } else {
                addCdOffline(variables);
            }

            await addToQueue(payload);
            alert("You are offline. Your changes were saved locally and will sync later.");
            return;
        }

        try {
            const json = await graphqlRequest({ query, variables });

            if (json.errors) {
                console.error("GraphQL Mutation Rejected:", json.errors);
                if (hasAuthError(json)) {
                    setCurrentUser(null);
                }
                alert("GraphQL Error: " + getGraphQLErrorMessage(json));
                return;
            }
            refresh();
        } catch (err) {
            if (isUpdate) {
                updateCdOffline(id, variables);
            } else {
                addCdOffline(variables);
            }

            await addToQueue(payload);
            alert("Network disconnected. Your CD was saved offline and will sync automatically.");
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
            const result = await graphqlRequest({ query, variables });
            if (hasAuthError(result)) {
                setCurrentUser(null);
                return;
            }
            refresh();
        } catch (err) {
            console.error("Error adding song:", err);
        }
    };

    const fetchRatingStats = async () => {
        const query = `query { ratingStats { rating count } }`;
        try {
            const json = await graphqlRequest({ query });
            if (hasAuthError(json)) {
                setCurrentUser(null);
                return {};
            }
            const statsMap = {};
            json.data.ratingStats.forEach(s => statsMap[s.rating] = s.count);
            console.log("ALBUM RATINGS: ", statsMap);
            return statsMap;
        } catch (err) { console.error("Error fetching rating statistics:", err); }
    };

    const fetchSongFrequencyStats = async () => {
        const query = `query { songFrequencyStats { songCount numberOfCds } }`;
        try {
            const json = await graphqlRequest({ query });
            if (hasAuthError(json)) {
                setCurrentUser(null);
                return {};
            }
            const statsMap = {};
            json.data.songFrequencyStats.forEach(s => statsMap[s.songCount] = s.numberOfCds)
            console.log("SONG STATS:", statsMap);
            return statsMap;
        } catch (err) { console.error("Error fetching song frequency statistics:", err); }
    };

    return (
        <div className="container">
            <Routes>
                <Route
                    path="/admin"
                    element={
                        <AdminRoute currentUser={currentUser} authReady={authReady}>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthView onLogin={(user) => setCurrentUser(normalizeUser(user))} />} />

                <Route path="/master-view" element={
                    <ProtectedRoute currentUser={currentUser} authReady={authReady}>
                        <MasterView
                            cds={cds}
                            deleteCD={deleteCD}
                            loadMore={loadMore}
                            hasMore={hasMore}
                            loading={loading}
                            isAdmin={isAdmin}
                        />
                    </ProtectedRoute>
                } />

                <Route path="/grid-view" element={
                    <ProtectedRoute currentUser={currentUser} authReady={authReady}>
                        <GridView
                            cds={cds}
                            deleteCD={deleteCD}
                            loadMore={loadMore}
                            hasMore={hasMore}
                            loading={loading}
                            isAdmin={isAdmin}
                        />
                    </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                    <ProtectedRoute currentUser={currentUser} authReady={authReady}>
                        <DashboardView
                            cds={cds}
                            saveCD={saveCD}
                            deleteCD={deleteCD}
                            fetchRatingStats={fetchRatingStats}
                            fetchSongFrequencyStats={fetchSongFrequencyStats}
                            loadMore={loadMore}
                            hasMore={hasMore}
                            loading={loading}
                            refresh={refresh}
                        />
                    </ProtectedRoute>
                } />

                <Route path="/chat" element={<ProtectedRoute currentUser={currentUser} authReady={authReady}><ChatView currentUser={currentUser} /></ProtectedRoute>} />

                <Route path="/add" element={<ProtectedRoute currentUser={currentUser} authReady={authReady}><AddCDForm saveCD={saveCD} getCachedCDById={getCachedCDById} /></ProtectedRoute>} />
                <Route path="/edit/:id" element={<ProtectedRoute currentUser={currentUser} authReady={authReady}><AddCDForm saveCD={saveCD} getCachedCDById={getCachedCDById} /></ProtectedRoute>} />
                <Route path="/details/:id" element={<ProtectedRoute currentUser={currentUser} authReady={authReady}><DetailsView getCachedCDById={getCachedCDById} /></ProtectedRoute>} />

                <Route path="/details/:id/songs" element={
                    <ProtectedRoute currentUser={currentUser} authReady={authReady}>
                        <SongListView
                            addSong={addSong}
                            getCachedCDById={getCachedCDById}
                        />
                    </ProtectedRoute>
                } />

                <Route path="/stats" element={
                    <ProtectedRoute currentUser={currentUser} authReady={authReady}>
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
