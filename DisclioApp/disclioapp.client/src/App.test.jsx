import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import App from './App';

const {
    mockLoadMore,
    mockRefresh,
    mockAddCdOffline,
    mockUpdateCdOffline,
    mockDeleteCdOffline,
    mockGetCachedCDById,
    mockAddToQueue,
    mockGetQueue,
    mockRemoveFromQueue
} = vi.hoisted(() => ({
    mockLoadMore: vi.fn(),
    mockRefresh: vi.fn(),
    mockAddCdOffline: vi.fn(),
    mockUpdateCdOffline: vi.fn(),
    mockDeleteCdOffline: vi.fn(),
    mockGetCachedCDById: vi.fn(),
    mockAddToQueue: vi.fn(),
    mockGetQueue: vi.fn(),
    mockRemoveFromQueue: vi.fn()
}));

vi.mock('./hooks/useCDPagination', () => ({
    useCDPagination: () => ({
        cds: [{ id: 7, title: 'Discovery', artist: 'Daft Punk', cover: 'cover.jpg' }],
        loadMore: mockLoadMore,
        hasMore: false,
        loading: false,
        refresh: mockRefresh,
        addCdOffline: mockAddCdOffline,
        updateCdOffline: mockUpdateCdOffline,
        deleteCdOffline: mockDeleteCdOffline,
        getCachedCDById: mockGetCachedCDById
    })
}));

vi.mock('./hooks/offlineSupport.js', () => ({
    addToQueue: mockAddToQueue,
    getQueue: mockGetQueue,
    removeFromQueue: mockRemoveFromQueue
}));

vi.mock('./forms/AddCDForm', () => ({
    AddCDForm: ({ saveCD }) => {
        const params = useParams();
        return (
            <div>
                <button
                    type="button"
                    onClick={() => saveCD({
                        title: 'Discovery',
                        artist: 'Daft Punk',
                        year: '2001',
                        rating: '5',
                        songs: ['One More Time']
                    }, params.id ?? null)}
                >
                    submit-cd
                </button>
                <button
                    type="button"
                    onClick={() => saveCD({
                        title: 'Homework',
                        artist: 'Daft Punk',
                        year: '1997',
                        rating: '4',
                        songs: [{ title: 'Daftendirekt', duration: '2:44', trackNumber: '' }]
                    }, params.id ?? null)}
                >
                    submit-structured-cd
                </button>
                <button
                    type="button"
                    onClick={() => saveCD({
                        title: 'Empty Numbers',
                        artist: 'Test Artist',
                        year: '',
                        rating: '',
                        songs: []
                    }, params.id ?? null)}
                >
                    submit-empty-numbers-cd
                </button>
            </div>
        );
    }
}));

vi.mock('./views/mainViews/GridView', () => ({
    GridView: ({ deleteCD }) => (
        <div>
            <button type="button" onClick={() => deleteCD(7)}>
                delete-cd
            </button>
            <div>grid-view</div>
        </div>
    )
}));

vi.mock('./views/details/SongListView', () => ({
    SongListView: ({ addSong }) => (
        <div>
            <button
                type="button"
                onClick={() => addSong('7', {
                    title: 'Digital Love',
                    duration: '4:58',
                    trackNumber: '2'
                })}
            >
                add-song
            </button>
            <button
                type="button"
                onClick={() => addSong('7', {
                    title: 'Track Zero',
                    duration: '',
                    trackNumber: ''
                })}
            >
                add-song-default-track
            </button>
            <div>song-list-view</div>
        </div>
    )
}));

