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
                    trackNumber: ''
                })}
            >
                add-song
            </button>
            <div>song-list-view</div>
        </div>
    )
}));

vi.mock('./views/details/DetailsView', () => ({ DetailsView: () => <div>details</div> }));
vi.mock('./views/mainViews/MasterView', () => ({ MasterView: () => <div>master</div> }));
vi.mock('./views/chatView/ChatView', () => ({ ChatView: () => <div>chat</div> }));
vi.mock('./views/statistics/StatisticsView', () => ({
    StatisticsView: ({ fetchRatingStats }) => (
        <div>
            <button type="button" onClick={async () => {
                window.__statsResult = await fetchRatingStats();
            }}>
                fetch-rating-stats
            </button>
            <div>stats</div>
        </div>
    )
}));
vi.mock('./views/dashboard/DashboardView', () => ({ DashboardView: () => <div>dashboard</div> }));
vi.mock('./views/dashboard/AdminDashboard', () => ({ default: () => <div>admin</div> }));
vi.mock('./presentation/LandingPage', () => ({ LandingPage: () => <div>landing</div> }));
vi.mock('./authentication/AuthView', () => ({ AuthView: () => <div>auth</div> }));

let mockAuthenticatedUser;
let customFetchHandler;

const jsonResponse = (payload) => Promise.resolve({
    json: async () => payload
});

const installFetchMock = () => {
    global.fetch = vi.fn().mockImplementation(async (_url, options = {}) => {
        const body = options.body ? JSON.parse(options.body) : {};

        if (body.query?.includes('me')) {
            return jsonResponse({
                data: {
                    me: mockAuthenticatedUser
                }
            });
        }

        if (customFetchHandler) {
            return customFetchHandler(body);
        }

        return jsonResponse({ data: {}, errors: null });
    });
};

describe('App auth and protected flows', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.alert = vi.fn();
        window.__statsResult = undefined;
        mockAuthenticatedUser = {
            username: 'tester',
            firstName: 'Test',
            role: { name: 'USER' }
        };
        customFetchHandler = null;
        mockGetQueue.mockResolvedValue([]);
        Object.defineProperty(window.navigator, 'onLine', {
            value: true,
            configurable: true
        });
        installFetchMock();
    });

    function renderApp(route) {
        return render(
            <MemoryRouter initialEntries={[route]}>
                <App />
            </MemoryRouter>
        );
    }

    test('allows authenticated users into protected routes after loading the backend session', async () => {
        renderApp('/grid-view');
        expect(await screen.findByText('grid-view')).toBeInTheDocument();
    });

    test('redirects protected routes to auth when the backend session is missing', async () => {
        mockAuthenticatedUser = null;
        installFetchMock();

        renderApp('/grid-view');

        expect(await screen.findByText('auth')).toBeInTheDocument();
    });

    test('redirects non-admin users away from admin route', async () => {
        renderApp('/admin');
        expect(await screen.findByText('landing')).toBeInTheDocument();
    });

    test('allows admin users to access admin route', async () => {
        mockAuthenticatedUser = {
            username: 'admin',
            firstName: 'Admin',
            role: { name: 'ADMIN' }
        };
        installFetchMock();

        renderApp('/admin');
        expect(await screen.findByText('admin')).toBeInTheDocument();
    });

    test('creates a CD through the add route and normalizes primitive songs', async () => {
        renderApp('/add');
        fireEvent.click(await screen.findByText('submit-cd'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[1][1].body);
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

    test('preserves structured songs during save', async () => {
        renderApp('/add');
        fireEvent.click(await screen.findByText('submit-structured-cd'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(requestBody.variables.songs).toEqual([
            {
                title: 'Daftendirekt',
                duration: '2:44',
                trackNumber: ''
            }
        ]);
    });

    test('queues CD creation offline', async () => {
        Object.defineProperty(window.navigator, 'onLine', {
            value: false,
            configurable: true
        });

        renderApp('/add');
        fireEvent.click(await screen.findByText('submit-cd'));

        await waitFor(() => {
            expect(mockAddCdOffline).toHaveBeenCalled();
        });
        expect(mockAddToQueue).toHaveBeenCalledWith(expect.objectContaining({
            variables: expect.objectContaining({ title: 'Discovery' })
        }));
        expect(window.alert).toHaveBeenCalledWith('You are offline. Your changes were saved locally and will sync later.');
    });

    test('deletes a CD through the grid route', async () => {
        renderApp('/grid-view');
        fireEvent.click(await screen.findByText('delete-cd'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(requestBody.query).toContain('mutation DeleteCD');
        expect(requestBody.variables).toEqual({ id: 7 });
        expect(mockDeleteCdOffline).toHaveBeenCalledWith(7);
    });

    test('adds a song with blank track numbers normalized to zero', async () => {
        renderApp('/details/7/songs');
        fireEvent.click(await screen.findByText('add-song'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(requestBody.variables.trackNumber).toBe(0);
    });

    test('maps rating statistics from the server response', async () => {
        customFetchHandler = async (body) => {
            if (body.query?.includes('ratingStats')) {
                return jsonResponse({
                    data: {
                        ratingStats: [{ rating: 5, count: 3 }]
                    }
                });
            }
            return jsonResponse({ data: {}, errors: null });
        };

        renderApp('/stats');
        fireEvent.click(await screen.findByText('fetch-rating-stats'));

        await waitFor(() => {
            expect(window.__statsResult).toEqual({ 5: 3 });
        });
    });

    test('syncs queued offline mutations on startup when authenticated and online', async () => {
        mockGetQueue.mockResolvedValue([
            { queueId: 2, query: 'later', variables: { b: 2 }, timestamp: 20 },
            { queueId: 1, query: 'earlier', variables: { a: 1 }, timestamp: 10 }
        ]);

        renderApp('/');

        await waitFor(() => {
            expect(mockRemoveFromQueue).toHaveBeenCalledTimes(2);
        });
        expect(mockRemoveFromQueue).toHaveBeenNthCalledWith(1, 1);
        expect(mockRemoveFromQueue).toHaveBeenNthCalledWith(2, 2);
        expect(mockRefresh).toHaveBeenCalled();
    });
});
