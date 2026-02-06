// =============================================================================
// Card Component
// =============================================================================

import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    style,
}) => {
    const getPaddingClass = () => {
        switch (padding) {
            case 'none': return '';
            case 'sm': return 'p-3';
            case 'lg': return 'p-6';
            default: return '';
        }
    };

    return (
        <div
            className={`card ${getPaddingClass()} ${className}`}
            style={{ padding: padding === 'none' ? '0' : undefined, ...style }}
        >
            {children}
        </div>
    );
};

// =============================================================================
// Stat Card Component
// =============================================================================

type IconColor = 'primary' | 'success' | 'danger' | 'warning' | 'pending';

interface StatCardProps {
    icon: React.ReactNode;
    iconColor?: IconColor;
    iconVariant?: IconColor; // Alias for backwards compatibility
    value: string | number;
    label: string;
    onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
    icon,
    iconColor,
    iconVariant = 'primary',
    value,
    label,
    onClick,
}) => {
    const color = iconColor || iconVariant;

    return (
        <div
            className="stat-card"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className={`stat-card-icon ${color}`}>{icon}</div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
        </div>
    );
};
