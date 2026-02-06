// =============================================================================
// Formatters - Data formatting utilities
// =============================================================================

/**
 * Format a number as Nepali Rupees (Rs.)
 */
export const formatCurrency = (amount: number): string => {
    const formatted = new Intl.NumberFormat('en-NP', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
    return `Rs. ${formatted}`;
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

/**
 * Format a date string to include time
 */
export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    }
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }

    return formatDate(dateString);
};

/**
 * Format a number with thousands separators (Indian numbering)
 */
export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format a number as percentage
 */
export const formatPercent = (value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)}%`;
};

/**
 * Truncate a string to a maximum length
 */
export const truncate = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength - 3)}...`;
};

/**
 * Get initials from a name
 */
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Mask a password showing only first and last character
 */
export const maskPassword = (password: string): string => {
    if (password.length <= 2) return '••';
    return `${password[0]}${'•'.repeat(password.length - 2)}${password[password.length - 1]}`;
};

/**
 * Mask email showing partial address
 */
export const maskEmail = (email: string): string => {
    const [local, domain] = email.split('@');
    if (local.length <= 3) return email;
    return `${local.slice(0, 2)}${'•'.repeat(local.length - 3)}${local.slice(-1)}@${domain}`;
};

// Export all formatters as a namespace
export const formatters = {
    currency: formatCurrency,
    date: formatDate,
    dateTime: formatDateTime,
    relativeTime: formatRelativeTime,
    number: formatNumber,
    percent: formatPercent,
    truncate,
    initials: getInitials,
    maskPassword,
    maskEmail,
};
