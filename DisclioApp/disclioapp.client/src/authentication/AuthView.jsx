import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AuthView.css';

export function AuthView() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState(location.state?.initialMode || 'login');

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isShaking, setIsShaking] = useState(false);

    const switchMode = (newMode) => {
        setFormData({
            username: '', password: '', firstName: '', lastName: '',
            email: '', confirmPassword: ''
        });
        setErrors({});
        setMode(newMode);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const handleAction = async (nextMode, fieldsToValidate) => {
        // 1. Local Validation
        let newErrors = {};
        fieldsToValidate.forEach(field => {
            if (!formData[field]) newErrors[field] = true;
        });

        if (fieldsToValidate.includes('email') && formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) newErrors.email = true;
        }

        if (fieldsToValidate.includes('confirmPassword') && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = true;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            triggerShake();
            return;
        }

        // 2. Handle Database Operations (Signup)
        if (nextMode === 'success') {
            const query = `mutation {
                signup(
                    username: "${formData.username}", 
                    password: "${formData.password}", 
                    firstName: "${formData.firstName}", 
                    lastName: "${formData.lastName}", 
                    email: "${formData.email}"
                ) { id username }
            }`;

            try {
                const response = await fetch(`http://${window.location.hostname}:8080/graphql`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });

                const result = await response.json();
                if (result.data && result.data.signup) {
                    setMode('success');
                    setErrors({});
                } else {
                    console.error("Signup failed - user likely exists");
                    triggerShake();
                }
            } catch (err) {
                console.error("Server connection error", err);
                triggerShake();
            }
            return; // Exit function
        }

        // 3. Handle Database Operations (Login)
        if (nextMode === 'master') {
            const query = `{
                login(username: "${formData.username}", password: "${formData.password}") {
                    username firstName
                }
            }`;

            try {
                const response = await fetch(`http://${window.location.hostname}:8080/graphql`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });

                const result = await response.json();
                if (result.data && result.data.login) {
                    const days = 7;
                    const expires = new Date(Date.now() + days * 864e5).toUTCString();
                    document.cookie = `username=${encodeURIComponent(result.data.login.username)}; expires=${expires}; path=/;`;
                    document.cookie = `isLoggedIn=true; expires=${expires}; path=/;`;
                    navigate('/master-view');
                } else {
                    setErrors({ username: true, password: true });
                    triggerShake();
                }
            } catch (err) {
                console.error("Login connection error", err);
                triggerShake();
            }
            return; // Exit function
        }

        // 4. Handle Navigation between signup steps
        setMode(nextMode);
        setErrors({});
    };

    const renderContent = () => {
        const getCls = (field) => `auth-input ${errors[field] ? 'input-error' : ''}`;

        switch (mode) {
            case 'login':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">LOGIN</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>Username</label>
                                <input name="username" value={formData.username} className={getCls('username')} type="text" onChange={handleChange} placeholder="Type your username" />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input name="password" value={formData.password} className={getCls('password')} type="password" onChange={handleChange} placeholder="Type your password" />
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('master', ['username', 'password'])}>LOGIN</button>
                        <p className="auth-footer">Don't have an account? <span onClick={() => switchMode('signup1')}>SIGN UP</span></p>
                    </div>
                );
            case 'signup1':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">SIGN UP</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>First Name</label>
                                <input name="firstName" value={formData.firstName} className={getCls('firstName')} type="text" onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Last Name</label>
                                <input name="lastName" value={formData.lastName} className={getCls('lastName')} type="text" onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Email</label>
                                <input name="email" value={formData.email} className={getCls('email')} type="email" onChange={handleChange} />
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('signup2', ['firstName', 'lastName', 'email'])}>CONTINUE</button>
                        <p className="auth-footer">Back to <span onClick={() => switchMode('login')}>LOGIN</span></p>
                    </div>
                );
            case 'signup2':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">SIGN UP</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>Choose Username</label>
                                <input name="username" value={formData.username} className={getCls('username')} type="text" onChange={handleChange} autoComplete="username" />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input name="password" value={formData.password} className={getCls('password')} type="password" onChange={handleChange} autoComplete="new-password" />
                            </div>
                            <div className="input-group">
                                <label>Confirm Password</label>
                                <input name="confirmPassword" value={formData.confirmPassword} className={getCls('confirmPassword')} type="password" onChange={handleChange} autoComplete="new-password" />
                                {errors.confirmPassword && <small className="error-text">Passwords do not match</small>}
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('success', ['username', 'password', 'confirmPassword'])}>SIGN UP</button>
                    </div>
                );
            case 'success':
                return (
                    <div className="auth-card success-card">
                        <h2 className="auth-title">SUCCESS</h2>
                        <div className="auth-form-content success-body">
                            <div className="success-icon slide-in">✔</div>
                            <p>Your account is ready!</p>
                        </div>
                        <button className="auth-btn main" onClick={() => switchMode('login')}>GO TO LOGIN</button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-overlay">{renderContent()}</div>
        </div>
    );
}