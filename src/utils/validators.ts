// =============================================================================
// Validators - Form validation utilities
// =============================================================================

export const validators = {
    email: (value: string): string | null => {
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return null;
    },

    password: (value: string): string | null => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return null;
    },

    confirmPassword: (value: string, password: string): string | null => {
        if (!value) return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        return null;
    },

    required: (value: string, fieldName = 'This field'): string | null => {
        if (!value || !value.trim()) return `${fieldName} is required`;
        return null;
    },

    minLength: (value: string, min: number, fieldName = 'This field'): string | null => {
        if (value.length < min) return `${fieldName} must be at least ${min} characters`;
        return null;
    },

    maxLength: (value: string, max: number, fieldName = 'This field'): string | null => {
        if (value.length > max) return `${fieldName} must be at most ${max} characters`;
        return null;
    },
};

// Email parsing for batch submission
export const parseEmails = (text: string) => {
    const lines = text.split('\n');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const valid: string[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
        const email = line.trim().toLowerCase();
        if (!email) continue;

        if (!emailRegex.test(email)) {
            invalid.push(email);
        } else if (seen.has(email)) {
            duplicates.push(email);
        } else {
            valid.push(email);
            seen.add(email);
        }
    }

    return { valid, invalid, duplicates, total: lines.filter((l) => l.trim()).length };
};
