import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthView } from './AuthView';

describe('AuthView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.sessionStorage.clear();
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

    test('requests a recovery token and resets the password', async () => {
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                json: async () => ({
                    data: {
                        requestPasswordReset: {
                            message: 'If that account exists, you can use the recovery token below to reset the password.',
                            resetToken: null
                        }
                    }
                })
            })
            .mockResolvedValueOnce({
                json: async () => ({
                    data: {
                        resetPassword: true
                    }
                })
            });

        const { container } = renderAuthView();

        fireEvent.click(screen.getByText('RECOVER IT'));
        fireEvent.change(container.querySelector('input[name="identifier"]'), { target: { value: 'alice@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: 'GET TOKEN' }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'RESET PASSWORD' })).toBeInTheDocument();
        });

        fireEvent.change(container.querySelector('input[name="resetToken"]'), { target: { value: 'demo-token-123' } });
        fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'new-secret' } });
        fireEvent.change(container.querySelector('input[name="confirmNewPassword"]'), { target: { value: 'new-secret' } });
        fireEvent.click(screen.getByRole('button', { name: 'RESET PASSWORD' }));

        await waitFor(() => {
            expect(screen.getByText('PASSWORD UPDATED')).toBeInTheDocument();
        });

        const firstRequestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(firstRequestBody.query).toContain('mutation RequestPasswordReset');
        expect(firstRequestBody.variables).toEqual({
            identifier: 'alice@example.com'
        });

        const secondRequestBody = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(secondRequestBody.query).toContain('mutation ResetPassword');
        expect(secondRequestBody.variables).toEqual({
            token: 'demo-token-123',
            newPassword: 'new-secret'
        });
    });

    test('restores password recovery step after a reload', () => {
        window.sessionStorage.setItem('disclio_auth_view_state', JSON.stringify({
            mode: 'resetPassword',
            formData: {
                identifier: 'alice@example.com',
                resetToken: 'saved-token',
                newPassword: 'temp-secret'
            },
            serverMessage: 'Check your email for the recovery token.'
        }));

        const { container } = renderAuthView();

        expect(screen.getByRole('button', { name: 'RESET PASSWORD' })).toBeInTheDocument();
        expect(container.querySelector('input[name="resetToken"]').value).toBe('saved-token');
        expect(container.querySelector('input[name="newPassword"]').value).toBe('temp-secret');
        expect(screen.getByText('Check your email for the recovery token.')).toBeInTheDocument();
    });
});
