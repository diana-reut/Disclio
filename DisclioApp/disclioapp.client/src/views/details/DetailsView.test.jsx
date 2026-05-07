import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DetailsView } from './DetailsView';

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

global.fetch = vi.fn();

const mockCdData = {
    data: {
        cd: {
            id: 1,
            title: 'Random Access Memories',
            artist: 'Daft Punk',
            category: 'Electronic',
            manufacturer: 'Columbia',
            year: 2013,
            condition: 'Mint',
            rating: 5,
            description: 'A modern classic.',
            photos: ['img1.jpg', 'img2.jpg'],
            songs: [{ id: 101, title: 'Give Life Back to Music' }]
        }
    }
};

describe('DetailsView Component', () => {
    const mockGetCachedCDById = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function renderWithRouter(id = '1') {
        return render(
            <MemoryRouter initialEntries={[`/details/${id}`]}>
                <Routes>
                    <Route path="/details/:id" element={<DetailsView getCachedCDById={mockGetCachedCDById} />} />
                </Routes>
            </MemoryRouter>
        );
    }

    test('shows loading state initially', () => {
        fetch.mockImplementation(() => new Promise(() => {}));

        renderWithRouter();

        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    test('renders CD details after successful fetch', async () => {
        window.localStorage.setItem('cached_cds', JSON.stringify([{ id: 1, title: 'Old Album' }]));
        fetch.mockResolvedValueOnce({
            json: async () => mockCdData,
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('RANDOM ACCESS MEMORIES')).toBeInTheDocument();
        });

        expect(screen.getByText('Daft Punk')).toBeInTheDocument();
        expect(screen.getByText('Columbia')).toBeInTheDocument();
        expect(screen.getByText('A modern classic.')).toBeInTheDocument();
        expect(JSON.parse(window.localStorage.getItem('cached_cds'))).toEqual([
            expect.objectContaining({
                id: 1,
                title: 'Random Access Memories'
            })
        ]);
    });

    test('handles CD not found state', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => ({ data: { cd: null } }),
        });

        renderWithRouter('999');

        await waitFor(() => {
            expect(screen.getByText(/CD Not Found/i)).toBeInTheDocument();
        });
    });

    test('gallery navigation works correctly', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => mockCdData,
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByAltText('Random Access Memories')).toHaveAttribute('src', 'img1.jpg');
        });

        fireEvent.click(screen.getByText('>'));
        expect(screen.getByAltText('Random Access Memories')).toHaveAttribute('src', 'img2.jpg');

        fireEvent.click(screen.getAllByAltText('thumbnail')[0]);
        expect(screen.getByAltText('Random Access Memories')).toHaveAttribute('src', 'img1.jpg');
    });

    test('navigation buttons call navigate', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => mockCdData,
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('RANDOM ACCESS MEMORIES')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(mockedNavigate).toHaveBeenCalledWith(-1);

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        expect(mockedNavigate).toHaveBeenCalledWith('/edit/1');
    });

    test('handles fetch error gracefully', async () => {
        console.error = vi.fn();
        fetch.mockRejectedValueOnce(new Error('API Down'));
        mockGetCachedCDById.mockReturnValueOnce(null);

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText(/CD Not Found/i)).toBeInTheDocument();
        });
    });

    test('falls back to cached CD details when fetch fails', async () => {
        fetch.mockRejectedValueOnce(new Error('offline'));
        mockGetCachedCDById.mockReturnValueOnce({
            id: 1,
            title: 'Cached Memories',
            artist: 'Cache Punk',
            category: 'Electronic',
            manufacturer: 'Offline Records',
            year: 2012,
            condition: 'Near Mint',
            rating: 4,
            description: 'Cached description',
            photos: ['cached.jpg'],
            songs: [{ id: 1, title: 'Cached Song' }]
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('CACHED MEMORIES')).toBeInTheDocument();
        });

        expect(screen.getByText('Cache Punk')).toBeInTheDocument();
        expect(screen.getByText('Cached description')).toBeInTheDocument();
    });

    test('handles GraphQL error responses by falling back to cache', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        fetch.mockResolvedValueOnce({
            json: async () => ({ errors: { message: 'graphql failed' } }),
        });
        mockGetCachedCDById.mockReturnValueOnce({
            id: 1,
            title: 'Fallback Album',
            artist: 'Fallback Artist',
            photos: [],
            songs: []
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('FALLBACK ALBUM')).toBeInTheDocument();
        });
        consoleErrorSpy.mockRestore();
    });

    test('shows placeholder image and description fallback when data is sparse', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => ({
                data: {
                    cd: {
                        id: 1,
                        title: 'Sparse Album',
                        artist: 'Minimal Artist',
                        category: 'Electronic',
                        manufacturer: 'None',
                        year: 2010,
                        condition: 'Good',
                        rating: 0,
                        description: '',
                        photos: [],
                        songs: null
                    }
                }
            }),
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('SPARSE ALBUM')).toBeInTheDocument();
        });

        expect(screen.getByAltText('Sparse Album')).toHaveAttribute('src', 'placeholder.jpg');
        expect(screen.getByText('No description provided.')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.queryByText('>')).not.toBeInTheDocument();
    });
});
