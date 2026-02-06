// =============================================================================
// Icon Component - Font Awesome Icon Wrapper
// =============================================================================

import React from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface IconProps {
    name: string;           // Font Awesome icon name (e.g., 'gift', 'envelope')
    prefix?: 'fas' | 'far' | 'fab'; // solid, regular, or brands
    size?: IconSize;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

const sizeClasses: Record<IconSize, string> = {
    xs: 'fa-xs',
    sm: 'fa-sm',
    md: '',           // default size
    lg: 'fa-lg',
    xl: 'fa-xl',
    '2xl': 'fa-2xl',
};

export const Icon: React.FC<IconProps> = ({
    name,
    prefix = 'fas',
    size = 'md',
    className = '',
    style,
    onClick,
}) => {
    const sizeClass = sizeClasses[size];
    const iconClass = `${prefix} fa-${name} ${sizeClass} ${className}`.trim();

    return (
        <i
            className={iconClass}
            style={style}
            onClick={onClick}
            aria-hidden="true"
        />
    );
};

// =============================================================================
// Common Icon Mappings for Mailstack
// =============================================================================

export const Icons = {
    // Navigation
    dashboard: 'chart-line',
    submit: 'paper-plane',
    submissions: 'list-check',
    payments: 'wallet',
    settings: 'gear',
    profile: 'user',

    // Status
    pending: 'clock',
    verified: 'circle-check',
    rejected: 'circle-xmark',
    warning: 'triangle-exclamation',
    success: 'check',
    error: 'xmark',

    // Actions
    send: 'paper-plane',
    upload: 'arrow-up-from-bracket',
    download: 'arrow-down-to-bracket',
    delete: 'trash',
    edit: 'pen',
    view: 'eye',
    hide: 'eye-slash',

    // Finance
    money: 'coins',
    wallet: 'wallet',
    bank: 'building-columns',
    creditCard: 'credit-card',
    invoice: 'file-invoice-dollar',

    // Email
    gmail: 'envelope',
    outlook: 'inbox',
    email: 'envelope',

    // Rewards & Bonuses
    gift: 'gift',
    trophy: 'trophy',
    crown: 'crown',
    star: 'star',
    target: 'bullseye',

    // Users
    user: 'user',
    userPlus: 'user-plus',
    users: 'users',

    // Communication
    telegram: 'telegram',
    phone: 'phone',

    // Misc
    clipboard: 'clipboard-list',
    chart: 'chart-pie',
    activity: 'chart-line',
    circle: 'circle',
    menu: 'bars',
    close: 'xmark',
    chevronLeft: 'chevron-left',
    chevronRight: 'chevron-right',
    chevronDown: 'chevron-down',
    logout: 'right-from-bracket',
} as const;

export type IconName = keyof typeof Icons;
