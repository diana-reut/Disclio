import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MasterView } from './MasterView';

// 1. Mock IntersectionObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: jest.fn(),
}));

// 2. Mock Navigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
}));

const mockCds = [
    { id: 1, title: 'Homework', artist: 'Daft Punk', cover: 'homework.jpg' },
    { id: 2, title: 'Cross', artist: 'Justice', cover: 'cross.jpg' }
];

describe('MasterView Component', () => {
    const mockDeleteCD = jest.fn();
    const mockLoadMore = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderTable = (props = {}) => {
        return render(
            <MemoryRouter>
                <MasterView
                    cds={mockCds}
                    deleteCD={mockDeleteCD}
                    loadMore={mockLoadMore}
                    hasMore={true}
                    loading={false}
                    {...props}
                />
            </MemoryRouter>
        );
    };

    test('renders CD rows correctly', () => {
        renderTable();
        expect(screen.getByText('Homework')).toBeInTheDocument();
        expect(screen.getByText('Cross')).toBeInTheDocument();
        // Check row index numbering (index + 1)
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('navigates to details on row click', () => {
        renderTable();
        // Get a cell from the row
        const rowCell = screen.getByText('Homework');
        // The row is the parent tr
        fireEvent.click(rowCell.closest('tr'));
        expect(mockedNavigate).toHaveBeenCalledWith('/details/1');
    });

    test('edit button navigates and stops propagation', () => {
        renderTable();
        const editButtons = screen.getAllByText('Edit');

        fireEvent.click(editButtons);

        expect(mockedNavigate).toHaveBeenCalledWith('/edit/1');
        // Ensure the row click (details) wasn't triggered
        expect(mockedNavigate).not.toHaveBeenCalledWith('/details/1');
    });

    test('delete button triggers deleteCD and stops propagation', () => {
        renderTable();
        const deleteButtons = screen.getAllByText('🗑️');

        fireEvent.click(deleteButtons); // Delete Justice

        expect(mockDeleteCD).toHaveBeenCalledWith(2);
        // Ensure row click navigation was not triggered
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    test('renders "No CDs found" when list is empty', () => {
        renderTable({ cds: [] });
        expect(screen.getByText(/No CDs found/i)).toBeInTheDocument();
        // Verify colSpan matches header count
        expect(screen.getByText(/No CDs found/i)).toHaveAttribute('colSpan', '5');
    });

    test('infinite scroll triggers loadMore', () => {
        renderTable();

        // Extract the callback from the mock
        const [observerCallback] = global.IntersectionObserver.mock.calls;

        // Simulate intersection
        observerCallback([{ isIntersecting: true }]);

        expect(mockLoadMore).toHaveBeenCalled();
    });

    test('header buttons navigate to correct views', () => {
        renderTable();

        fireEvent.click(screen.getByText('Stats'));
        expect(mockedNavigate).toHaveBeenCalledWith('/stats');

        fireEvent.click(screen.getByText('Grid View'));
        expect(mockedNavigate).toHaveBeenCalledWith('/grid-view');
    });
});