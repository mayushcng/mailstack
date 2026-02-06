// =============================================================================
// Admin Layout
// =============================================================================

import React from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../utils/formatters';

interface NavItem {
    to: string;
    icon: string;
    label: string;
}

const navItems: NavItem[] = [
    { to: '/admin', icon: '📊', label: 'Dashboard' },
    { to: '/admin/queue', icon: '📋', label: 'Review Queue' },
    { to: '/admin/verified', icon: '✅', label: 'Verified' },
    { to: '/admin/rejected', icon: '❌', label: 'Rejected' },
    { to: '/admin/suppliers', icon: '👥', label: 'Suppliers' },
    { to: '/admin/payments', icon: '💰', label: 'Payments' },
    { to: '/admin/payout-requests', icon: '💳', label: 'Payout Requests' },
];

export const AdminLayout: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/supplier" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span style={{ color: 'var(--accent)' }}>⚡</span> Mailstack Admin
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Overview</div>
                        <NavLink
                            to="/admin"
                            end
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-link-icon">📊</span>
                            Dashboard
                        </NavLink>
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">Verification</div>
                        <NavLink
                            to="/admin/queue"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-link-icon">📋</span>
                            Review Queue
                        </NavLink>
                        <NavLink
                            to="/admin/verified"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-link-icon">✅</span>
                            Verified
                        </NavLink>
                        <NavLink
                            to="/admin/rejected"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-link-icon">❌</span>
                            Rejected
                        </NavLink>
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">Management</div>
                        <NavLink
                            to="/admin/suppliers"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-link-icon">👥</span>
                            Suppliers
                        </NavLink>
                        <NavLink
                            to="/admin/payments"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-link-icon">💰</span>
                            Payments
                        </NavLink>
                        <NavLink
                            to="/admin/payout-requests"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-link-icon">💳</span>
                            Payout Requests
                        </NavLink>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar" style={{ background: 'var(--danger-muted)', color: 'var(--danger-text)' }}>
                            {getInitials(user?.name || 'A')}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name}</div>
                            <div className="sidebar-user-email">{user?.email}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-sm w-full mt-3" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* Mobile Navigation */}
            <nav className="mobile-nav">
                <div className="mobile-nav-items">
                    {navItems.slice(0, 5).map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/admin'}
                            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="mobile-nav-icon">{item.icon}</span>
                            <span>{item.label.split(' ')[0]}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
};
