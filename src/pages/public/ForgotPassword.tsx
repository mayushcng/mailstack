// =============================================================================
// Forgot Password Page - Premium Modern Design
// =============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Icons } from '../../components/Icon';
import { validators } from '../../utils/validators';
import { apiClient } from '../../api/client';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailError = validators.email(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await apiClient.post('/auth/forgot-password', { email }, { skipAuth: true });
            setSubmitted(true);
        } catch {
            // Always show success for security
            setSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="auth-page">
                {/* Animated Background */}
                <div className="auth-bg">
                    <div className="auth-bg-gradient" />
                    <div className="auth-bg-glow auth-bg-glow-1" />
                    <div className="auth-bg-glow auth-bg-glow-2" />
                    <div className="auth-bg-grid" />
                </div>

                <div className="auth-orb auth-orb-1" />
                <div className="auth-orb auth-orb-2" />

                <div className="auth-corner auth-corner-tl" />
                <div className="auth-corner auth-corner-tr" />
                <div className="auth-corner auth-corner-bl" />
                <div className="auth-corner auth-corner-br" />

                <header className="auth-header">
                    <Link to="/" className="auth-logo">
                        <div className="auth-logo-icon">
                            <Icon name="envelope" size="md" />
                        </div>
                        <span className="auth-logo-text">Mailstack</span>
                    </Link>
                </header>

                <main className="auth-main">
                    <div className="auth-tagline auth-tagline-compact">
                        <h1 className="auth-tagline-slogan">
                            <span>Verification.</span>
                            <span>Accountability.</span>
                            <span>Payment.</span>
                        </h1>
                    </div>

                    <div className="auth-card">
                        <div className="auth-card-glow" />

                        <div className="auth-success-icon">
                            <Icon name={Icons.email} size="2xl" />
                        </div>

                        <div className="auth-card-header">
                            <h2 className="auth-card-title">Check Your Email</h2>
                            <p className="auth-card-subtitle">
                                If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
                            </p>
                        </div>

                        <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none' }}>
                            <Icon name="arrow-left" size="sm" />
                            <span>Back to Login</span>
                        </Link>
                    </div>
                </main>

                <footer className="auth-footer">
                    <p>©2026 Mailstack Ltd. All rights reserved.</p>
                </footer>
            </div>
        );
    }

    return (
        <div className="auth-page">
            {/* Animated Background */}
            <div className="auth-bg">
                <div className="auth-bg-gradient" />
                <div className="auth-bg-glow auth-bg-glow-1" />
                <div className="auth-bg-glow auth-bg-glow-2" />
                <div className="auth-bg-grid" />
            </div>

            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />

            <div className="auth-corner auth-corner-tl" />
            <div className="auth-corner auth-corner-tr" />
            <div className="auth-corner auth-corner-bl" />
            <div className="auth-corner auth-corner-br" />

            <header className="auth-header">
                <Link to="/" className="auth-logo">
                    <div className="auth-logo-icon">
                        <Icon name="envelope" size="md" />
                    </div>
                    <span className="auth-logo-text">Mailstack</span>
                </Link>
            </header>

            <main className="auth-main">
                <div className="auth-tagline auth-tagline-compact">
                    <h1 className="auth-tagline-slogan">
                        <span>Verification.</span>
                        <span>Accountability.</span>
                        <span>Payment.</span>
                    </h1>
                </div>

                <div className="auth-card">
                    <div className="auth-card-glow" />

                    <div className="auth-card-header">
                        <h2 className="auth-card-title">Forgot Password?</h2>
                        <p className="auth-card-subtitle">
                            No worries! Enter your email and we'll send you reset instructions.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label className="auth-label">Email Address</label>
                            <div className={`auth-input-wrapper ${error ? 'error' : ''}`}>
                                <span className="auth-input-icon">
                                    <Icon name={Icons.email} size="sm" />
                                </span>
                                <input
                                    type="email"
                                    className="auth-input"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>
                            {error && <span className="auth-error">{error}</span>}
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="auth-spinner" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <span>Send Reset Link</span>
                                    <Icon name="paper-plane" size="sm" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-card-footer">
                        <span>Remember your password?</span>
                        <Link to="/login" className="auth-link">Sign In</Link>
                    </div>
                </div>
            </main>

            <footer className="auth-footer">
                <p>©2026 Mailstack Ltd. All rights reserved.</p>
            </footer>
        </div>
    );
};
