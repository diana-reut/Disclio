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

    function renderAuthView(onLogin = vi.fn(), initialMode) {
        return render(
            <MemoryRouter initialEntries={[initialMode ? { pathname: '/', state: { initialMode } } : '/']}>
                <AuthView onLogin={onLogin} />
            </MemoryRouter>
        );
    }

    test('logs in through the backend mutation and forwards the authenticated user', async () => {
        const onLogin = vi.fn();
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                json: async () => ({
                    errors: [
                        { message: 'Set up authenticator verification in your account before using secure login.' }
                    ]
                })
            })
            .mockResolvedValueOnce({
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

        const secureAttemptBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(secureAttemptBody.query).toContain('mutation BeginSecureLogin');
        expect(secureAttemptBody.variables).toEqual({
            username: 'alice',
            password: 'secret'
        });

        const requestBody = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(requestBody.query).toContain('mutation Login');
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

    test('requests an email login code and signs in with it', async () => {
        const onLogin = vi.fn();
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                json: async () => ({
                    data: {
                        requestEmailLoginCode: {
                            message: 'If that account exists, we sent a one-time login code to the email on file.'
                        }
                    }
                })
            })
            .mockResolvedValueOnce({
                json: async () => ({
                    data: {
                        loginWithEmailCode: {
                            username: 'alice',
                            firstName: 'Alice',
                            role: { name: 'USER' }
                        }
                    }
                })
            });

        const { container } = renderAuthView(onLogin, 'emailCodeRequest');
        fireEvent.change(container.querySelector('input[name="identifier"]'), { target: { value: 'alice@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: 'SEND CODE' }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'LOGIN WITH CODE' })).toBeInTheDocument();
        });

        fireEvent.change(container.querySelector('input[name="emailLoginCode"]'), { target: { value: '123456' } });
        fireEvent.click(screen.getByRole('button', { name: 'LOGIN WITH CODE' }));

        await waitFor(() => {
            expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({
                username: 'alice'
            }));
        });

        const firstRequestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(firstRequestBody.query).toContain('mutation RequestEmailLoginCode');
        expect(firstRequestBody.variables).toEqual({
            identifier: 'alice@example.com'
        });

        const secondRequestBody = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(secondRequestBody.query).toContain('mutation LoginWithEmailCode');
        expect(secondRequestBody.variables).toEqual({
            identifier: 'alice@example.com',
            code: '123456'
        });
    });

    test('completes the triple secure login flow', async () => {
        const onLogin = vi.fn();
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                json: async () => ({
                    data: {
                        beginSecureLogin: {
                            message: 'Password verified. We sent a one-time code to your email. Enter it to continue to the authenticator step.',
                            pendingLoginId: 'pending-123'
                        }
                    }
                })
            })
            .mockResolvedValueOnce({
                json: async () => ({
                    data: {
                        verifySecureLoginCode: {
                            message: 'Email code verified. Enter your authenticator code to finish logging in.',
                            pendingLoginId: 'pending-123'
                        }
                    }
                })
            })
            .mockResolvedValueOnce({
                json: async () => ({
                    data: {
                        finishSecureLogin: {
                            username: 'alice',
                            firstName: 'Alice',
                            role: { name: 'USER' }
                        }
                    }
                })
            });

        const { container } = renderAuthView(onLogin, 'secureLoginPassword');
        fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'alice' } });
        fireEvent.change(container.querySelector('input[name="password"]'), { target: { value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: 'VERIFY PASSWORD' }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'VERIFY EMAIL CODE' })).toBeInTheDocument();
        });

        fireEvent.change(container.querySelector('input[name="secureLoginCode"]'), { target: { value: '654321' } });
        fireEvent.click(screen.getByRole('button', { name: 'VERIFY EMAIL CODE' }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'VERIFY AUTHENTICATOR' })).toBeInTheDocument();
        });

        fireEvent.change(container.querySelector('input[name="secureTotpCode"]'), { target: { value: '112233' } });
        fireEvent.click(screen.getByRole('button', { name: 'VERIFY AUTHENTICATOR' }));

        await waitFor(() => {
            expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({
                username: 'alice'
            }));
        });

        const beginRequest = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(beginRequest.query).toContain('mutation BeginSecureLogin');

        const verifyRequest = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(verifyRequest.query).toContain('mutation VerifySecureLoginCode');
        expect(verifyRequest.variables).toEqual({
            pendingLoginId: 'pending-123',
            code: '654321'
        });

        const finishRequest = JSON.parse(global.fetch.mock.calls[2][1].body);
        expect(finishRequest.query).toContain('mutation FinishSecureLogin');
        expect(finishRequest.variables).toEqual({
            pendingLoginId: 'pending-123',
            totpCode: '112233'
        });
    });

    test('auto-routes authenticator-enabled users into the secure flow from the normal login button', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
            json: async () => ({
                data: {
                    beginSecureLogin: {
                        message: 'Password verified. We sent a one-time code to your email. Enter it to continue to the authenticator step.',
                        pendingLoginId: 'pending-123'
                    }
                }
            })
        });

        const { container } = renderAuthView();
        fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'alice' } });
        fireEvent.change(container.querySelector('input[name="password"]'), { target: { value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'VERIFY EMAIL CODE' })).toBeInTheDocument();
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

    test('restores email code login step after a reload', () => {
        window.sessionStorage.setItem('disclio_auth_view_state', JSON.stringify({
            mode: 'emailCodeLogin',
            formData: {
                identifier: 'alice@example.com',
                emailLoginCode: '654321'
            },
            serverMessage: 'Check your email for the login code.'
        }));

        const { container } = renderAuthView();

        expect(screen.getByRole('button', { name: 'LOGIN WITH CODE' })).toBeInTheDocument();
        expect(container.querySelector('input[name="identifier"]').value).toBe('alice@example.com');
        expect(container.querySelector('input[name="emailLoginCode"]').value).toBe('654321');
        expect(screen.getByText('Check your email for the login code.')).toBeInTheDocument();
    });

    test('restores triple secure login step after a reload', () => {
        window.sessionStorage.setItem('disclio_auth_view_state', JSON.stringify({
            mode: 'secureLoginTotp',
            formData: {
                username: 'alice',
                securePendingLoginId: 'pending-123',
                secureLoginCode: '654321',
                secureTotpCode: '112233'
            },
            serverMessage: 'Enter the code from Microsoft Authenticator to continue.'
        }));

        const { container } = renderAuthView();

        expect(screen.getByRole('button', { name: 'VERIFY AUTHENTICATOR' })).toBeInTheDocument();
        expect(container.querySelector('input[name="secureTotpCode"]').value).toBe('112233');
        expect(screen.getByText('Enter the code from Microsoft Authenticator to continue.')).toBeInTheDocument();
    });
});
