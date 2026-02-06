// =============================================================================
// Reset Password Page - Premium Modern Design
// =============================================================================

import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Icon, Icons } from '../../components/Icon';
import { validators } from '../../utils/validators';
import { apiClient } from '../../api/client';
import { toast } from '../../store/toastStore';

export const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: typeof errors = {};

        const passwordError = validators.password(password);
        if (passwordError) newErrors.password = passwordError;

        const confirmError = validators.confirmPassword(confirmPassword, password);
        if (confirmError) newErrors.confirmPassword = confirmError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await apiClient.post('/auth/reset-password', { token, password }, { skipAuth: true });
            toast.success('Password reset!', 'You can now login with your new password.');
            navigate('/login');
        } catch (error) {
            toast.error('Reset failed', error instanceof Error ? error.message : 'Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Invalid token state
    if (!token) {
        return (
            <div className="auth-page">
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

                        <div className="auth-error-icon">
                            <Icon name={Icons.warning} size="2xl" />
                        </div>

                        <div className="auth-card-header">
                            <h2 className="auth-card-title">Invalid Link</h2>
                            <p className="auth-card-subtitle">
                                This password reset link is invalid or has expired.
                            </p>
                        </div>

                        <Link to="/forgot-password" className="auth-submit-btn" style={{ textDecoration: 'none' }}>
                            <span>Request New Link</span>
                            <Icon name="arrow-right" size="sm" />
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
                        <h2 className="auth-card-title">Set New Password</h2>
                        <p className="auth-card-subtitle">
                            Create a strong password for your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label className="auth-label">New Password</label>
                            <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                                <span className="auth-input-icon">
                                    <Icon name="lock" size="sm" />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 8 characters"
                                    autoComplete="new-password"
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

                        <div className="auth-field">
                            <label className="auth-label">Confirm Password</label>
                            <div className={`auth-input-wrapper ${errors.confirmPassword ? 'error' : ''}`}>
                                <span className="auth-input-icon">
                                    <Icon name="lock" size="sm" />
                                </span>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    <Icon name={showConfirmPassword ? Icons.hide : Icons.view} size="sm" />
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="auth-spinner" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <span>Reset Password</span>
                                    <Icon name={Icons.success} size="sm" />
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
