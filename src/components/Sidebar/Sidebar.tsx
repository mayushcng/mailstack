// =============================================================================
// Sidebar Component
// =============================================================================

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Icon } from '../Icon';

interface NavItem {
    path: string;
    label: string;
    icon: string; // Font Awesome icon name (e.g., 'chart-line', 'users')
}

interface NavSection {
    title?: string;
    items: NavItem[];
}

interface SidebarProps {
    sections: NavSection[];
    logo?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ sections, logo = 'Mailstack' }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <>
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <span className="sidebar-logo">{logo}</span>
                </div>

                <nav className="sidebar-nav">
                    {sections.map((section, idx) => (
                        <div key={idx} className="sidebar-section">
                            {section.title && (
                                <div className="sidebar-section-title">{section.title}</div>
                            )}
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `sidebar-link ${isActive ? 'active' : ''}`
                                    }
                                    end={item.path === '/supplier' || item.path === '/admin'}
                                >
                                    <span className="sidebar-link-icon"><Icon name={item.icon} size="sm" /></span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="avatar avatar-sm">
                            {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1" style={{ minWidth: 0 }}>
                            <div className="text-sm font-medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.name}
                            </div>
                            <div className="text-xs text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.email}
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-block btn-sm" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <button
                className="sidebar-toggle"
                onClick={toggleSidebar}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
        </>
    );
};

// =============================================================================
// Mobile Navigation Component
// =============================================================================

interface MobileNavProps {
    items: NavItem[];
}

export const MobileNav: React.FC<MobileNavProps> = ({ items }) => {
    return (
        <nav className="mobile-nav">
            {items.slice(0, 5).map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `mobile-nav-item ${isActive ? 'active' : ''}`
                    }
                >
                    <span className="mobile-nav-icon"><Icon name={item.icon} size="sm" /></span>
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};
