import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AddCDForm } from './AddCDForm';

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

global.fetch = vi.fn();

describe('AddCDForm Component', () => {
    const mockSaveCD = vi.fn();
    const mockGetCachedCDById = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockSaveCD.mockReset();
        mockGetCachedCDById.mockReset();
        fetch.mockReset();
        window.alert = vi.fn();
        global.URL.createObjectURL = vi.fn((file) => `blob:${file.name}`);
    });

    function renderInAddMode() {
        return render(
            <MemoryRouter>
                <AddCDForm saveCD={mockSaveCD} getCachedCDById={mockGetCachedCDById} />
            </MemoryRouter>
        );
    }

    function renderInEditMode() {
        return render(
            <MemoryRouter initialEntries={['/edit/1']}>
                <Routes>
                    <Route
                        path="/edit/:id"
                        element={<AddCDForm saveCD={mockSaveCD} getCachedCDById={mockGetCachedCDById} />}
                    />
                </Routes>
            </MemoryRouter>
        );
    }

    function getInputAfterLabel(labelText) {
        return screen.getByText(labelText).nextElementSibling;
    }

    test('renders empty form in add mode', () => {
        renderInAddMode();

        expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
        expect(getInputAfterLabel('Title:')).toHaveValue('');
    });

    test('shows validation errors when submitting empty required fields', () => {
        renderInAddMode();

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(getInputAfterLabel('Title:')).toHaveClass('error-shake');
        expect(getInputAfterLabel('Artist:')).toHaveClass('error-shake');
        expect(mockSaveCD).not.toHaveBeenCalled();
    });

    test('updates form fields on user input', () => {
        renderInAddMode();

        const titleInput = getInputAfterLabel('Title:');
        fireEvent.change(titleInput, { target: { value: 'Dark Side of the Moon' } });

        expect(titleInput).toHaveValue('Dark Side of the Moon');
    });

    test('updates optional metadata fields on user input', () => {
        renderInAddMode();

        fireEvent.change(getInputAfterLabel('Category:'), { target: { value: 'Electronic' } });
        fireEvent.change(getInputAfterLabel('Manufacturer:'), { target: { value: 'Virgin' } });
        fireEvent.change(getInputAfterLabel('Year:'), { target: { value: '2001' } });
        fireEvent.change(screen.getByDisplayValue('Very good'), { target: { value: 'Mint' } });
        fireEvent.change(getInputAfterLabel('Description:'), { target: { value: 'A favorite album' } });

        expect(getInputAfterLabel('Category:')).toHaveValue('Electronic');
        expect(getInputAfterLabel('Manufacturer:')).toHaveValue('Virgin');
        expect(getInputAfterLabel('Year:')).toHaveValue(2001);
        expect(screen.getByDisplayValue('Mint')).toBeInTheDocument();
        expect(getInputAfterLabel('Description:')).toHaveValue('A favorite album');
    });

    test('adds and removes song fields', () => {
        renderInAddMode();

        fireEvent.click(screen.getByRole('button', { name: '+' }));
        expect(screen.getByText('1.')).toBeInTheDocument();
        expect(screen.getAllByRole('textbox')).toHaveLength(6);

        const songInput = screen.getAllByRole('textbox')[4];
        fireEvent.change(songInput, { target: { value: 'Digital Love' } });
        expect(songInput).toHaveValue('Digital Love');

        fireEvent.click(screen.getByText('🗑️'));
        expect(screen.queryByText('1.')).not.toBeInTheDocument();
    });

    test('fetches and displays data in edit mode', async () => {
        window.localStorage.setItem('cached_cds', JSON.stringify([{ id: 1, title: 'Old title' }]));
        fetch.mockResolvedValueOnce({
            json: async () => ({
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
            }),
        });

        renderInEditMode();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Hybrid Theory')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Linkin Park')).toBeInTheDocument();
        expect(screen.getByDisplayValue('In the End')).toBeInTheDocument();
        expect(JSON.parse(window.localStorage.getItem('cached_cds'))).toEqual([
            expect.objectContaining({
                id: 1,
                title: 'Hybrid Theory',
                artist: 'Linkin Park'
            })
        ]);
    });

    test('loads cached CD data when the edit fetch fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        fetch.mockRejectedValueOnce(new Error('offline'));
        mockGetCachedCDById.mockReturnValueOnce({
            title: 'Offline Album',
            artist: 'Cached Artist',
            category: 'Rock',
            manufacturer: 'Cached Label',
            year: 1999,
            condition: 'Good',
            rating: 4,
            description: 'Stored locally',
            photos: [],
            songs: ['Cached Song']
        });

        renderInEditMode();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Offline Album')).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue('Cached Artist')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Cached Song')).toBeInTheDocument();
        expect(mockGetCachedCDById).toHaveBeenCalledWith('1');
        consoleErrorSpy.mockRestore();
    });

    test('leaves the edit form empty when fetch fails and no cache exists', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        fetch.mockRejectedValueOnce(new Error('offline'));
        mockGetCachedCDById.mockReturnValueOnce(null);

        renderInEditMode();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
        });

        expect(getInputAfterLabel('Title:')).toHaveValue('');
        expect(getInputAfterLabel('Artist:')).toHaveValue('');
        consoleErrorSpy.mockRestore();
    });

    test('uses safe defaults when fetched edit data omits optional fields', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => ({
                data: {
                    cd: {
                        title: 'Minimal Album',
                        artist: 'Minimal Artist',
                        category: '',
                        manufacturer: '',
                        year: null,
                        condition: 'Very good',
                        rating: 0,
                        description: '',
                        photos: null,
                        songs: null
                    }
                }
            }),
        });

        renderInEditMode();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Minimal Album')).toBeInTheDocument();
        });

        expect(getInputAfterLabel('Year:')).toHaveValue(null);
        expect(screen.queryAllByAltText('preview')).toHaveLength(0);
    });

    test('uses cached fallback defaults for missing values', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        fetch.mockRejectedValueOnce(new Error('offline'));
        mockGetCachedCDById.mockReturnValueOnce({
            title: '',
            artist: '',
            category: undefined,
            manufacturer: undefined,
            year: '',
            condition: undefined,
            rating: undefined,
            description: undefined,
            photos: undefined,
            songs: [{ title: 'Structured Song' }]
        });

        renderInEditMode();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue('Structured Song')).toBeInTheDocument();
        consoleErrorSpy.mockRestore();
    });

    test('calls saveCD and navigates back on successful submit', async () => {
        mockSaveCD.mockResolvedValueOnce({ success: true });
        renderInAddMode();

        fireEvent.change(getInputAfterLabel('Title:'), { target: { value: 'Discovery' } });
        fireEvent.change(getInputAfterLabel('Artist:'), { target: { value: 'Daft Punk' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() => {
            expect(mockSaveCD).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Discovery', artist: 'Daft Punk' }),
                null
            );
        });

        expect(window.alert).toHaveBeenCalledWith('Added successfully!');
        expect(mockedNavigate).toHaveBeenCalledWith(-1);
    });

    test('submits updates with the current route id in edit mode', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => ({
                data: {
                    cd: {
                        title: 'Discovery',
                        artist: 'Daft Punk',
                        category: '',
                        manufacturer: '',
                        year: 2001,
                        condition: 'Mint',
                        rating: 5,
                        description: '',
                        photos: [],
                        songs: []
                    }
                }
            }),
        });
        mockSaveCD.mockResolvedValueOnce({ success: true });

        renderInEditMode();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Discovery')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Update' }));

        await waitFor(() => {
            expect(mockSaveCD).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Discovery', artist: 'Daft Punk' }),
                '1'
            );
        });
        expect(window.alert).toHaveBeenCalledWith('Updated successfully!');
    });

    test('uploads photos, removes them, and submits the cover array', async () => {
        mockSaveCD.mockResolvedValueOnce({ success: true });
        renderInAddMode();

        fireEvent.change(getInputAfterLabel('Title:'), { target: { value: 'Discovery' } });
        fireEvent.change(getInputAfterLabel('Artist:'), { target: { value: 'Daft Punk' } });

        const photoInput = document.querySelector('input[type="file"]');
        expect(photoInput).not.toBeNull();
        const fileA = new File(['a'], 'cover-a.png', { type: 'image/png' });
        const fileB = new File(['b'], 'cover-b.png', { type: 'image/png' });
        fireEvent.change(photoInput, { target: { files: [fileA, fileB] } });

        expect(screen.getAllByAltText('preview')).toHaveLength(2);
        fireEvent.click(screen.getAllByRole('button', { name: 'x' })[0]);
        expect(screen.getAllByAltText('preview')).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() => {
            expect(mockSaveCD).toHaveBeenCalledWith(
                expect.objectContaining({
                    photos: ['blob:cover-b.png'],
                    cover: ['blob:cover-b.png']
                }),
                null
            );
        });
    });

    test('allows rating selection before submit', () => {
        renderInAddMode();

        fireEvent.click(document.querySelectorAll('.star-rating span')[3]);

        expect(
            [...document.querySelectorAll('.star-rating span')].filter((node) => node.textContent === '★')
        ).toHaveLength(4);
    });

    test('alerts when saveCD rejects', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockSaveCD.mockImplementationOnce(() => Promise.reject(new Error('save failed')));
        renderInAddMode();

        fireEvent.change(getInputAfterLabel('Title:'), { target: { value: 'Discovery' } });
        fireEvent.change(getInputAfterLabel('Artist:'), { target: { value: 'Daft Punk' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Failed to save.');
        });
        consoleErrorSpy.mockRestore();
    });

    test('cancel navigates back', () => {
        renderInAddMode();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(mockedNavigate).toHaveBeenCalledWith(-1);
    });

    test('shows loading while edit data is still being fetched', () => {
        fetch.mockImplementationOnce(() => new Promise(() => {}));

        renderInEditMode();

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
});
