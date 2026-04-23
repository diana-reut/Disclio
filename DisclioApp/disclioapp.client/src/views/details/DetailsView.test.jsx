import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DetailsView } from './DetailsView';

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
}));

// Mock Global Fetch
global.fetch = jest.fn();

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
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderWithRouter = (id = "1") => {
        return render(
            <MemoryRouter initialEntries={[`/details/${id}`]}>
                <Routes>
                    <Route path="/details/:id" element={<DetailsView />} />
                </Routes>
            </MemoryRouter>
        );
    };

    test('shows loading state initially', () => {
        fetch.mockImplementation(() => new Promise(() => { })); // Never resolves
        renderWithRouter();
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    test('renders CD details after successful fetch', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => mockCdData,
        });

        renderWithRouter();

        await waitFor(() => {
            // Title is transformed to uppercase in UI
            expect(screen.getByText('RANDOM ACCESS MEMORIES')).toBeInTheDocument();
        });

        expect(screen.getByText('Daft Punk')).toBeInTheDocument();
        expect(screen.getByText('Columbia')).toBeInTheDocument();
        expect(screen.getByText('A modern classic.')).toBeInTheDocument();
    });

    test('handles "CD Not Found" state', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => ({ data: { cd: null } }),
        });

        renderWithRouter("999");

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

        // Click next arrow
        const nextBtn = screen.getByText('>');
        fireEvent.click(nextBtn);
        expect(screen.getByAltText('Random Access Memories')).toHaveAttribute('src', 'img2.jpg');

        // Click thumbnail
        const thumbnails = screen.getAllByAltText('thumbnail');
        fireEvent.click(thumbnails);
        expect(screen.getByAltText('Random Access Memories')).toHaveAttribute('src', 'img1.jpg');
    });

    test('navigation buttons call navigate function', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => mockCdData,
        });

        renderWithRouter();

        await waitFor(() => {
            const backBtn = screen.getByText(/← Back/i);
            fireEvent.click(backBtn);
            expect(mockedNavigate).toHaveBeenCalledWith(-1);

            const editBtn = screen.getByText(/Edit/i);
            fireEvent.click(editBtn);
            expect(mockedNavigate).toHaveBeenCalledWith('/edit/1');
        });
    });

    test('handles fetch error gracefully', async () => {
        console.error = jest.fn(); // Suppress console error in test output
        fetch.mockRejectedValueOnce(new Error('API Down'));

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText(/CD Not Found/i)).toBeInTheDocument();
        });
    });
});