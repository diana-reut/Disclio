import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AddCDForm } from './AddCDForm';

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

// Mock global fetch for GraphQL
global.fetch = jest.fn();

describe('AddCDForm Component', () => {
    const mockSaveCD = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders empty form in "Add" mode', () => {
        render(
            <MemoryRouter>
                <AddCDForm saveCD={mockSaveCD} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Add/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Title:/i).value).toBe('');
    });

    test('shows validation errors when submitting empty required fields', async () => {
        render(
            <MemoryRouter>
                <AddCDForm saveCD={mockSaveCD} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /Add/i }));

        // Check if error class is applied (logic uses state to toggle error-shake)
        const titleInput = screen.getByLabelText(/Title:/i);
        expect(titleInput).toHaveClass('error-shake');
        expect(mockSaveCD).not.toHaveBeenCalled();
    });

    test('updates form fields on user input', () => {
        render(
            <MemoryRouter>
                <AddCDForm saveCD={mockSaveCD} />
            </MemoryRouter>
        );

        const titleInput = screen.getByLabelText(/Title:/i);
        fireEvent.change(titleInput, { target: { value: 'Dark Side of the Moon' } });
        expect(titleInput.value).toBe('Dark Side of the Moon');
    });

    test('adds and removes song fields', () => {
        render(
            <MemoryRouter>
                <AddCDForm saveCD={mockSaveCD} />
            </MemoryRouter>
        );

        const addButton = screen.getByText('+');
        fireEvent.click(addButton);

        const songInputs = screen.getAllByRole('textbox');
        // Filter to find the one in the "Songs" section or count by index label
        expect(screen.getByText('1.')).toBeInTheDocument();

        const removeButton = screen.getByText('🗑️');
        fireEvent.click(removeButton);
        expect(screen.queryByText('1.')).not.toBeInTheDocument();
    });

    test('fetches and displays data in "Edit" mode', async () => {
        const mockCDData = {
            data: {
                cd: {
                    title: 'Hybrid Theory',
                    artist: 'Linkin Park',
                    category: 'Rock',
                    manufacturer: 'Warner',
                    year: 2000,
                    condition: 'Mint',
                    rating: 5,
                    description: 'Classic',
                    photos: [],
                    songs: [{ title: 'In the End' }]
                }
            }
        };

        fetch.mockResolvedValueOnce({
            json: async () => mockCDData,
        });

        render(
            <MemoryRouter initialEntries={['/edit/1']}>
                <Routes>
                    <Route path="/edit/:id" element={<AddCDForm saveCD={mockSaveCD} />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait for the loader to disappear and data to populate
        await waitFor(() => {
            expect(screen.getByDisplayValue('Hybrid Theory')).toBeInTheDocument();
        });

        expect(screen.getByText('Update')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Linkin Park')).toBeInTheDocument();
        expect(screen.getByDisplayValue('In the End')).toBeInTheDocument();
    });

    test('calls saveCD and navigates back on successful submit', async () => {
        mockSaveCD.mockResolvedValueOnce({ success: true });
        window.alert = jest.fn(); // Mock alert

        render(
            <MemoryRouter>
                <AddCDForm saveCD={mockSaveCD} />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: 'Discovery' } });
        fireEvent.change(screen.getByLabelText(/Artist:/i), { target: { value: 'Daft Punk' } });

        fireEvent.click(screen.getByRole('button', { name: /Add/i }));

        await waitFor(() => {
            expect(mockSaveCD).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Discovery', artist: 'Daft Punk' }),
                null
            );
            expect(mockedUsedNavigate).toHaveBeenCalledWith(-1);
        });
    });
});