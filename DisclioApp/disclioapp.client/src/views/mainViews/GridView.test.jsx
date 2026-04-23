import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GridView } from './GridView';

// 1. Mock IntersectionObserver (essential for the lastElementRef logic)
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
    { id: 1, title: 'Discovery', artist: 'Daft Punk', cover: 'daft.jpg' },
    { id: 2, title: 'Justice', artist: 'Justice', cover: 'justice.jpg' }
];

describe('GridView Component', () => {
    const mockDeleteCD = jest.fn();
    const mockLoadMore = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderGrid = (props = {}) => {
        return render(
            <MemoryRouter>
                <GridView
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

    test('renders the grid of albums correctly', () => {
        renderGrid();
        expect(screen.getByText('DISCOVERY')).toBeInTheDocument();
        expect(screen.getByText('JUSTICE')).toBeInTheDocument();
        expect(screen.getAllByRole('img')).toHaveLength(2);
    });

    test('navigates to details page when clicking a card', () => {
        renderGrid();
        const firstCard = screen.getByText('DISCOVERY').closest('.grid-item');
        fireEvent.click(firstCard);
        expect(mockedNavigate).toHaveBeenCalledWith('/details/1');
    });

    test('calls deleteCD and prevents navigation bubbling', () => {
        renderGrid();
        // Get the first delete button
        const deleteButtons = screen.getAllByText('🗑️');
        fireEvent.click(deleteButtons);

        // Ensure delete was called
        expect(mockDeleteCD).toHaveBeenCalledWith(1);
        // Ensure navigate was NOT called (because of e.stopPropagation)
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    test('navigates to add, stats, and tabular views', () => {
        renderGrid();

        fireEvent.click(screen.getByText('+ Add Album'));
        expect(mockedNavigate).toHaveBeenCalledWith('/add');

        fireEvent.click(screen.getByText('See Stats'));
        expect(mockedNavigate).toHaveBeenCalledWith('/stats');

        fireEvent.click(screen.getByText('Switch to Tabular View'));
        expect(mockedNavigate).toHaveBeenCalledWith('/master-view');
    });

    test('shows empty state message', () => {
        renderGrid({ cds: [] });
        expect(screen.getByText('No albums available.')).toBeInTheDocument();
    });

    test('shows loading indicator when loading more', () => {
        renderGrid({ loading: true });
        expect(screen.getByText('Loading more albums...')).toBeInTheDocument();
    });

    test('triggers loadMore when intersection happens', () => {
        renderGrid();

        // Find the callback passed to IntersectionObserver
        const [observerCallback] = global.IntersectionObserver.mock.calls;

        // Simulate the intersection entry
        observerCallback([{ isIntersecting: true }]);

        expect(mockLoadMore).toHaveBeenCalled();
    });
});