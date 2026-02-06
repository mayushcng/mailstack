// =============================================================================
// Admin Layout - Protected layout for admins
// =============================================================================

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Sidebar } from '../components/Sidebar';

const adminNavSections = [
    {
        title: 'Overview',
        items: [
            { path: '/admin', label: 'Dashboard', icon: 'chart-line' },
        ],
    },
    {
        title: 'Gmails',
        items: [
            { path: '/admin/queue', label: 'Review Queue', icon: 'clipboard-list' },
            { path: '/admin/verified', label: 'Verified', icon: 'circle-check' },
            { path: '/admin/rejected', label: 'Rejected', icon: 'circle-xmark' },
        ],
    },
    {
        title: 'Suppliers',
        items: [
            { path: '/admin/suppliers', label: 'All Suppliers', icon: 'users' },
            { path: '/admin/registrations', label: 'Registrations', icon: 'user-plus' },
        ],
    },
    {
        title: 'Payments',
        items: [
            { path: '/admin/payments', label: 'Payments', icon: 'credit-card' },
            { path: '/admin/payouts', label: 'Payout Requests', icon: 'money-bill-transfer' },
        ],
    },
    {
        title: 'System',
        items: [
            { path: '/admin/settings', label: 'Settings', icon: 'gear' },
        ],
    },
];

export const AdminLayout: React.FC = () => {
    const { user } = useAuthStore();

    // Redirect if not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect suppliers to supplier area
    if (user.role !== 'admin') {
        return <Navigate to="/supplier" replace />;
    }

    return (
        <>
            <Sidebar sections={adminNavSections} logo="Mailstack Admin" />
            <main className="main-with-sidebar">
                <Outlet />
            </main>
        </>
    );
};

