import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { DetailsView } from './DetailsView';

// Mock useNavigate
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
        photos: ['img1.jpg', 'img2.jpg'],
        rating: 3,
        category: 'Rock',
        manufacturer: 'Test Label',
        songs: ['Song1', 'Song2'],
        year: 2020,
        condition: 'New',
        description: 'Test description'
    }
];

function renderComponent(id = "0", cds = mockCds) {
    return render(
        <MemoryRouter initialEntries={[`/details/${id}`]}>
            <Routes>
                <Route path="/details/:id" element={<DetailsView cds={cds} />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('DetailsView Full Coverage (Vitest)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders CD details correctly', () => {
        renderComponent();

        expect(screen.getByText('TEST ALBUM')).toBeInTheDocument();
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
        expect(screen.getByText('Rock')).toBeInTheDocument();
        expect(screen.getByText('Test Label')).toBeInTheDocument();
        expect(screen.getByText('2020')).toBeInTheDocument();
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    test('renders fallback when CD not found', () => {
        renderComponent("5");

        expect(screen.getByText('CD Not Found')).toBeInTheDocument();
    });

    test('back button navigates back', () => {
        renderComponent();

        fireEvent.click(screen.getByText('← Back'));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test('edit button navigates to edit page', () => {
        renderComponent();

        fireEvent.click(screen.getByText('Edit'));
        expect(mockNavigate).toHaveBeenCalledWith('/edit/0');
    });

    test('gallery: next, prev, thumbnail clicks', () => {
        renderComponent();

        const nextBtn = screen.getByText('>');
        const prevBtn = screen.getByText('<');
        const mainImg = screen.getByRole('img', { name: /test album/i });

        // Initial image
        expect(mainImg).toHaveAttribute('src', 'img1.jpg');

        // Next
        fireEvent.click(nextBtn);
        expect(mainImg).toHaveAttribute('src', 'img2.jpg');

        // Prev (wrap around)
        fireEvent.click(prevBtn);
        expect(mainImg).toHaveAttribute('src', 'img1.jpg');

        // Thumbnail click
        const thumbnails = screen.getAllByAltText('thumbnail');
        expect(thumbnails).toHaveLength(2);

        fireEvent.click(thumbnails[1]);
        expect(mainImg).toHaveAttribute('src', 'img2.jpg');
    });

    test('renders correct number of filled stars', () => {
        renderComponent();

        const stars = screen.getAllByText('★');

        const filledStars = stars.filter(el =>
            el.className.includes('star-filled')
        );

        expect(filledStars.length).toBe(3);
    });

    test('renders fallback description when missing', () => {
        const cdsNoDesc = [{ ...mockCds[0], description: '' }];
        renderComponent("0", cdsNoDesc);

        expect(screen.getByText('No description provided.')).toBeInTheDocument();
    });

    test('song list link is correct', () => {
        renderComponent();

        const link = screen.getByText(/view song list/i);
        expect(link).toHaveAttribute('href', '/details/0/songs');
    });

});