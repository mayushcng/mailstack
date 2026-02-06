// =============================================================================
// Toast Component
// =============================================================================

import React from 'react';
import { useToastStore, type Toast as ToastType } from '../../store/toastStore';

const ToastIcon: React.FC<{ type: ToastType['type'] }> = ({ type }) => {
    const icons: Record<ToastType['type'], string> = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };
    return <span className="toast-icon">{icons[type]}</span>;
};

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
    const { removeToast } = useToastStore();

    return (
        <div className={`toast toast-${toast.type}`}>
            <ToastIcon type={toast.type} />
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
                ✕
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
};
