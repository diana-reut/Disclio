import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SongListView } from './SongListView';
import { vi, describe, beforeEach, test, expect } from 'vitest';

// 1. Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    },
    AnimatePresence: ({ children }) => children,
}));

// 2. Mock Navigation
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

// Setup global fetch mock
globalThis.fetch = vi.fn();

const mockData = {
    data: {
        cd: {
            id: 1,
            title: 'Discovery',
            artist: 'Daft Punk',
            photos: 'daft-punk.jpg',
            songs: [
                { id: "101", title: 'One More Time', trackNumber: 1 },
                { id: "102", title: 'Aerodynamic', trackNumber: 2 }
            ]
        }
    }
};

describe('SongListView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockResolvedValue({
            json: async () => mockData,
        });
    });

    const renderComponent = () => render(
        <MemoryRouter initialEntries={['/songs/1']}>
            <Routes>
                <Route path="/songs/:id" element={<SongListView />} />
            </Routes>
        </MemoryRouter>
    );

    test('renders songs and album art correctly', async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByText('DISCOVERY')).toBeInTheDocument();
            expect(screen.getByText(/01. One More Time/)).toBeInTheDocument();
        });
    });

    test('toggles editing mode and shows inputs', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));

        fireEvent.click(screen.getByText('Edit Songs'));

        expect(screen.getByText('Finish Editing')).toBeInTheDocument();

        // Fix: getAllByRole returns an array, so we pick the first one
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.value).toBe('One More Time');
    });

    test('handles song deletion', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Edit Songs'));
        fireEvent.click(screen.getByText('Edit Songs'));

        const deleteButtons = screen.getAllByText('✕');
        fireEvent.click(deleteButtons); // Click the first delete button

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

        const songInputs = screen.getAllByRole('textbox');
        fireEvent.change(songInputs, { target: { value: 'One More Time (Remix)' } });
        fireEvent.blur(songInputs);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('One More Time (Remix)')
                })
            );
        });
    });
});