vi.mock('./views/details/DetailsView', () => ({ DetailsView: () => <div>details</div> }));
vi.mock('./views/mainViews/MasterView', () => ({ MasterView: () => <div>master</div> }));
vi.mock('./views/chatView/ChatView', () => ({ ChatView: () => <div>chat</div> }));
vi.mock('./views/statistics/StatisticsView', () => ({
    StatisticsView: ({ fetchRatingStats, fetchSongFrequencyStats }) => (
        <div>
            <button type="button" onClick={async () => {
                const result = await fetchRatingStats();
                window.__statsResult = result;
            }}>
                fetch-rating-stats
            </button>
            <button type="button" onClick={async () => {
                const result = await fetchSongFrequencyStats();
                window.__songStatsResult = result;
            }}>
                fetch-song-stats
            </button>
            <div>stats</div>
        </div>
    )
}));
vi.mock('./views/dashboard/DashboardView', () => ({
    DashboardView: ({ deleteCD }) => (
        <div>
            <button type="button" onClick={() => deleteCD(9)}>
                dashboard-delete
            </button>
            <div>dashboard</div>
        </div>
    )
}));
vi.mock('./views/dashboard/AdminDashboard', () => ({ default: () => <div>admin</div> }));
vi.mock('./presentation/LandingPage', () => ({ LandingPage: () => <div>landing</div> }));
vi.mock('./authentication/AuthView', () => ({ AuthView: () => <div>auth</div> }));

