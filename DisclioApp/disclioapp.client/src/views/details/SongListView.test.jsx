import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { SongListView } from './SongListView';

// mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

const mockCds = [
    {
        title: 'Test Album',
        artist: 'Test Artist',
        cover: 'cover.jpg',
        rating: 3,
        songs: ['Song1', 'Song2', 'Song3', 'Song4']
    }
];

function renderComponent(id = "0", cds = mockCds) {
    return render(
        <MemoryRouter initialEntries={[`/details/${id}/songs`]}>
            <Routes>
                <Route path="/details/:id/songs" element={<SongListView cds={cds} />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('SongListView Full Coverage (Vitest)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders album not found when cd is missing', () => {
        renderComponent("5");

        expect(screen.getByText('Album not found')).toBeInTheDocument();
    });

    test('renders album info correctly', () => {
        renderComponent();

        expect(screen.getByText('TEST ALBUM')).toBeInTheDocument();
        expect(screen.getByText('Test Artist')).toBeInTheDocument();

        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'cover.jpg');
    });

    test('renders songs split into two columns', () => {
        renderComponent();

        // Left column (first half)
        expect(screen.getByText('01. Song1')).toBeInTheDocument();
        expect(screen.getByText('02. Song2')).toBeInTheDocument();

        // Right column (second half)
        expect(screen.getByText('03. Song3')).toBeInTheDocument();
        expect(screen.getByText('04. Song4')).toBeInTheDocument();
    });

    test('formats song numbers with leading zeros', () => {
        renderComponent();

        expect(screen.getByText(/^01\./)).toBeInTheDocument();
        expect(screen.getByText(/^02\./)).toBeInTheDocument();
    });

    test('back button navigates back', () => {
        renderComponent();

        fireEvent.click(screen.getByText('Back'));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test('edit button navigates correctly', () => {
        renderComponent();

        fireEvent.click(screen.getByText('Edit'));
        expect(mockNavigate).toHaveBeenCalledWith('/edit/0');
    });

    test('renders correct star rating', () => {
        renderComponent();

        expect(screen.getByText('★★★☆☆')).toBeInTheDocument();
    });

});