import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SongListView } from './SongListView';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    },
}));

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

global.fetch = vi.fn();

const mockData = {
    data: {
        cd: {
            id: 1,
            title: 'Discovery',
            artist: 'Daft Punk',
            photos: ['daft-punk.jpg'],
            songs: [
                { id: '101', title: 'One More Time', trackNumber: 1 },
                { id: '102', title: 'Aerodynamic', trackNumber: 2 }
            ]
        }
    }
};

describe('SongListView Component', () => {
    const mockGetCachedCDById = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockResolvedValue({
            json: async () => mockData,
        });
    });

    function renderComponent() {
        return render(
            <MemoryRouter initialEntries={['/songs/1']}>
                <Routes>
                    <Route path="/songs/:id" element={<SongListView getCachedCDById={mockGetCachedCDById} />} />
                </Routes>
            </MemoryRouter>
        );
    }

    function getSongEditorInputs() {
        return screen.getAllByRole('textbox').filter((input) =>
            input.classList.contains('song-edit-input')
        );
    }

    test('renders songs and album art correctly', async () => {
        window.localStorage.setItem('cached_cds', JSON.stringify([{ id: 1, title: 'Old cache' }]));
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('DISCOVERY')).toBeInTheDocument();
        });

        expect(screen.getByText(/01\. One More Time/)).toBeInTheDocument();
        expect(screen.getByAltText('Discovery')).toHaveAttribute('src', 'daft-punk.jpg');
        expect(JSON.parse(window.localStorage.getItem('cached_cds'))).toEqual([
            expect.objectContaining({
                id: 1,
                title: 'Discovery',
                songs: expect.arrayContaining([
                    expect.objectContaining({ title: 'One More Time' })
                ])
            })
        ]);
    });

    test('toggles editing mode and shows inputs', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));

        fireEvent.click(screen.getByText('Edit Songs'));

        expect(screen.getByText('Finish Editing')).toBeInTheDocument();
        expect(getSongEditorInputs()[0]).toHaveValue('One More Time');
        expect(getSongEditorInputs()[1]).toHaveValue('Aerodynamic');
    });

    test('handles song deletion', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));

        fireEvent.click(screen.getByText('Edit Songs'));
        fireEvent.click(screen.getAllByRole('button', { name: /✕/i })[0]);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('DeleteSong')
                })
            );
        });
    });

    test('updates song title on blur', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));

        fireEvent.click(screen.getByText('Edit Songs'));

        const firstSongInput = getSongEditorInputs()[0];
        fireEvent.change(firstSongInput, { target: { value: 'One More Time (Remix)' } });
        fireEvent.blur(firstSongInput);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('One More Time (Remix)')
                })
            );
        });
    });

    test('updates song title when enter is pressed in an editor input', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));

        fireEvent.click(screen.getByText('Edit Songs'));

        const firstSongInput = getSongEditorInputs()[0];
        fireEvent.change(firstSongInput, { target: { value: 'Voyager' } });
        fireEvent.keyDown(firstSongInput, { key: 'Enter' });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"title":"Voyager"')
                })
            );
        });
    });

    test('does not submit an empty song title on blur', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));

        fireEvent.click(screen.getByText('Edit Songs'));
        const initialCallCount = fetch.mock.calls.length;
        const firstSongInput = getSongEditorInputs()[0];

        fireEvent.change(firstSongInput, { target: { value: '   ' } });
        fireEvent.blur(firstSongInput);

        await waitFor(() => {
            expect(fetch.mock.calls).toHaveLength(initialCallCount);
        });
    });

    test('adds a new song from the inline add form', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));

        fireEvent.click(screen.getByText('Edit Songs'));
        fireEvent.change(screen.getByPlaceholderText('New track title...'), {
            target: { value: 'Digital Love' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"title":"Digital Love"')
                })
            );
        });
    });

    test('adds a new song when enter is pressed in the inline form', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));

        fireEvent.click(screen.getByText('Edit Songs'));
        fireEvent.change(screen.getByPlaceholderText('New track title...'), {
            target: { value: 'Harder Better Faster Stronger' }
        });
        fireEvent.keyDown(screen.getByPlaceholderText('New track title...'), { key: 'Enter' });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"title":"Harder Better Faster Stronger"')
                })
            );
        });
    });

    test('shows album not found when the response contains no CD', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => ({ data: { cd: null } }),
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Album not found')).toBeInTheDocument();
        });
    });

    test('falls back to cached song list when fetch fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        fetch.mockRejectedValueOnce(new Error('offline'));
        mockGetCachedCDById.mockReturnValueOnce({
            id: 1,
            title: 'Cached Discovery',
            artist: 'Cached Punk',
            photos: [],
            songs: [{ id: 1, title: 'Cached Track', trackNumber: 1 }]
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('CACHED DISCOVERY')).toBeInTheDocument();
        });

        expect(screen.getByText(/01\. Cached Track/)).toBeInTheDocument();
        consoleErrorSpy.mockRestore();
    });

    test('can delete a song from the right column', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));

        fireEvent.click(screen.getByText('Edit Songs'));
        fireEvent.click(screen.getAllByRole('button', { name: /✕/i })[1]);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"id":102')
                })
            );
        });
    });

    test('shows placeholder art and navigates back', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => ({
                data: {
                    cd: {
                        id: 1,
                        title: 'Sparse Songs',
                        artist: 'Solo',
                        photos: [],
                        songs: []
                    }
                }
            }),
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('SPARSE SONGS')).toBeInTheDocument();
        });

        expect(screen.getByAltText('Sparse Songs')).toHaveAttribute('src', 'placeholder.jpg');
        fireEvent.click(screen.getByText('Back'));
        expect(mockedNavigate).toHaveBeenCalledWith(-1);
    });
});
