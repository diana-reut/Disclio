import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LandingPage } from './LandingPage';
import { useNavigate } from 'react-router-dom';

// 1. Mock react-router-dom
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: vi.fn(),
}));

describe('LandingPage Component', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
    });

    it('renders the main description and logo', () => {
        render(<LandingPage />);

        expect(screen.getByText(/Disclio is a digital archive/i)).toBeInTheDocument();
        expect(screen.getByAltText('Disclio Logo')).toBeInTheDocument();
    });

    it('navigates to auth with signup1 state when Sign up is clicked', () => {
        render(<LandingPage />);

        const signupBtn = screen.getByRole('button', { name: /sign up/i });
        fireEvent.click(signupBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/auth', {
            state: { initialMode: 'signup1' }
        });
    });

    it('navigates to auth with login state when Log in is clicked', () => {
        render(<LandingPage />);

        const loginBtn = screen.getByRole('button', { name: /log in/i });
        fireEvent.click(loginBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/auth', {
            state: { initialMode: 'login' }
        });
    });

    it('renders the rolling CD image', () => {
        render(<LandingPage />);
        const cdImage = screen.getByAltText('Rolling CD');
        expect(cdImage).toBeInTheDocument();
        expect(cdImage).toHaveAttribute('src', '/cd.png');
    });
});