// =============================================================================
// Landing Page - Refined, Subtle Messaging with Micro-Animations
// No direct mention of Gmail/email system - focuses on earning opportunity
// =============================================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Icon, Icons } from '../../components/Icon';

export const Landing: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="landing-page">
            {/* Animated Background */}
            <div className="landing-bg">
                <div className="landing-bg-gradient" />
                <div className="landing-bg-glow" />
            </div>

            {/* Hero Section */}
            <section className={`landing-hero ${isVisible ? 'visible' : ''}`}>
                <div className="landing-hero-content">
                    {/* Floating Badge */}
                    <div className="landing-badge animate-float">
                        <Icon name="rocket" className="icon-mr" />
                        Start Earning Today
                    </div>

                    <h1 className="landing-title animate-slide-up">
                        <span className="landing-title-highlight">Submit.</span>{' '}
                        <span className="landing-title-highlight delay-1">Get Approved.</span>{' '}
                        <span className="landing-title-highlight delay-2">Get Paid.</span>
                    </h1>

                    <p className="landing-subtitle animate-fade-in delay-3">
                        Join thousands of suppliers earning money from the comfort of their home.
                        Simple tasks, quick approvals, instant rewards.
                    </p>

                    <div className="landing-cta animate-scale-in delay-4">
                        <Link to="/register">
                            <Button variant="primary" size="lg" className="landing-btn-primary">
                                <Icon name="user-plus" className="icon-mr" />
                                Get Started Free
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="secondary" size="lg" className="landing-btn-secondary">
                                Sign In
                                <Icon name="arrow-right" className="icon-ml" />
                            </Button>
                        </Link>
                    </div>

                    {/* Stats Row */}
                    <div className="landing-stats animate-fade-in delay-5">
                        <div className="landing-stat">
                            <span className="landing-stat-number">10K+</span>
                            <span className="landing-stat-label">Active Suppliers</span>
                        </div>
                        <div className="landing-stat-divider" />
                        <div className="landing-stat">
                            <span className="landing-stat-number">Rs. 5M+</span>
                            <span className="landing-stat-label">Paid Out</span>
                        </div>
                        <div className="landing-stat-divider" />
                        <div className="landing-stat">
                            <span className="landing-stat-number">24h</span>
                            <span className="landing-stat-label">Avg. Payout Time</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="landing-steps">
                <h2 className="landing-section-title">
                    <Icon name="sparkles" className="icon-mr" style={{ color: 'var(--accent)' }} />
                    How It Works
                </h2>
                <p className="landing-section-subtitle">
                    Three simple steps to start earning
                </p>

                <div className="landing-steps-grid">
                    <div className="landing-step animate-on-scroll">
                        <div className="landing-step-icon">
                            <Icon name="paper-plane" size="xl" />
                        </div>
                        <div className="landing-step-number">1</div>
                        <h3 className="landing-step-title">Submit</h3>
                        <p className="landing-step-description">
                            Complete simple tasks and submit your work through our easy-to-use dashboard.
                            No special skills required.
                        </p>
                    </div>

                    <div className="landing-step animate-on-scroll delay-1">
                        <div className="landing-step-icon">
                            <Icon name="check-double" size="xl" />
                        </div>
                        <div className="landing-step-number">2</div>
                        <h3 className="landing-step-title">Get Approved</h3>
                        <p className="landing-step-description">
                            Our team reviews your submissions quickly. Quality work gets approved fast
                            and added to your earnings.
                        </p>
                    </div>

                    <div className="landing-step animate-on-scroll delay-2">
                        <div className="landing-step-icon">
                            <Icon name="coins" size="xl" />
                        </div>
                        <div className="landing-step-number">3</div>
                        <h3 className="landing-step-title">Get Paid</h3>
                        <p className="landing-step-description">
                            Withdraw your earnings anytime. We support eSewa, Khalti, and bank transfers.
                            Fast and hassle-free.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing-features">
                <h2 className="landing-section-title">
                    <Icon name="gem" className="icon-mr" style={{ color: 'var(--accent)' }} />
                    Why Choose Mailstack?
                </h2>

                <div className="landing-features-grid">
                    <div className="landing-feature">
                        <div className="landing-feature-icon">💰</div>
                        <h3>Daily Earnings</h3>
                        <p>Earn money every day with consistent work opportunities</p>
                    </div>
                    <div className="landing-feature">
                        <div className="landing-feature-icon">⚡</div>
                        <h3>Fast Payouts</h3>
                        <p>Get paid within 24-48 hours of approval</p>
                    </div>
                    <div className="landing-feature">
                        <div className="landing-feature-icon">🎁</div>
                        <h3>Bonus Rewards</h3>
                        <p>Unlock special bonuses and prizes as you grow</p>
                    </div>
                    <div className="landing-feature">
                        <div className="landing-feature-icon">📱</div>
                        <h3>Work Anywhere</h3>
                        <p>Complete tasks from your phone or computer</p>
                    </div>
                    <div className="landing-feature">
                        <div className="landing-feature-icon">🏆</div>
                        <h3>Leaderboard</h3>
                        <p>Compete with others and climb the rankings</p>
                    </div>
                    <div className="landing-feature">
                        <div className="landing-feature-icon">🔒</div>
                        <h3>Secure Platform</h3>
                        <p>Your data and earnings are always protected</p>
                    </div>
                </div>
            </section>

            {/* Telegram CTA */}
            <section className="landing-telegram">
                <div className="landing-telegram-card">
                    <div className="landing-telegram-icon">
                        <Icon name={Icons.telegram} prefix="fab" size="xl" />
                    </div>
                    <div className="landing-telegram-content">
                        <h3>Join Our Community</h3>
                        <p>Get updates, tips, and connect with other suppliers on Telegram</p>
                    </div>
                    <a
                        href="https://t.me/mailstack_channel"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="landing-telegram-btn"
                    >
                        <Icon name={Icons.telegram} prefix="fab" className="icon-mr" />
                        Join Telegram
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-content">
                    <div className="landing-footer-brand">
                        <h3>📧 Mailstack</h3>
                        <p>Earn money with simple tasks</p>
                    </div>
                    <div className="landing-footer-links">
                        <Link to="/login" className="landing-footer-link">Login</Link>
                        <Link to="/register" className="landing-footer-link">Register</Link>
                    </div>
                </div>
                <div className="landing-copyright">
                    © {new Date().getFullYear()} Mailstack. All rights reserved.
                </div>
            </footer>
        </div>
    );
};
