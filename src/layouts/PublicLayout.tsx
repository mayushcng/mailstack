// =============================================================================
// Public Layout - For unauthenticated pages
// =============================================================================

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const PublicLayout: React.FC = () => {
    const { user } = useAuthStore();

    // If logged in, redirect to appropriate dashboard
    if (user) {
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/supplier" replace />;
    }

    return <Outlet />;
};
