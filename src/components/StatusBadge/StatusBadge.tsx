// =============================================================================
// Status Badge Component
// =============================================================================

import React from 'react';

type StatusType =
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED'
    | 'MAINTENANCE'
    | 'ACTIVE'
    | 'DISABLED'
    | 'PAID'
    | 'UNPAID'
    | 'APPROVED'
    | 'gmail'
    | 'outlook';

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'badge-pending' },
    VERIFIED: { label: 'Verified', className: 'badge-verified' },
    REJECTED: { label: 'Rejected', className: 'badge-rejected' },
    MAINTENANCE: { label: 'Maintenance', className: 'badge-maintenance' },
    ACTIVE: { label: 'Active', className: 'badge-active' },
    DISABLED: { label: 'Disabled', className: 'badge-disabled' },
    PAID: { label: 'Paid', className: 'badge-paid' },
    UNPAID: { label: 'Unpaid', className: 'badge-unpaid' },
    APPROVED: { label: 'Approved', className: 'badge-verified' },
    gmail: { label: 'Gmail', className: 'badge-gmail' },
    outlook: { label: 'Outlook', className: 'badge-outlook' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
    const config = statusConfig[status] || { label: status, className: '' };

    return (
        <span className={`badge ${config.className} ${className}`}>
            {config.label}
        </span>
    );
};

