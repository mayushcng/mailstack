// =============================================================================
// Supplier Layout - Protected layout for suppliers
// =============================================================================

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Sidebar } from '../components/Sidebar';

const supplierNavSections = [
    {
        items: [
            { path: '/supplier', label: 'Dashboard', icon: 'chart-line' },
            { path: '/supplier/submit', label: 'Submit Batch', icon: 'paper-plane' },
            { path: '/supplier/submissions', label: 'My Submissions', icon: 'envelope' },
            { path: '/supplier/payments', label: 'Payments', icon: 'coins' },
            { path: '/supplier/payout-settings', label: 'Payout Settings', icon: 'wallet' },
            { path: '/supplier/profile', label: 'Profile', icon: 'user' },
        ],
    },
];

export const SupplierLayout: React.FC = () => {
    const { user } = useAuthStore();

    // Redirect if not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect admins to admin area
    if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    return (
        <>
            <Sidebar sections={supplierNavSections} />
            <main className="main-with-sidebar">
                <Outlet />
            </main>
        </>
    );
};

