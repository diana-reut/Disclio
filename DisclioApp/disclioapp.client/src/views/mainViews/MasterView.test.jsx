import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MasterView } from './MasterView';

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
    { id: 1, title: 'Homework', artist: 'Daft Punk', cover: 'homework.jpg' },
    { id: 2, title: 'Cross', artist: 'Justice', cover: 'cross.jpg' }
];

describe('MasterView Component', () => {
    const mockDeleteCD = vi.fn();
    const mockLoadMore = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        intersectionObserverInstances.length = 0;
    });

    function renderTable(props = {}) {
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
    }

    test('renders CD rows correctly', () => {
        renderTable();

        expect(screen.getByText('Homework')).toBeInTheDocument();
        expect(screen.getByText('Cross')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('navigates to details on row click', () => {
        renderTable();

        fireEvent.click(screen.getByText('Homework').closest('tr'));
        expect(mockedNavigate).toHaveBeenCalledWith('/details/1');
    });

    test('edit button navigates and stops propagation', () => {
        renderTable();

        fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);

        expect(mockedNavigate).toHaveBeenCalledWith('/edit/1');
        expect(mockedNavigate).not.toHaveBeenCalledWith('/details/1');
    });

    test('delete button triggers deleteCD and stops propagation', () => {
        renderTable();

        fireEvent.click(screen.getAllByText('🗑️')[1]);

        expect(mockDeleteCD).toHaveBeenCalledWith(2);
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    test('renders no CDs found when list is empty', () => {
        renderTable({ cds: [] });

        const emptyCell = screen.getByText(/No CDs found/i).closest('td');
        expect(emptyCell).toHaveAttribute('colspan', '5');
    });

    test('infinite scroll triggers loadMore', () => {
        renderTable();

        intersectionObserverInstances[0].callback([{ isIntersecting: true }]);

        expect(mockLoadMore).toHaveBeenCalled();
    });

    test('does not trigger loadMore when loading is already in progress', () => {
        renderTable({ loading: true });

        expect(intersectionObserverInstances).toHaveLength(0);
        expect(mockLoadMore).not.toHaveBeenCalled();
    });

    test('header buttons navigate to correct views', () => {
        renderTable();

        fireEvent.click(screen.getByText('+ Add Album'));
        fireEvent.click(screen.getByText('Stats'));
        fireEvent.click(screen.getByText('Grid View'));
        fireEvent.click(screen.getByText('Chat'));

        expect(mockedNavigate).toHaveBeenCalledWith('/add');
        expect(mockedNavigate).toHaveBeenCalledWith('/stats');
        expect(mockedNavigate).toHaveBeenCalledWith('/grid-view');
        expect(mockedNavigate).toHaveBeenCalledWith('/chat');
    });

    test('shows end of collection message when there are no more rows', () => {
        renderTable({ hasMore: false });

        expect(screen.getByText("You've reached the end of the collection.")).toBeInTheDocument();
    });
});
