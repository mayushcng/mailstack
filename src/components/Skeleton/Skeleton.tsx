// =============================================================================
// Skeleton Components
// =============================================================================

import React from 'react';

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height = '1em',
    borderRadius,
    className = '',
}) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height, borderRadius }}
        />
    );
};

// Preset skeletons
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
    return (
        <>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton skeleton-text"
                    style={{ width: i === lines - 1 ? '70%' : '100%' }}
                />
            ))}
        </>
    );
};

export const SkeletonCard: React.FC = () => {
    return <div className="skeleton skeleton-card" />;
};

export const SkeletonRow: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i}>
                    <Skeleton width="80%" />
                </td>
            ))}
        </tr>
    );
};

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizes = { sm: '32px', md: '40px', lg: '64px' };
    return <div className="skeleton skeleton-avatar" style={{ width: sizes[size], height: sizes[size] }} />;
};
