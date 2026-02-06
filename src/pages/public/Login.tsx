// =============================================================================
// Login Page - Premium Modern Design
// =============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Icon, Icons } from '../../components/Icon';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) return;

        try {
            await login(email, password);
            navigate('/');
        } catch {
            // Error is already in the store
        }
    };

    return (
        <div className="auth-page">
            {/* Animated Background */}
            <div className="auth-bg">
                <div className="auth-bg-gradient" />
                <div className="auth-bg-glow auth-bg-glow-1" />
                <div className="auth-bg-glow auth-bg-glow-2" />
                <div className="auth-bg-grid" />
                <div className="auth-bg-rays" />
            </div>

            {/* Floating Orbs */}
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
            <div className="auth-orb auth-orb-3" />

            {/* Corner Decorations */}
            <div className="auth-corner auth-corner-tl" />
            <div className="auth-corner auth-corner-tr" />
            <div className="auth-corner auth-corner-bl" />
            <div className="auth-corner auth-corner-br" />

            {/* Header */}
            <header className="auth-header">
                <Link to="/" className="auth-logo">
                    <div className="auth-logo-icon">
                        <Icon name="envelope" size="md" />
                    </div>
                    <span className="auth-logo-text">Mailstack</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="auth-main">
                {/* Tagline */}
                <div className="auth-tagline">
                    <h1 className="auth-tagline-slogan">
                        <span>Verification.</span>
                        <span>Accountability.</span>
                        <span>Payment.</span>
                    </h1>
                </div>

                {/* Login Card */}
                <div className="auth-card">
                    <div className="auth-card-glow" />

                    <div className="auth-card-header">
                        <h2 className="auth-card-title">Welcome Back</h2>
                        <p className="auth-card-subtitle">Sign in to continue to your dashboard</p>
                    </div>

                    {error && (
                        <div className="auth-alert auth-alert-error">
                            <Icon name={Icons.error} size="sm" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label className="auth-label">Email Address</label>
                            <div className={`auth-input-wrapper ${errors.email ? 'error' : ''}`}>
                                <span className="auth-input-icon">
                                    <Icon name={Icons.email} size="sm" />
                                </span>
                                <input
                                    type="email"
                                    className="auth-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <span className="auth-error">{errors.email}</span>}
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Password</label>
                            <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                                <span className="auth-input-icon">
                                    <Icon name="lock" size="sm" />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <Icon name={showPassword ? Icons.hide : Icons.view} size="sm" />
                                </button>
                            </div>
                            {errors.password && <span className="auth-error">{errors.password}</span>}
                        </div>

                        <div className="auth-options">
                            <Link to="/forgot-password" className="auth-forgot-link">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="auth-spinner" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <Icon name="arrow-right" size="sm" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-card-footer">
                        <span>Don't have an account?</span>
                        <Link to="/register" className="auth-link">Create Account</Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="auth-footer">
                <p>©2026 Mailstack Ltd. All rights reserved.</p>
            </footer>
        </div>
    );
};
