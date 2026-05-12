import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';

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

describe('AdminDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        intersectionObserverInstances.length = 0;
    });

    test('renders observation list and paged system logs', async () => {
        global.fetch = vi.fn().mockImplementation(async (_url, options) => {
            const { query } = JSON.parse(options.body);

            if (query.includes('getObservationList')) {
                return {
                    json: async () => ({
                        data: {
                            getObservationList: [
                                {
                                    id: 1,
                                    username: 'eve',
                                    reason: 'Repeated failed actions',
                                    detectedAt: '2026-05-12 11:00:00'
                                }
                            ]
                        }
                    })
                };
            }

            return {
                json: async () => ({
                    data: {
                        pagedSystemLogs: [
                            {
                                id: 9,
                                userId: 7,
                                groupRole: 'ADMIN',
                                actionInformation: 'Deleted CD',
                                timestamp: '2026-05-12 12:00:00'
                            }
                        ],
                        totalLogCount: 1
                    }
                })
            };
        });

        render(<AdminDashboard />);

        expect(await screen.findByText('Observation List')).toBeInTheDocument();
        expect(await screen.findByText('@eve')).toBeInTheDocument();
        expect(await screen.findByText('System Logs')).toBeInTheDocument();
        expect(await screen.findByText('Deleted CD')).toBeInTheDocument();

        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    });

    test('loads more logs when the sentinel intersects', async () => {
        let logRequestCount = 0;
        global.fetch = vi.fn().mockImplementation(async (_url, options) => {
            const { query, variables } = JSON.parse(options.body);

            if (query.includes('getObservationList')) {
                return {
                    json: async () => ({
                        data: { getObservationList: [] }
                    })
                };
            }

            logRequestCount += 1;

            if (variables.page === 0) {
                return {
                    json: async () => ({
                        data: {
                            pagedSystemLogs: [
                                {
                                    id: 2,
                                    userId: 12,
                                    groupRole: 'ADMIN',
                                    actionInformation: 'Updated CD',
                                    timestamp: '2026-05-12 13:00:00'
                                }
                            ],
                            totalLogCount: 11
                        }
                    })
                };
            }

            return {
                json: async () => ({
                    data: {
                        pagedSystemLogs: [
                            {
                                id: 1,
                                userId: 4,
                                groupRole: 'USER',
                                actionInformation: 'Viewed collection',
                                timestamp: '2026-05-12 12:55:00'
                            }
                        ],
                        totalLogCount: 11
                    }
                })
            };
        });

        render(<AdminDashboard />);

        expect(await screen.findByText('Updated CD')).toBeInTheDocument();

        await act(async () => {
            intersectionObserverInstances.at(-1).callback([{ isIntersecting: true }]);
        });

        expect(await screen.findByText('Viewed collection')).toBeInTheDocument();
        await waitFor(() => expect(logRequestCount).toBeGreaterThanOrEqual(2));
    });
});
