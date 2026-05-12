import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DashboardView } from './DashboardView';

vi.mock('../mainViews/GridView', () => ({
    GridView: () => <div>grid</div>
}));

vi.mock('../statistics/StatisticsView', () => ({
    StatisticsView: () => <div>stats</div>
}));

vi.mock('@stomp/stompjs', () => ({
    Client: class {
        activate() {}
        deactivate() {}
        subscribe() {}
    }
}));

describe('DashboardView', () => {
    const baseProps = {
        cds: [],
        deleteCD: vi.fn(),
        fetchRatingStats: vi.fn(),
        fetchSongFrequencyStats: vi.fn(),
        loadMore: vi.fn(),
        hasMore: false,
        loading: false,
        refresh: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('shows generator controls for admins', () => {
        render(<DashboardView {...baseProps} isAdmin={true} />);

        expect(screen.getByRole('button', { name: 'Start Generator' })).toBeInTheDocument();
        expect(screen.getByText('Stopped')).toBeInTheDocument();
    });

    test('hides generator controls for non-admin users', () => {
        render(<DashboardView {...baseProps} isAdmin={false} />);

        expect(screen.queryByRole('button', { name: 'Start Generator' })).not.toBeInTheDocument();
        expect(screen.queryByText('Stopped')).not.toBeInTheDocument();
    });
});
