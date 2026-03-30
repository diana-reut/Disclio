import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export function LandingPage() {
    const navigate = useNavigate();
    return (
        <div className="landing-container">
            {/* Top Navigation Bar */}
            <nav className="landing-nav">
                <button className="nav-btn">Sign up</button>
                <button className="nav-btn">Log in</button>
            </nav>

            <main className="landing-content">
                {/* Left Section: Logo & Description */}
                <div className="content-left">
                    <p className="description">
                        Disclio is a digital archive of your personal CDs.
                        You can add, delete and update their stats while
                        also keeping them organised in different ways:
                        alphabetically, based on the year they were
                        produced or based on your ratings!
                    </p>
                    <div className="logo-container">
                        <img src="/name.png" alt="Disclio Logo" className="main-logo" />
                    </div>
                </div>

                {/* Right Section: Image with Overlay Text */}
                <div className="content-right">
                    <div className="image-overlay-text">
                        Organisation in one click!
                    </div>
                </div>
            </main>
        </div>
    );
}