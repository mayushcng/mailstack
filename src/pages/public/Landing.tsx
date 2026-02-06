// =============================================================================
// Landing Page
// =============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';

export const Landing: React.FC = () => {
    return (
        <div>
            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <div className="landing-badge">Gmail Account Management</div>
                    <h1 className="landing-title">
                        Submit, Verify, and Get Paid
                    </h1>
                    <p className="landing-subtitle">
                        The fastest way to manage bulk Gmail accounts. Suppliers submit,
                        Admins verify, and payments are tracked automatically.
                    </p>
                    <div className="landing-cta">
                        <Link to="/register">
                            <Button variant="primary" size="lg">
                                Get Started
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="secondary" size="lg">
                                Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="landing-steps">
                <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
                <div className="landing-steps-grid">
                    <div className="landing-step">
                        <div className="landing-step-number">1</div>
                        <h3 className="landing-step-title">Submit</h3>
                        <p className="landing-step-description">
                            Suppliers submit batches of Gmail accounts through a simple
                            text interface. Duplicates and invalid emails are automatically filtered.
                        </p>
                    </div>
                    <div className="landing-step">
                        <div className="landing-step-number">2</div>
                        <h3 className="landing-step-title">Verify</h3>
                        <p className="landing-step-description">
                            Admin reviews submitted accounts and verifies or rejects them.
                            Bulk actions make processing hundreds of accounts fast.
                        </p>
                    </div>
                    <div className="landing-step">
                        <div className="landing-step-number">3</div>
                        <h3 className="landing-step-title">Get Paid</h3>
                        <p className="landing-step-description">
                            Verified accounts are tracked automatically. Payment snapshots
                            are created and suppliers are paid based on their rate.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-links">
                    <Link to="/login" className="landing-footer-link">Login</Link>
                    <Link to="/register" className="landing-footer-link">Register</Link>
                </div>
                <p className="landing-copyright">
                    © {new Date().getFullYear()} Mailstack. All rights reserved.
                </p>
            </footer>
        </div>
    );
};