describe('App CRUD operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.alert = vi.fn();
        document.cookie = 'isLoggedIn=true';
        window.localStorage.setItem('currentUser', JSON.stringify({ role: 'USER' }));
        mockGetQueue.mockResolvedValue([]);
        Object.defineProperty(window.navigator, 'onLine', {
            value: true,
            configurable: true
        });
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ data: {}, errors: null })
        });
        window.__statsResult = undefined;
        window.__songStatsResult = undefined;
    });

    function renderApp(route) {
        return render(
            <MemoryRouter initialEntries={[route]}>
                <App />
            </MemoryRouter>
        );
    }

    test('creates a CD through the add route', async () => {
        renderApp('/add');

        fireEvent.click(screen.getByText('submit-cd'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.query).toContain('mutation AddCD');
        expect(requestBody.variables).toEqual(expect.objectContaining({
            title: 'Discovery',
            artist: 'Daft Punk',
            year: 2001,
            rating: 5,
            songs: [
                expect.objectContaining({
                    title: 'One More Time',
                    duration: '0:00',
                    trackNumber: 1
                })
            ]
        }));
        expect(mockRefresh).toHaveBeenCalled();
    });

    test('preserves structured song objects and defaults blank track numbers to zero', async () => {
        renderApp('/add');

        fireEvent.click(screen.getByText('submit-structured-cd'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.variables.songs).toEqual([
            {
                title: 'Daftendirekt',
                duration: '2:44',
                trackNumber: ''
            }
        ]);
    });

    test('updates a CD through the edit route', async () => {
        renderApp('/edit/42');

        fireEvent.click(screen.getByText('submit-cd'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.query).toContain('mutation UpdateCD');
        expect(requestBody.variables.id).toBe(42);
        expect(mockRefresh).toHaveBeenCalled();
    });

    test('normalizes empty numeric fields to null on save', async () => {
        renderApp('/add');

        fireEvent.click(screen.getByText('submit-empty-numbers-cd'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.variables.year).toBeNull();
        expect(requestBody.variables.rating).toBeNull();
    });

    test('queues CD creation offline', async () => {
        Object.defineProperty(window.navigator, 'onLine', {
            value: false,
            configurable: true
        });
        renderApp('/add');

        fireEvent.click(screen.getByText('submit-cd'));

        await waitFor(() => {
            expect(mockAddCdOffline).toHaveBeenCalled();
        });
        expect(mockAddToQueue).toHaveBeenCalledWith(expect.objectContaining({
            variables: expect.objectContaining({ title: 'Discovery' })
        }));
        expect(window.alert).toHaveBeenCalledWith('You are offline. Your changes were saved locally and will sync later.');
    });

    test('queues CD updates offline', async () => {
        Object.defineProperty(window.navigator, 'onLine', {
            value: false,
            configurable: true
        });
        renderApp('/edit/42');

        fireEvent.click(screen.getByText('submit-cd'));

        await waitFor(() => {
            expect(mockUpdateCdOffline).toHaveBeenCalledWith(
                '42',
                expect.objectContaining({ id: 42, title: 'Discovery' })
            );
        });
        expect(mockAddToQueue).toHaveBeenCalled();
    });

    test('handles GraphQL errors during save', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ errors: { message: 'bad mutation' } })
        });

        renderApp('/add');
        fireEvent.click(screen.getByText('submit-cd'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('GraphQL Error: bad mutation');
        });
        expect(mockRefresh).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    test('falls back to offline create on save network failure', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('offline'));

        renderApp('/add');
        fireEvent.click(screen.getByText('submit-cd'));

        await waitFor(() => {
            expect(mockAddCdOffline).toHaveBeenCalled();
        });
        expect(mockAddToQueue).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Network disconnected. Your CD was saved offline and will sync automatically.');
    });

    test('falls back to offline update on save network failure', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('offline'));

        renderApp('/edit/42');
        fireEvent.click(screen.getByText('submit-cd'));

        await waitFor(() => {
            expect(mockUpdateCdOffline).toHaveBeenCalledWith(
                '42',
                expect.objectContaining({ id: 42, title: 'Discovery' })
            );
        });
        expect(mockAddToQueue).toHaveBeenCalled();
    });

    test('deletes a CD through the grid route', async () => {
        renderApp('/grid-view');

        fireEvent.click(screen.getByText('delete-cd'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.query).toContain('mutation DeleteCD');
        expect(requestBody.variables).toEqual({ id: 7 });
        expect(mockDeleteCdOffline).toHaveBeenCalledWith(7);
    });

    test('queues CD deletion offline', async () => {
        Object.defineProperty(window.navigator, 'onLine', {
            value: false,
            configurable: true
        });
        renderApp('/grid-view');

        fireEvent.click(screen.getByText('delete-cd'));

        await waitFor(() => {
            expect(mockDeleteCdOffline).toHaveBeenCalledWith(7);
        });
        expect(mockAddToQueue).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('You are offline. Delete was saved locally and will sync later.');
    });

    test('shows an alert when delete is rejected by GraphQL', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ errors: { message: 'delete failed' } })
        });

        renderApp('/grid-view');
        fireEvent.click(screen.getByText('delete-cd'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Delete failed.');
        });
        expect(mockDeleteCdOffline).not.toHaveBeenCalledWith(7);
        consoleErrorSpy.mockRestore();
    });

    test('falls back to offline queue when delete has a network error', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = vi.fn().mockRejectedValue(new Error('network down'));

        renderApp('/grid-view');
        fireEvent.click(screen.getByText('delete-cd'));

        await waitFor(() => {
            expect(mockDeleteCdOffline).toHaveBeenCalledWith(7);
        });
        expect(mockAddToQueue).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Network error. Delete was saved offline and will sync later.');
        consoleErrorSpy.mockRestore();
    });

    test('creates a song through the song list route', async () => {
        renderApp('/details/7/songs');

        fireEvent.click(screen.getByText('add-song'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.query).toContain('mutation AddSong');
        expect(requestBody.variables).toEqual({
            cdId: 7,
            title: 'Digital Love',
            duration: '4:58',
            trackNumber: 2
        });
        expect(mockRefresh).toHaveBeenCalled();
    });

    test('defaults blank song track numbers to zero in app-level addSong', async () => {
        renderApp('/details/7/songs');

        fireEvent.click(screen.getByText('add-song-default-track'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.variables.trackNumber).toBe(0);
    });

    test('logs song creation errors without throwing', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = vi.fn().mockRejectedValue(new Error('song failed'));

        renderApp('/details/7/songs');
        fireEvent.click(screen.getByText('add-song'));

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding song:', expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });

    test('fetches rating statistics from the stats route', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ data: { ratingStats: [{ rating: 5, count: 3 }] } })
        });

        renderApp('/stats');
        fireEvent.click(screen.getByText('fetch-rating-stats'));

        await waitFor(() => {
            expect(window.__statsResult).toEqual({ 5: 3 });
        });
    });

    test('handles rating statistics fetch failures', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = vi.fn().mockRejectedValue(new Error('stats down'));

        renderApp('/stats');
        fireEvent.click(screen.getByText('fetch-rating-stats'));

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching rating statistics:', expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });

    test('fetches song frequency statistics from the stats route', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ data: { songFrequencyStats: [{ songCount: 10, numberOfCds: 2 }] } })
        });

        renderApp('/stats');
        fireEvent.click(screen.getByText('fetch-song-stats'));

        await waitFor(() => {
            expect(window.__songStatsResult).toEqual({ 10: 2 });
        });
    });

    test('handles song frequency statistics fetch failures', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = vi.fn().mockRejectedValue(new Error('song stats down'));

        renderApp('/stats');
        fireEvent.click(screen.getByText('fetch-song-stats'));

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching song frequency statistics:', expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });

    test('redirects protected routes to auth when logged out', async () => {
        document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

        renderApp('/grid-view');

        expect(await screen.findByText('auth')).toBeInTheDocument();
    });

    test('redirects non-admin users away from admin route', async () => {
        window.localStorage.setItem('currentUser', JSON.stringify({ role: 'USER' }));

        renderApp('/admin');

        expect(await screen.findByText('landing')).toBeInTheDocument();
    });

    test('redirects when there is no stored current user for admin route', async () => {
        window.localStorage.removeItem('currentUser');

        renderApp('/admin');

        expect(await screen.findByText('landing')).toBeInTheDocument();
    });

    test('allows admin users to access admin route', async () => {
        window.localStorage.setItem('currentUser', JSON.stringify({ role: 'ADMIN' }));

        renderApp('/admin');

        expect(await screen.findByText('admin')).toBeInTheDocument();
    });

    test('syncs queued offline mutations on startup when online', async () => {
        mockGetQueue.mockResolvedValue([
            { queueId: 2, query: 'later', variables: { b: 2 }, timestamp: 20 },
            { queueId: 1, query: 'earlier', variables: { a: 1 }, timestamp: 10 }
        ]);
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ data: {}, errors: null })
        });

        renderApp('/');

        await waitFor(() => {
            expect(mockRemoveFromQueue).toHaveBeenCalledTimes(2);
        });
        expect(mockRemoveFromQueue).toHaveBeenNthCalledWith(1, 1);
        expect(mockRemoveFromQueue).toHaveBeenNthCalledWith(2, 2);
        expect(mockRefresh).toHaveBeenCalled();
    });

    test('stops syncing when the server rejects a queued item', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockGetQueue.mockResolvedValue([
            { queueId: 1, query: 'first', variables: {}, timestamp: 10 },
            { queueId: 2, query: 'second', variables: {}, timestamp: 20 }
        ]);
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ errors: { message: 'reject' } })
        });

        renderApp('/');

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Server rejected queued item:', { message: 'reject' });
        });
        expect(mockRemoveFromQueue).not.toHaveBeenCalled();
        expect(mockRefresh).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledTimes(1);
        consoleErrorSpy.mockRestore();
    });

    test('stops syncing when posting a queued item throws', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockGetQueue.mockResolvedValue([
            { queueId: 1, query: 'first', variables: {}, timestamp: 10 }
        ]);
        global.fetch = vi.fn().mockRejectedValue(new Error('sync failed'));

        renderApp('/');

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sync item:', expect.any(Error));
        });
        expect(mockRemoveFromQueue).not.toHaveBeenCalled();
        expect(mockRefresh).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    test('handles IndexedDB queue access failures during sync', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockGetQueue.mockRejectedValue(new Error('indexeddb failed'));

        renderApp('/');

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error accessing IndexedDB during sync:', expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });

    test('skips duplicate sync requests while a sync is already running', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        let releaseQueue;
        mockGetQueue.mockReturnValue(new Promise((resolve) => {
            releaseQueue = resolve;
        }));

        renderApp('/');
        window.dispatchEvent(new Event('online'));

        await waitFor(() => {
            expect(consoleLogSpy).toHaveBeenCalledWith('Sync already running. Skipping duplicate sync.');
        });

        releaseQueue([]);
        consoleLogSpy.mockRestore();
    });
});
