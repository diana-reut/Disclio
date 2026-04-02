import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AddCDForm } from './AddCDForm';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mockNavigate = vi.fn();
let mockParams = {};

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockParams,
    };
});

function renderWithRouter(ui, { route = '/' } = {}) {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <Routes>
                <Route path="/" element={ui} />
                <Route path="/edit/:id" element={ui} />
            </Routes>
        </MemoryRouter>
    );
}

describe('AddCDForm', () => {
    let onSave;

    beforeEach(() => {
        onSave = vi.fn();
        mockNavigate.mockClear();
        mockParams = {};
    });

    const getMainInputs = () => {
        const inputs = screen.getAllByRole('textbox');
        return {
            title: inputs[0],
            artist: inputs[1],
            category: inputs[2],
            manufacturer: inputs[3],
            condition: inputs[5]
        };
    };

    it('renders empty form in add mode', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const { title, artist } = getMainInputs();
        expect(title.value).toBe('');
        expect(artist.value).toBe('');
    });

    it('renders existing data in edit mode', () => {
        mockParams = { id: '0' };
        const cds = [{
            title: 'Test Album',
            artist: 'Test Artist',
            category: 'Rock',
            manufacturer: 'Sony',
            year: 2000,
            condition: 'Good',
            rating: 3,
            description: 'desc',
            songs: ['Song 1'],
            photos: ['img.jpg']
        }];
        renderWithRouter(<AddCDForm onSave={onSave} cds={cds} />, { route: '/edit/0' });
        expect(screen.getByDisplayValue('Test Album')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Artist')).toBeInTheDocument();
    });

    it('updates input values', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const { title,
            artist,
            category,
            manufacturer
        } = getMainInputs();
        fireEvent.change(title, { target: { value: 'New Title' } });
        expect(title.value).toBe('New Title');
        fireEvent.change(artist, { target: { value: 'New Artist' } });
        expect(artist.value).toBe('New Artist');
        fireEvent.change(category, { target: { value: 'New Category' } });
        expect(category.value).toBe('New Category');
        fireEvent.change(manufacturer, { target: { value: 'New Manufacturer' } });
        expect(manufacturer.value).toBe('New Manufacturer');
    });

    it('updates the condition select value', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const select = screen.getByLabelText(/condition:/i);
        fireEvent.change(select, { target: { value: 'Mint' } });
        expect(select).toHaveValue('Mint');
    });

    it('updates the year input', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const yearInput = screen.getByLabelText(/Year of Publication:/i);
        fireEvent.change(yearInput, { target: { value: '2024' } });
        expect(yearInput).toHaveValue(2024);
    });

    it('shows validation errors if required fields missing', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        fireEvent.click(screen.getByText(/add/i));
        const { title, artist } = getMainInputs();
        expect(title.className).toContain('error-shake');
        expect(artist.className).toContain('error-shake');
        expect(onSave).not.toHaveBeenCalled();
    });

    it('adds a new song input field', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);

        const addSongButton = screen.getByLabelText(/add song/i);
        const initialInputs = screen.getAllByRole('textbox').length;

        fireEvent.click(addSongButton);

        const afterInputs = screen.getAllByRole('textbox').length;
        expect(afterInputs).toBe(initialInputs + 1);
    });

    it('adds and then updates a song', async () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);

        const addSongButton = screen.getByLabelText(/add song/i);
        fireEvent.click(addSongButton); 

        const allInputs = screen.getAllByRole('textbox');
        const newSongInput = allInputs[allInputs.length - 1];

        fireEvent.change(newSongInput, { target: { value: 'Purple Haze' } });
        expect(newSongInput).toHaveValue('Purple Haze');
    });

    //it('adds a new song field when the plus button is clicked', () => {
    //    renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
    //    const getSongInputs = () => screen.queryAllByRole('textbox').filter(input =>
    //        input.id.includes('song') || input.name === 'song'
    //    );
    //    const initialCount = getSongInputs().length;
    //    const { title, artist } = getMainInputs();
    //    fireEvent.change(title, { target: { value: 'New Title' } });
    //    fireEvent.change(artist, { target: { value: 'New Artist' } });

    //    const addSongButton = screen.getByLabelText(/add song/i);
    //    fireEvent.click(addSongButton);

    //    const finalCount = getSongInputs().length;
    //    expect(finalCount).toBe(initialCount + 1);
    //});

    it('resets validation errors after 500ms', () => {
        vi.useFakeTimers();
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);

        fireEvent.click(screen.getByText(/add/i));
        const { title, artist } = getMainInputs();

        expect(title.className).toContain('error-shake');
        expect(artist.className).toContain('error-shake');

        // wrap timer advance in act() so React state updates are applied
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(title.className).not.toContain('error-shake');
        expect(artist.className).not.toContain('error-shake');

        vi.useRealTimers();
    });

    it('calls onSave with correct data on submit', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const { title, artist } = getMainInputs();
        fireEvent.change(title, { target: { value: 'Album' } });
        fireEvent.change(artist, { target: { value: 'Artist' } });
        fireEvent.click(screen.getByText(/add/i));
        expect(onSave).toHaveBeenCalledTimes(1);
        const savedData = onSave.mock.calls[0][0];
        expect(savedData.title).toBe('Album');
        expect(savedData.artist).toBe('Artist');
        expect(savedData.cover).toBe(null);
    });

    it('navigates back after submit', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const { title, artist } = getMainInputs();
        fireEvent.change(title, { target: { value: 'Album' } });
        fireEvent.change(artist, { target: { value: 'Artist' } });
        fireEvent.click(screen.getByText(/add/i));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('adds and removes song fields', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const before = screen.getAllByRole('textbox').length;
        fireEvent.click(screen.getAllByText('+')[0]);
        const after = screen.getAllByRole('textbox').length;
        expect(after).toBeGreaterThan(before);
        fireEvent.click(screen.getByText('🗑️'));
        expect(screen.queryByText('🗑️')).not.toBeInTheDocument();
    });

    it('sets rating when star is clicked', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const stars = screen.getAllByText('☆');
        fireEvent.click(stars[2]);
        expect(screen.getAllByText('★').length).toBe(3);
        // click lower star after higher one
        fireEvent.click(stars[1]);
        expect(screen.getAllByText('★').length).toBe(2);
    });

    it('handles photo upload', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const file = new File(['test'], 'test.png', { type: 'image/png' });
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        const input = screen.getByTestId('photo-input');
        fireEvent.change(input, { target: { files: [file] } });
        expect(screen.getByAltText('preview')).toBeInTheDocument();
    });

    it('sets cover correctly when multiple photos uploaded', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        const input = screen.getByTestId('photo-input');
        vi.spyOn(URL, 'createObjectURL').mockImplementation(f => f.name);
        fireEvent.change(input, { target: { files: [new File(['a'], 'a.png'), new File(['b'], 'b.png')] } });
        const { title, artist } = getMainInputs();
        fireEvent.change(title, { target: { value: 'Album' } });
        fireEvent.change(artist, { target: { value: 'Artist' } });
        fireEvent.click(screen.getByText(/add/i));
        const savedData = onSave.mock.calls[0][0];
        expect(savedData.cover).toBe('a.png');
    });

    it('removes photo', () => {
        mockParams = { id: '0' };
        const cds = [{ title: '', artist: '', songs: [], photos: ['img.jpg'] }];
        renderWithRouter(<AddCDForm onSave={onSave} cds={cds} />, { route: '/edit/0' });
        fireEvent.click(screen.getByText('x'));
        expect(screen.queryByAltText('preview')).not.toBeInTheDocument();
    });

    it('removes all photos and cover becomes null', () => {
        mockParams = { id: '0' };
        const cds = [{ title: '', artist: '', photos: ['img1.jpg', 'img2.jpg'] }];
        renderWithRouter(<AddCDForm onSave={onSave} cds={cds} />, { route: '/edit/0' });
        fireEvent.click(screen.getAllByText('x')[0]);
        fireEvent.click(screen.getAllByText('x')[0]);
        const { title, artist } = getMainInputs();
        fireEvent.change(title, { target: { value: 'Album' } });
        fireEvent.change(artist, { target: { value: 'Artist' } });
        fireEvent.click(screen.getByText(/update/i));
        const savedData = onSave.mock.calls[0][0];
        expect(savedData.cover).toBe(null);
    });

    it('cancel button navigates back', () => {
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />);
        fireEvent.click(screen.getByText(/cancel/i));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('handles non-existent edit ID gracefully', () => {
        mockParams = { id: '99' };
        renderWithRouter(<AddCDForm onSave={onSave} cds={[]} />, { route: '/edit/99' });
        expect(screen.getByLabelText(/title/i).value).toBe('');
        expect(screen.getByLabelText(/artist/i).value).toBe('');
    });
});