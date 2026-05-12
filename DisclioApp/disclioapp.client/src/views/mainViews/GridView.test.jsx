import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GridView } from './GridView';

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const intersectionObserverInstances = [];

class IntersectionObserverMock {
    constructor(callback) {
        this.callback = callback;
        this.observe = mockObserve;
        this.disconnect = mockDisconnect;
        this.unobserve = vi.fn();
        intersectionObserverInstances.push(this);
    }
}

global.IntersectionObserver = IntersectionObserverMock;

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

const mockCds = [
    { id: 1, title: 'Discovery', artist: 'Daft Punk', cover: 'daft.jpg' },
    { id: 2, title: 'Justice', artist: 'Justice', cover: 'justice.jpg' }
];

describe('GridView Component', () => {
    const mockDeleteCD = vi.fn();
    const mockLoadMore = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        intersectionObserverInstances.length = 0;
    });

    function renderGrid(props = {}) {
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
    }

    test('renders the grid of albums correctly', () => {
        renderGrid();

        expect(screen.getByText('DISCOVERY')).toBeInTheDocument();
        expect(screen.getByText('JUSTICE')).toBeInTheDocument();
        expect(screen.getAllByRole('img')).toHaveLength(2);
    });

    test('navigates to details page when clicking a card', () => {
        renderGrid();

        fireEvent.click(screen.getByText('DISCOVERY').closest('.grid-item'));
        expect(mockedNavigate).toHaveBeenCalledWith('/details/1');
    });

    test('calls deleteCD and prevents navigation bubbling', () => {
        renderGrid();

        fireEvent.click(screen.getAllByText('🗑️')[0]);

        expect(mockDeleteCD).toHaveBeenCalledWith(1);
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    test('navigates to add, stats, and tabular views', () => {
        renderGrid();

        fireEvent.click(screen.getByText('+ Add Album'));
        fireEvent.click(screen.getByText('See Stats'));
        fireEvent.click(screen.getByText('Switch to Tabular View'));
        fireEvent.click(screen.getByText('Chat'));

        expect(mockedNavigate).toHaveBeenCalledWith('/add');
        expect(mockedNavigate).toHaveBeenCalledWith('/stats');
        expect(mockedNavigate).toHaveBeenCalledWith('/master-view');
        expect(mockedNavigate).toHaveBeenCalledWith('/chat');
    });

    test('shows admin button only for admins and navigates to admin page', () => {
        renderGrid({ isAdmin: true });

        fireEvent.click(screen.getByText('Admin'));

        expect(mockedNavigate).toHaveBeenCalledWith('/admin');
    });

    test('does not show admin button for non-admins', () => {
        renderGrid({ isAdmin: false });

        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
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

        intersectionObserverInstances[0].callback([{ isIntersecting: true }]);

        expect(mockLoadMore).toHaveBeenCalled();
    });

    test('does not trigger loadMore when there are no more albums', () => {
        renderGrid({ hasMore: false });

        intersectionObserverInstances[0].callback([{ isIntersecting: true }]);

        expect(mockLoadMore).not.toHaveBeenCalled();
    });

    test('shows end of collection message when there are no more albums', () => {
        renderGrid({ hasMore: false });

        expect(screen.getByText("You've reached the end of the collection.")).toBeInTheDocument();
    });
});
