import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MasterView } from './MasterView';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockCDs = Array.from({ length: 10 }, (_, i) => ({
    title: `Title ${i + 1}`,
    artist: `Artist ${i + 1}`,
    cover: `cover${i + 1}.jpg`,
}));

describe('MasterView', () => {
    let deleteCD;
    let setCurrentPage;

    beforeEach(() => {
        deleteCD = vi.fn();
        setCurrentPage = vi.fn();
        mockNavigate.mockClear();
    });

    const renderComponent = (page = 1) =>
        render(
            <MemoryRouter>
                <MasterView
                    deleteCD={deleteCD}
                    currentPage={page}
                    setCurrentPage={setCurrentPage}
                    cds={mockCDs}
                />
            </MemoryRouter>
        );

    it('renders table with correct number of items (5 per page)', () => {
        renderComponent();

        const rows = screen.getAllByRole('row');
        // 1 header row + 5 data rows
        expect(rows.length).toBe(6);
    });

    it('navigates to add page when "+ Add Album" is clicked', () => {
        renderComponent();

        fireEvent.click(screen.getByText('+ Add Album'));
        expect(mockNavigate).toHaveBeenCalledWith('/add');
    });

    it('navigates to stats page', () => {
        renderComponent();

        fireEvent.click(screen.getByText('Stats'));
        expect(mockNavigate).toHaveBeenCalledWith('/stats');
    });

    it('navigates to grid view and resets page', () => {
        renderComponent();

        fireEvent.click(screen.getByText('Grid View'));
        expect(setCurrentPage).toHaveBeenCalledWith(1);
        expect(mockNavigate).toHaveBeenCalledWith('/grid-view');
    });

    it('navigates to details when row is clicked', () => {
        renderComponent();

        const firstRow = screen.getAllByRole('row')[1];
        fireEvent.click(firstRow);

        expect(mockNavigate).toHaveBeenCalledWith('/details/0');
    });

    it('edit button navigates correctly without triggering row click', () => {
        renderComponent();

        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        expect(mockNavigate).toHaveBeenCalledWith('/edit/0');
    });

    it('delete button calls deleteCD with correct index', () => {
        renderComponent();

        const deleteButtons = screen.getAllByText('🗑️');
        fireEvent.click(deleteButtons[0]);

        expect(deleteCD).toHaveBeenCalledWith(0);
    });

    it('prev button is disabled on first page', () => {
        renderComponent(1);

        expect(screen.getByText('Prev')).toBeDisabled();
    });

    it('next button is enabled when more items exist', () => {
        renderComponent(1);

        expect(screen.getByText('Next')).not.toBeDisabled();
    });

    it('pagination next button calls setCurrentPage', () => {
        renderComponent(1);

        fireEvent.click(screen.getByText('Next'));
        expect(setCurrentPage).toHaveBeenCalled();
    });

    it('shows next page items correctly', () => {
        renderComponent(2);

        expect(screen.getByText('Title 6')).toBeInTheDocument();
    });
});