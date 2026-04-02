import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { GridView } from './GridView';

// mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

// helpers
const createMockCDs = (count) =>
    Array.from({ length: count }, (_, i) => ({
        title: `Album ${i}`,
        artist: `Artist ${i}`,
        cover: `cover${i}.jpg`
    }));

describe('GridView Full Coverage (Vitest)', () => {

    let mockSetCurrentPage;
    let mockDelete;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSetCurrentPage = vi.fn();
        mockDelete = vi.fn();
    });

    function renderComponent({
        cds = createMockCDs(12),
        currentPage = 1
    } = {}) {
        return render(
            <MemoryRouter>
                <GridView
                    cds={cds}
                    currentPage={currentPage}
                    setCurrentPage={mockSetCurrentPage}
                    deleteCD={mockDelete}
                />
            </MemoryRouter>
        );
    }

    test('renders first page items (pagination slice)', () => {
        renderComponent({ cds: createMockCDs(12), currentPage: 1 });

        // Only first 9 should appear
        expect(screen.getByText('ALBUM 0')).toBeInTheDocument();
        expect(screen.getByText('ALBUM 8')).toBeInTheDocument();

        // 10th should NOT appear
        expect(screen.queryByText('ALBUM 9')).not.toBeInTheDocument();
    });

    test('renders second page items correctly', () => {
        renderComponent({ cds: createMockCDs(12), currentPage: 2 });

        expect(screen.getByText('ALBUM 9')).toBeInTheDocument();
        expect(screen.getByText('ALBUM 11')).toBeInTheDocument();
    });

    test('navigates to add page', () => {
        renderComponent();

        fireEvent.click(screen.getByText('+ Add Album'));
        expect(mockNavigate).toHaveBeenCalledWith('/add');
    });

    test('navigates to stats page', () => {
        renderComponent();

        fireEvent.click(screen.getByText('See Stats'));
        expect(mockNavigate).toHaveBeenCalledWith('/stats');
    });

    test('switch to tabular view resets page and navigates', () => {
        renderComponent();

        fireEvent.click(screen.getByText('Switch to Tabular View'));

        expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
        expect(mockNavigate).toHaveBeenCalledWith('/master-view');
    });

    test('clicking album navigates to details', () => {
        renderComponent();

        fireEvent.click(screen.getByText('ALBUM 0'));

        expect(mockNavigate).toHaveBeenCalledWith('/details/0');
    });

    test('delete button calls deleteCD and stops propagation', () => {
        renderComponent();

        const deleteBtn = screen.getAllByText('🗑️')[0];

        fireEvent.click(deleteBtn);

        expect(mockDelete).toHaveBeenCalledWith(0);

        // Ensure it did NOT trigger navigation
        expect(mockNavigate).not.toHaveBeenCalledWith('/details/0');
    });

    test('prev button disabled on first page', () => {
        renderComponent({ currentPage: 1 });

        const prevBtn = screen.getByText('Prev');
        expect(prevBtn).toBeDisabled();
    });

    test('next button disabled on last page', () => {
        renderComponent({ cds: createMockCDs(9), currentPage: 1 });

        const nextBtn = screen.getByText('Next');
        expect(nextBtn).toBeDisabled();
    });

    test('prev button decreases page', () => {
        renderComponent({ currentPage: 2 });

        fireEvent.click(screen.getByText('Prev'));

        expect(mockSetCurrentPage).toHaveBeenCalled();
    });

    test('next button increases page', () => {
        renderComponent({ cds: createMockCDs(20), currentPage: 1 });

        fireEvent.click(screen.getByText('Next'));

        expect(mockSetCurrentPage).toHaveBeenCalled();
    });

    test('displays current page number', () => {
        renderComponent({ currentPage: 3 });

        expect(screen.getByText(/Page 3/)).toBeInTheDocument();
    });

    test('prev button calls updater function correctly', () => {
        renderComponent({ currentPage: 2 });

        fireEvent.click(screen.getByText('Prev'));

        const updater = mockSetCurrentPage.mock.calls[0][0];
        expect(updater(2)).toBe(1); // simulate React behavior
    });

    test('next button calls updater function correctly', () => {
        renderComponent({ cds: createMockCDs(20), currentPage: 1 });

        fireEvent.click(screen.getByText('Next'));

        const updater = mockSetCurrentPage.mock.calls[0][0];
        expect(updater(1)).toBe(2);
    });

    test('handles empty cds array', () => {
        renderComponent({ cds: [], currentPage: 1 });

        expect(screen.getByText('No albums available.')).toBeInTheDocument();
    });

    test('clicking album on second page uses correct index offset', () => {
        renderComponent({ cds: createMockCDs(12), currentPage: 2 });

        fireEvent.click(screen.getByText('ALBUM 9'));

        expect(mockNavigate).toHaveBeenCalledWith('/details/9');
    });

});