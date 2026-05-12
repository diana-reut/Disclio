import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthView } from './AuthView';

describe('AuthView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ data: {} })
        });
    });

    function renderAuthView(onLogin = vi.fn()) {
        return render(
            <MemoryRouter>
                <AuthView onLogin={onLogin} />
            </MemoryRouter>
        );
    }

    test('logs in through the backend mutation and forwards the authenticated user', async () => {
        const onLogin = vi.fn();
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({
                data: {
                    login: {
                        username: 'alice',
                        firstName: 'Alice',
                        role: { name: 'USER' }
                    }
                }
            })
        });

        const { container } = renderAuthView(onLogin);
        fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'alice' } });
        fireEvent.change(container.querySelector('input[name="password"]'), { target: { value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

        await waitFor(() => {
            expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({
                username: 'alice'
            }));
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.query).toContain('mutation Login');
        expect(requestBody.variables).toEqual({
            username: 'alice',
            password: 'secret'
        });
    });

    test('submits the signup mutation after the two-step registration flow', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({
                data: {
                    signup: {
                        id: 1,
                        username: 'alice'
                    }
                }
            })
        });

        const { container } = renderAuthView();

        fireEvent.click(screen.getByText('SIGN UP'));
        fireEvent.change(container.querySelector('input[name="firstName"]'), { target: { value: 'Alice' } });
        fireEvent.change(container.querySelector('input[name="lastName"]'), { target: { value: 'Doe' } });
        fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'alice@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONTINUE' }));

        fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'alice' } });
        fireEvent.change(container.querySelector('input[name="password"]'), { target: { value: 'secret' } });
        fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: 'SIGN UP' }));

        await waitFor(() => {
            expect(screen.getByText('SUCCESS')).toBeInTheDocument();
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.query).toContain('mutation Signup');
        expect(requestBody.variables).toEqual({
            username: 'alice',
            password: 'secret',
            firstName: 'Alice',
            lastName: 'Doe',
            email: 'alice@example.com'
        });
    });
});
