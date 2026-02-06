// =============================================================================
// Supplier Layout
// =============================================================================

import React, { useState } from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../utils/formatters';
import { Icon, Icons } from '../../components/Icon';

interface NavItem {
    to: string;
    icon: string;
    label: string;
}

const navItems: NavItem[] = [
    { to: '/supplier', icon: Icons.dashboard, label: 'Dashboard' },
    { to: '/supplier/submit', icon: Icons.submit, label: 'Submit' },
    { to: '/supplier/submissions', icon: Icons.submissions, label: 'Submissions' },
    { to: '/supplier/payments', icon: Icons.payments, label: 'Payments' },
    { to: '/supplier/payout-settings', icon: Icons.settings, label: 'Payout Settings' },
    { to: '/supplier/profile', icon: Icons.profile, label: 'Profile' },
];

export const SupplierLayout: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'supplier') {
        return <Navigate to="/admin" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="layout">
            {/* Mobile Header */}
            <header className="mobile-header">
                <button
                    className="mobile-menu-btn"
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                >
                    <Icon name={Icons.menu} />
                </button>
                <span className="mobile-header-logo">Mailstack</span>
                <div style={{ width: 40 }} /> {/* Spacer for balance */}
            </header>

            {/* Sidebar Overlay (mobile only) */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">Mailstack</div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Menu</div>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/supplier'}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={closeSidebar}
                            >
                                <span className="nav-link-icon">
                                    <Icon name={item.icon} />
                                </span>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} />
                            ) : (
                                getInitials(user?.name || 'U')
                            )}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name}</div>
                            <div className="sidebar-user-email">{user?.email}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-sm w-full mt-3" onClick={handleLogout}>
                        <Icon name={Icons.logout} size="sm" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};
