import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AuthView.css';

export function AuthView() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');

    const renderContent = () => {
        switch (mode) {
            case 'login':
                return (
                    <div className="auth-card">
                        <h2 className="auth-title">LOGIN</h2>
                        <div className="input-group">
                            <label>Username</label>
                            <input type="text" placeholder="Type your username" />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input type="password" placeholder="Type your password" />
                        </div>
                        <button className="auth-btn main" onClick={() => navigate('/master-view')} >LOGIN</button>
                        <p className="auth-footer">Don't have an account? <span onClick={() => setMode('signup1')}>SIGN UP</span></p>
                    </div>
                );
            case 'signup1':
                return (
                    <div className="auth-card">
                        <h2 className="auth-title">SIGN UP</h2>
                        <div className="input-group"><label>First Name</label><input type="text" /></div>
                        <div className="input-group"><label>Last Name</label><input type="text" /></div>
                        <div className="input-group"><label>Email</label><input type="email" /></div>
                        <button className="auth-btn main" onClick={() => setMode('signup2')}>CONTINUE</button>
                    </div>
                );
            case 'signup2':
                return (
                    <div className="auth-card">
                        <h2 className="auth-title">SIGN UP</h2>
                        <div className="input-group"><label>Password</label><input type="password" /></div>
                        <div className="input-group"><label>Confirm Password</label><input type="password" /></div>
                        <button className="auth-btn main" onClick={() => setMode('success')}>CONTINUE</button>
                    </div>
                );
            case 'success':
                return (
                    <div className="auth-card success-card">
                        <h2 className="auth-title">SIGN UP</h2>
                        <div className="success-icon">✔</div>
                        <p>Done!</p>
                        <button className="auth-btn main" onClick={() => setMode('login')}>LOGIN</button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-overlay">
                {renderContent()}
            </div>
        </div>
    );
}