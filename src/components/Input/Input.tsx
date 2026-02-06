// =============================================================================
// Input Component
// =============================================================================

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string | null;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className = '', id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

        return (
            <div className="form-group">
                {label && (
                    <label htmlFor={inputId} className="form-label">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`form-input ${error ? 'error' : ''} ${className}`}
                    {...props}
                />
                {error && <div className="form-error">{error}</div>}
                {hint && !error && <div className="form-hint">{hint}</div>}
            </div>
        );
    }
);

Input.displayName = 'Input';

// =============================================================================
// Textarea Component
// =============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string | null;
    hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, className = '', id, ...props }, ref) => {
        const inputId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;

        return (
            <div className="form-group">
                {label && (
                    <label htmlFor={inputId} className="form-label">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={inputId}
                    className={`form-input ${error ? 'error' : ''} ${className}`}
                    {...props}
                />
                {error && <div className="form-error">{error}</div>}
                {hint && !error && <div className="form-hint">{hint}</div>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
