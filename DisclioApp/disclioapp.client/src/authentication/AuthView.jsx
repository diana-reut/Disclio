import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AuthView.css';
import { getGraphQLErrorMessage, graphqlRequest, setAuthToken } from '../api/client';

const AUTH_VIEW_STORAGE_KEY = 'disclio_auth_view_state';
const DEFAULT_FORM_DATA = {
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    confirmPassword: '',
    identifier: '',
    emailLoginCode: '',
    securePendingLoginId: '',
    secureLoginCode: '',
    secureTotpCode: '',
    resetToken: '',
    newPassword: '',
    confirmNewPassword: ''
};

function readPersistedAuthViewState() {
    try {
        const raw = window.sessionStorage.getItem(AUTH_VIEW_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        return {
            mode: parsed.mode,
            formData: {
                ...DEFAULT_FORM_DATA,
                ...parsed.formData
            },
            serverMessage: typeof parsed.serverMessage === 'string' ? parsed.serverMessage : ''
        };
    } catch {
        return null;
    }
}

export function AuthView({ onLogin }) {
    const navigate = useNavigate();
    const location = useLocation();
    const persistedState = readPersistedAuthViewState();
    const [mode, setMode] = useState(
        persistedState?.mode || location.state?.initialMode || 'login'
    );

    const [formData, setFormData] = useState(persistedState?.formData || DEFAULT_FORM_DATA);
    const [errors, setErrors] = useState({});
    const [isShaking, setIsShaking] = useState(false);
    const [serverMessage, setServerMessage] = useState(persistedState?.serverMessage || '');

    useEffect(() => {
        const shouldPersist = ['forgotPassword', 'resetPassword', 'emailCodeRequest', 'emailCodeLogin', 'secureLoginPassword', 'secureLoginCode', 'secureLoginTotp'].includes(mode);

        if (!shouldPersist) {
            window.sessionStorage.removeItem(AUTH_VIEW_STORAGE_KEY);
            return;
        }

        window.sessionStorage.setItem(AUTH_VIEW_STORAGE_KEY, JSON.stringify({
            mode,
            formData,
            serverMessage
        }));
    }, [formData, mode, serverMessage]);

    const switchMode = (newMode) => {
        setFormData(DEFAULT_FORM_DATA);
        setErrors({});
        setServerMessage('');
        setMode(newMode);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
        if (serverMessage) setServerMessage('');
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const startSecureLoginFlow = async () => {
        const query = `
            mutation BeginSecureLogin($username: String!, $password: String!) {
                beginSecureLogin(username: $username, password: $password) {
                    message
                    pendingLoginId
                }
            }
        `;

        const result = await graphqlRequest({
            query,
            variables: {
                username: formData.username,
                password: formData.password
            }
        });

        if (result.data?.beginSecureLogin?.pendingLoginId) {
            setFormData(prev => ({
                ...prev,
                identifier: formData.username,
                securePendingLoginId: result.data.beginSecureLogin.pendingLoginId,
                secureLoginCode: '',
                secureTotpCode: ''
            }));
            setServerMessage(result.data.beginSecureLogin.message || 'Check your email for the login code.');
            setErrors({});
            setMode('secureLoginCode');
            return { started: true, result };
        }

        return { started: false, result };
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

        if (fieldsToValidate.includes('confirmNewPassword') && formData.newPassword !== formData.confirmNewPassword) {
            newErrors.confirmNewPassword = true;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setServerMessage('');
            triggerShake();
            return;
        }

        // 2. Handle Database Operations (Signup)
        if (nextMode === 'success') {
            const query = `
                mutation Signup($username: String!, $password: String!, $firstName: String, $lastName: String, $email: String) {
                    signup(
                        username: $username,
                        password: $password,
                        firstName: $firstName,
                        lastName: $lastName,
                        email: $email
                    ) {
                        id
                        username
                    }
                }
            `;

            try {
                const result = await graphqlRequest({
                    query,
                    variables: {
                        username: formData.username,
                        password: formData.password,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email
                    }
                });
                if (result.data && result.data.signup) {
                    window.sessionStorage.removeItem(AUTH_VIEW_STORAGE_KEY);
                    setMode('success');
                    setErrors({});
                    setServerMessage('');
                } else {
                    const message = getGraphQLErrorMessage(result) || 'Signup failed.';
                    console.error("Signup failed:", message);
                    setServerMessage(message);
                    triggerShake();
                }
            } catch (err) {
                console.error("Server connection error", err);
                setServerMessage('Could not reach the server.');
                triggerShake();
            }
            return; // Exit function
        }

        // 3. Handle Database Operations (Login)
        if (nextMode === 'master') {
            const query = `
                mutation Login($username: String!, $password: String!) {
                    login(username: $username, password: $password) {
                        username
                        firstName
                        accessToken
                        role {
                            name
                        }
                    }
                }
            `;

            try {
                const secureAttempt = await startSecureLoginFlow();
                if (secureAttempt.started) {
                    return;
                }

                const secureAttemptMessage = getGraphQLErrorMessage(secureAttempt.result);
                const canFallBackToPasswordOnly = Boolean(
                    secureAttemptMessage && /Set up authenticator verification in your account before using secure login/i.test(secureAttemptMessage)
                );

                if (!canFallBackToPasswordOnly && secureAttemptMessage) {
                    setErrors({ username: true, password: true });
                    setServerMessage(secureAttemptMessage);
                    triggerShake();
                    return;
                }

                const result = await graphqlRequest({
                    query,
                    variables: {
                        username: formData.username,
                        password: formData.password
                    }
                });
                if (result.data && result.data.login) {
                    const userData = result.data.login;
                    setAuthToken(userData.accessToken);
                    window.sessionStorage.removeItem(AUTH_VIEW_STORAGE_KEY);
                    setServerMessage('');
                    onLogin?.(userData);
                    navigate('/master-view');
                } else {
                    const message = getGraphQLErrorMessage(result) || 'Invalid username or password.';
                    setErrors({ username: true, password: true });
                    setServerMessage(message);
                    triggerShake();
                }
            } catch (err) {
                console.error("Login connection error", err);
                setServerMessage('Could not reach the server.');
                triggerShake();
            }
            return; // Exit function
        }

        if (nextMode === 'secure-login-password') {
            try {
                const secureAttempt = await startSecureLoginFlow();
                if (secureAttempt.started) {
                    return;
                }

                const message = getGraphQLErrorMessage(secureAttempt.result) || 'Secure login could not be started.';
                setServerMessage(message);
                setErrors({ username: true, password: true });
                triggerShake();
            } catch (err) {
                console.error("Secure login start failed", err);
                setServerMessage('Could not reach the server.');
                triggerShake();
            }
            return;
        }

        if (nextMode === 'secure-login-code') {
            const verifyCodeQuery = `
                mutation VerifySecureLoginCode($pendingLoginId: String!, $code: String!) {
                    verifySecureLoginCode(pendingLoginId: $pendingLoginId, code: $code) {
                        message
                        pendingLoginId
                    }
                }
            `;

            try {
                const verificationResult = await graphqlRequest({
                    query: verifyCodeQuery,
                    variables: {
                        pendingLoginId: formData.securePendingLoginId,
                        code: formData.secureLoginCode
                    }
                });

                if (verificationResult.data?.verifySecureLoginCode?.pendingLoginId) {
                    setServerMessage(verificationResult.data.verifySecureLoginCode.message || 'Email code verified. Enter your authenticator code.');
                    setErrors({});
                    setMode('secureLoginTotp');
                } else {
                    const message = getGraphQLErrorMessage(verificationResult) || 'The email code is invalid or expired.';
                    setServerMessage(message);
                    setErrors({ secureLoginCode: true });
                    triggerShake();
                }
            } catch (err) {
                console.error("Secure login email verification failed", err);
                setServerMessage('Could not reach the server.');
                triggerShake();
            }
            return;
        }

        if (nextMode === 'secure-login-finish') {
            const finishQuery = `
                mutation FinishSecureLogin($pendingLoginId: String!, $totpCode: String!) {
                    finishSecureLogin(pendingLoginId: $pendingLoginId, totpCode: $totpCode) {
                        username
                        firstName
                        accessToken
                        role {
                            name
                        }
                    }
                }
            `;

            try {
                const finishResult = await graphqlRequest({
                    query: finishQuery,
                    variables: {
                        pendingLoginId: formData.securePendingLoginId,
                        totpCode: formData.secureTotpCode
                    }
                });

                if (finishResult.data?.finishSecureLogin) {
                    const userData = finishResult.data.finishSecureLogin;
                    setAuthToken(userData.accessToken);
                    window.sessionStorage.removeItem(AUTH_VIEW_STORAGE_KEY);
                    setServerMessage('');
                    onLogin?.(userData);
                    navigate('/master-view');
                } else {
                    const message = getGraphQLErrorMessage(finishResult) || 'Device verification failed.';
                    setServerMessage(message);
                    triggerShake();
                }
            } catch (err) {
                console.error("Secure login authenticator verification failed", err);
                setServerMessage('Could not reach the server.');
                triggerShake();
            }
            return;
        }

        if (nextMode === 'email-code-request') {
            const query = `
                mutation RequestEmailLoginCode($identifier: String!) {
                    requestEmailLoginCode(identifier: $identifier) {
                        message
                    }
                }
            `;

            try {
                const result = await graphqlRequest({
                    query,
                    variables: {
                        identifier: formData.identifier
                    }
                });

                if (result.data?.requestEmailLoginCode) {
                    setServerMessage(result.data.requestEmailLoginCode.message || 'Check your email for the login code.');
                    setErrors({});
                    setMode('emailCodeLogin');
                } else {
                    const message = getGraphQLErrorMessage(result) || 'Could not generate a login code.';
                    setServerMessage(message);
                    triggerShake();
                }
            } catch (err) {
                console.error("Email login code request failed", err);
                setServerMessage('Could not reach the server.');
                triggerShake();
            }
            return;
        }

        if (nextMode === 'email-code-login') {
            const query = `
                mutation LoginWithEmailCode($identifier: String!, $code: String!) {
                    loginWithEmailCode(identifier: $identifier, code: $code) {
                        username
                        firstName
                        accessToken
                        role {
                            name
                        }
                    }
                }
            `;

            try {
                const result = await graphqlRequest({
                    query,
                    variables: {
                        identifier: formData.identifier,
                        code: formData.emailLoginCode
                    }
                });

                if (result.data?.loginWithEmailCode) {
                    const userData = result.data.loginWithEmailCode;
                    setAuthToken(userData.accessToken);
                    window.sessionStorage.removeItem(AUTH_VIEW_STORAGE_KEY);
                    setServerMessage('');
                    onLogin?.(userData);
                    navigate('/master-view');
                } else {
                    const message = getGraphQLErrorMessage(result) || 'Invalid or expired login code.';
                    setErrors({ identifier: true, emailLoginCode: true });
                    setServerMessage(message);
                    triggerShake();
                }
            } catch (err) {
                console.error("Email code login failed", err);
                setServerMessage('Could not reach the server.');
                triggerShake();
            }
            return;
        }

        if (nextMode === 'recover-token') {
            const query = `
                mutation RequestPasswordReset($identifier: String!) {
                    requestPasswordReset(identifier: $identifier) {
                        message
                        resetToken
                    }
                }
            `;

            try {
                const result = await graphqlRequest({
                    query,
                    variables: {
                        identifier: formData.identifier
                    }
                });

                if (result.data?.requestPasswordReset) {
                    setServerMessage(result.data.requestPasswordReset.message || 'Check your email for the recovery token.');
                    setErrors({});
                    setMode('resetPassword');
                } else {
                    const message = getGraphQLErrorMessage(result) || 'Could not generate a recovery token.';
                    setServerMessage(message);
                    triggerShake();
                }
            } catch (err) {
                console.error("Password recovery request failed", err);
                setServerMessage('Could not reach the server.');
                triggerShake();
            }
            return;
        }

        if (nextMode === 'reset-complete') {
            const query = `
                mutation ResetPassword($token: String!, $newPassword: String!) {
                    resetPassword(token: $token, newPassword: $newPassword)
                }
            `;

            try {
                const result = await graphqlRequest({
                    query,
                    variables: {
                        token: formData.resetToken,
                        newPassword: formData.newPassword
                    }
                });

                if (result.data?.resetPassword) {
                    window.sessionStorage.removeItem(AUTH_VIEW_STORAGE_KEY);
                    setErrors({});
                    setServerMessage('');
                    setMode('resetSuccess');
                } else {
                    const message = getGraphQLErrorMessage(result) || 'Invalid or expired recovery token.';
                    setServerMessage(message);
                    triggerShake();
                }
            } catch (err) {
                console.error("Password reset failed", err);
                setServerMessage('Could not reach the server.');
                triggerShake();
            }
            return;
        }

        // 4. Handle Navigation between signup steps
        setMode(nextMode);
        setErrors({});
        setServerMessage('');
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
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
                        <p className="auth-footer">Prefer a one-time code? <span onClick={() => switchMode('emailCodeRequest')}>EMAIL ME A CODE</span></p>
                        <p className="auth-footer">Forgot your password? <span onClick={() => switchMode('forgotPassword')}>RECOVER IT</span></p>
                        <p className="auth-footer">Don't have an account? <span onClick={() => switchMode('signup1')}>SIGN UP</span></p>
                    </div>
                );
            case 'secureLoginPassword':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">TRIPLE SECURE LOGIN</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>Username</label>
                                <input name="username" value={formData.username} className={getCls('username')} type="text" onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input name="password" value={formData.password} className={getCls('password')} type="password" onChange={handleChange} />
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('secure-login-password', ['username', 'password'])}>VERIFY PASSWORD</button>
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
                        <p className="auth-footer">Back to <span onClick={() => switchMode('login')}>LOGIN</span></p>
                    </div>
                );
            case 'secureLoginCode':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">EMAIL CHECK</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>Email Code</label>
                                <input name="secureLoginCode" value={formData.secureLoginCode} className={getCls('secureLoginCode')} type="text" onChange={handleChange} />
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('secure-login-code', ['secureLoginCode'])}>VERIFY EMAIL CODE</button>
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
                        <p className="auth-footer">Start over? <span onClick={() => switchMode('secureLoginPassword')}>PASSWORD STEP</span></p>
                        <p className="auth-footer">Back to <span onClick={() => switchMode('login')}>LOGIN</span></p>
                    </div>
                );
            case 'secureLoginTotp':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">AUTHENTICATOR CHECK</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>Authenticator Code</label>
                                <input name="secureTotpCode" value={formData.secureTotpCode} className={getCls('secureTotpCode')} type="text" onChange={handleChange} />
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('secure-login-finish', ['secureTotpCode'])}>VERIFY AUTHENTICATOR</button>
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
                        <p className="auth-footer">Need to re-enter the email code? <span onClick={() => switchMode('secureLoginCode')}>EMAIL STEP</span></p>
                        <p className="auth-footer">Back to <span onClick={() => switchMode('login')}>LOGIN</span></p>
                    </div>
                );
            case 'emailCodeRequest':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">EMAIL CODE LOGIN</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>Username or Email</label>
                                <input name="identifier" value={formData.identifier} className={getCls('identifier')} type="text" onChange={handleChange} />
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('email-code-request', ['identifier'])}>SEND CODE</button>
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
                        <p className="auth-footer">Back to <span onClick={() => switchMode('login')}>LOGIN</span></p>
                    </div>
                );
            case 'emailCodeLogin':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">ENTER LOGIN CODE</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>Username or Email</label>
                                <input name="identifier" value={formData.identifier} className={getCls('identifier')} type="text" onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Login Code</label>
                                <input name="emailLoginCode" value={formData.emailLoginCode} className={getCls('emailLoginCode')} type="text" onChange={handleChange} />
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('email-code-login', ['identifier', 'emailLoginCode'])}>LOGIN WITH CODE</button>
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
                        <p className="auth-footer">Need a new code? <span onClick={() => switchMode('emailCodeRequest')}>SEND AGAIN</span></p>
                        <p className="auth-footer">Back to <span onClick={() => switchMode('login')}>PASSWORD LOGIN</span></p>
                    </div>
                );
            case 'forgotPassword':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">RECOVER PASSWORD</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>Username or Email</label>
                                <input name="identifier" value={formData.identifier} className={getCls('identifier')} type="text" onChange={handleChange} />
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('recover-token', ['identifier'])}>GET TOKEN</button>
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
                        <p className="auth-footer">Back to <span onClick={() => switchMode('login')}>LOGIN</span></p>
                    </div>
                );
            case 'resetPassword':
                return (
                    <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
                        <h2 className="auth-title">RESET PASSWORD</h2>
                        <div className="auth-form-content">
                            <div className="input-group">
                                <label>Recovery Token</label>
                                <input name="resetToken" value={formData.resetToken} className={getCls('resetToken')} type="text" onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>New Password</label>
                                <input name="newPassword" value={formData.newPassword} className={getCls('newPassword')} type="password" onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Confirm New Password</label>
                                <input name="confirmNewPassword" value={formData.confirmNewPassword} className={getCls('confirmNewPassword')} type="password" onChange={handleChange} />
                                {errors.confirmNewPassword && <small className="error-text">Passwords do not match</small>}
                            </div>
                        </div>
                        <button className="auth-btn main" onClick={() => handleAction('reset-complete', ['resetToken', 'newPassword', 'confirmNewPassword'])}>RESET PASSWORD</button>
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
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
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
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
                        {serverMessage && <small className="error-text">{serverMessage}</small>}
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
            case 'resetSuccess':
                return (
                    <div className="auth-card success-card">
                        <h2 className="auth-title">PASSWORD UPDATED</h2>
                        <div className="auth-form-content success-body">
                            <div className="success-icon slide-in">✓</div>
                            <p>You can log in with your new password now.</p>
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
