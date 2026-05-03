import React, { useState, useEffect, useRef } from 'react';
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
import { addToQueue, getQueue, removeFromQueue } from './hooks/offlineSupport.js';

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

    const GRAPHQL_ENDPOINT = `http://${window.location.hostname}:8080/graphql`;

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

    const syncOfflineData = async () => {
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
                    const response = await fetch(GRAPHQL_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: item.query, variables: item.variables }),
                    });

                    const json = await response.json();

                    if (!json.errors) {
                        await removeFromQueue(item.queueId);
                        console.log(`Successfully synced queue item: ${item.queueId}`);
                    } else {
                        console.error("Server rejected queued item:", json.errors);
                        // You might want to handle persistent errors here so they don't block the queue forever
                    }
                } catch (err) {
                    console.error("Failed to sync item (still offline?):", err);
                    break;
                }
            }

            refresh();

        } catch (error) {
            console.error("Error accessing IndexedDB during sync:", error);
        }
    };

    useEffect(() => {
        const handleOnline = () => {
            console.log("Back online! Triggering sync...");
            // If you need to trigger a React state update after syncing, 
            // you can easily do it from here!
            syncOfflineData();
        };

        if (navigator.onLine) {
            syncOfflineData();
        }

        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);

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
            await addToQueue(payload);
            alert("You are offline. Your changes have been saved locally and will sync when you reconnect.");
            return;
        }

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
            console.error("Network error detected. Saving to IndexedDB:", err);
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
            console.log("ALBUM RATINGS: ", statsMap);
            return statsMap;
        } catch (err) { console.error("Error fetching rating statistics:", err); }
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
            const statsMap = {};
            json.data.songFrequencyStats.forEach(s => statsMap[s.songCount] = s.numberOfCds)
            console.log("SONG STATS:", statsMap);
            return statsMap;
        } catch (err) { console.error("Error fetching song frequency statistics:", err); }
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