// =============================================================================
// Admin Review Queue Page
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Textarea } from '../../components/Input';
import { apiClient } from '../../api/client';
import { toast } from '../../store/toastStore';
import { formatDate } from '../../utils/formatters';
import { REJECTION_REMARKS } from '../../api/types';
import type { Gmail, PaginatedResponse, EmailType, Supplier } from '../../api/types';

// Maintenance reasons
const MAINTENANCE_REASONS = [
    'Account locked - requires verification',
    'Phone verification required',
    'Suspicious activity detected',
    'Unusual login location',
    'Temporary hold for review',
    'Other (specify below)',
] as const;

export const ReviewQueue: React.FC = () => {
    const [gmails, setGmails] = useState<Gmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [rejectRemark, setRejectRemark] = useState('');
    const [maintenanceReason, setMaintenanceReason] = useState('');
    const [customRemark, setCustomRemark] = useState('');
    const [customMaintenance, setCustomMaintenance] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailTypeFilter, setEmailTypeFilter] = useState<EmailType | ''>('');
    const [supplierFilter, setSupplierFilter] = useState('');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch suppliers for filter dropdown
    const fetchSuppliers = useCallback(async () => {
        try {
            const result = await apiClient.get<PaginatedResponse<Supplier>>(
                '/admin/suppliers?limit=100'
            );
            setSuppliers(result.data);
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        }
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const fetchGmails = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                status: 'PENDING',
                page: String(page),
                limit: '20',
            });
            if (emailTypeFilter) {
                params.append('emailType', emailTypeFilter);
            }
            if (supplierFilter) {
                params.append('supplierId', supplierFilter);
            }

            const result = await apiClient.get<PaginatedResponse<Gmail>>(
                `/admin/gmails?${params.toString()}`
            );
            setGmails(result.data);
            setTotalPages(result.totalPages);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Failed to fetch gmails:', error);
            toast.error('Error', 'Failed to load review queue');
        } finally {
            setLoading(false);
        }
    }, [page, emailTypeFilter, supplierFilter]);

    useEffect(() => {
        fetchGmails();
    }, [fetchGmails]);

    const currentGmail = gmails[currentIndex];

    const handleVerify = async () => {
        if (!currentGmail) return;

        setIsProcessing(true);
        try {
            await apiClient.post('/admin/gmails/verify', { gmailIds: [currentGmail.id] });
            toast.success('Verified!', `${currentGmail.email} has been verified.`);
            moveToNext();
        } catch (error) {
            toast.error('Error', 'Failed to verify account');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!currentGmail) return;

        const finalRemark = rejectRemark === 'Other (specify below)' ? customRemark : rejectRemark;

        if (!finalRemark) {
            toast.error('Required', 'Please select or enter a rejection reason');
            return;
        }

        setIsProcessing(true);
        try {
            await apiClient.post('/admin/gmails/reject', {
                gmailIds: [currentGmail.id],
                remark: finalRemark,
            });
            toast.success('Rejected', `${currentGmail.email} has been rejected.`);
            setShowRejectModal(false);
            setRejectRemark('');
            setCustomRemark('');
            moveToNext();
        } catch (error) {
            toast.error('Error', 'Failed to reject account');
        } finally {
            setIsProcessing(false);
        }
    };

    const moveToNext = () => {
        // Remove current from list
        const newGmails = gmails.filter((_, i) => i !== currentIndex);
        setGmails(newGmails);

        if (newGmails.length === 0 && page < totalPages) {
            setPage(page + 1);
        } else if (currentIndex >= newGmails.length) {
            setCurrentIndex(Math.max(0, newGmails.length - 1));
        }
    };

    const handleSkip = () => {
        if (currentIndex < gmails.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else if (page < totalPages) {
            setPage(page + 1);
        }
    };

    const handleMaintenance = async () => {
        if (!currentGmail) return;

        const finalReason = maintenanceReason === 'Other (specify below)' ? customMaintenance : maintenanceReason;

        if (!finalReason) {
            toast.error('Required', 'Please select or enter a maintenance reason');
            return;
        }

        setIsProcessing(true);
        try {
            await apiClient.post('/admin/gmails/maintenance', {
                gmailIds: [currentGmail.id],
                reason: finalReason,
            });
            toast.success('Maintenance', `${currentGmail.email} flagged for maintenance.`);
            setShowMaintenanceModal(false);
            setMaintenanceReason('');
            setCustomMaintenance('');
            moveToNext();
        } catch (error) {
            toast.error('Error', 'Failed to flag for maintenance');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="page-header">
                    <div className="skeleton skeleton-title" />
                </div>
                <div className="skeleton skeleton-card" style={{ height: 400 }} />
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">Review Queue</h1>
                        <p className="page-subtitle">
                            {gmails.length > 0
                                ? `${currentIndex + 1} of ${gmails.length} pending (Page ${page}/${totalPages})`
                                : 'All caught up!'
                            }
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="form-select"
                            value={supplierFilter}
                            onChange={(e) => setSupplierFilter(e.target.value)}
                            style={{ width: 'auto' }}
                        >
                            <option value="">All Suppliers</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                        <select
                            className="form-select"
                            value={emailTypeFilter}
                            onChange={(e) => setEmailTypeFilter(e.target.value as EmailType | '')}
                            style={{ width: 'auto' }}
                        >
                            <option value="">All Types</option>
                            <option value="gmail">Gmail Only</option>
                            <option value="outlook">Outlook Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {gmails.length === 0 ? (
                <Card>
                    <div className="empty-state">
                        <div className="empty-state-icon">✅</div>
                        <div className="empty-state-title">No accounts pending review</div>
                        <div className="empty-state-description">
                            Great job! All accounts have been reviewed.
                        </div>
                        <Button variant="secondary" onClick={fetchGmails} className="mt-4">
                            Refresh
                        </Button>
                    </div>
                </Card>
            ) : currentGmail ? (
                <Card>
                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div
                            className="h-1 rounded-full"
                            style={{
                                background: 'var(--bg-tertiary)',
                                overflow: 'hidden'
                            }}
                        >
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${((currentIndex + 1) / gmails.length) * 100}%`,
                                    background: 'var(--accent)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        {/* Left Column: Credentials */}
                        <div>
                            <h3 className="text-sm font-semibold text-tertiary uppercase tracking-wide mb-4">
                                Account Credentials
                            </h3>

                            <div className="space-y-4">
                                {/* Email */}
                                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                                    <label className="text-xs text-tertiary uppercase tracking-wide">Email</label>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="mono text-lg font-medium">{currentGmail.email}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigator.clipboard.writeText(currentGmail.email)}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                                    <label className="text-xs text-tertiary uppercase tracking-wide">Password</label>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="mono text-lg font-medium">
                                            {showPassword ? currentGmail.password : '••••••••••'}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? 'Hide' : 'Show'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigator.clipboard.writeText(currentGmail.password)}
                                            >
                                                Copy
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Login Hint */}
                            <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: 'var(--accent-muted)' }}>
                                <span className="text-accent">💡</span> Open{' '}
                                <a
                                    href={currentGmail.emailType === 'gmail'
                                        ? 'https://accounts.google.com'
                                        : 'https://outlook.live.com'
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent underline"
                                >
                                    {currentGmail.emailType === 'gmail' ? 'Google Login' : 'Outlook Login'}
                                </a>
                                {' '}in a new tab to verify.
                            </div>
                        </div>

                        {/* Right Column: Metadata */}
                        <div>
                            <h3 className="text-sm font-semibold text-tertiary uppercase tracking-wide mb-4">
                                Submission Info
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-tertiary">Type</span>
                                    <StatusBadge status={currentGmail.emailType} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-tertiary">Supplier</span>
                                    <span className="font-medium">{currentGmail.supplierName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-tertiary">Supplier Code</span>
                                    <span className="mono text-sm">{currentGmail.supplierCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-tertiary">Submitted</span>
                                    <span>{formatDate(currentGmail.submittedAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <Button
                            variant="success"
                            className="flex-1"
                            onClick={handleVerify}
                            loading={isProcessing}
                        >
                            ✓ Verify Account
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={() => setShowRejectModal(true)}
                        >
                            ✕ Reject Account
                        </Button>
                        <Button
                            variant="warning"
                            onClick={() => setShowMaintenanceModal(true)}
                        >
                            ⚠️ Maintenance
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleSkip}
                            disabled={currentIndex === gmails.length - 1 && page === totalPages}
                        >
                            Skip →
                        </Button>
                    </div>
                </Card>
            ) : null}

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Reject Account"
            >
                <p className="text-secondary mb-4">
                    Select a reason for rejecting <strong className="text-primary">{currentGmail?.email}</strong>
                </p>

                <div className="space-y-2 mb-4">
                    {REJECTION_REMARKS.map((remark) => (
                        <label
                            key={remark}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${rejectRemark === remark
                                ? 'bg-danger-muted'
                                : 'bg-tertiary hover:bg-elevated'
                                }`}
                            style={{ background: rejectRemark === remark ? 'var(--danger-muted)' : 'var(--bg-tertiary)' }}
                        >
                            <input
                                type="radio"
                                name="remark"
                                value={remark}
                                checked={rejectRemark === remark}
                                onChange={(e) => setRejectRemark(e.target.value)}
                                className="form-radio mr-3"
                            />
                            <span className="text-sm">{remark}</span>
                        </label>
                    ))}
                </div>

                {rejectRemark === 'Other (specify below)' && (
                    <Textarea
                        placeholder="Enter custom rejection reason..."
                        value={customRemark}
                        onChange={(e) => setCustomRemark(e.target.value)}
                        className="mb-4"
                    />
                )}

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setShowRejectModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        className="flex-1"
                        onClick={handleReject}
                        loading={isProcessing}
                    >
                        Reject
                    </Button>
                </div>
            </Modal>

            {/* Maintenance Modal */}
            <Modal
                isOpen={showMaintenanceModal}
                onClose={() => setShowMaintenanceModal(false)}
                title="Flag for Maintenance"
            >
                <p className="text-secondary mb-4">
                    Select a reason for flagging <strong className="text-primary">{currentGmail?.email}</strong> for maintenance
                </p>

                <div className="space-y-2 mb-4">
                    {MAINTENANCE_REASONS.map((reason) => (
                        <label
                            key={reason}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${maintenanceReason === reason
                                ? 'bg-warning-muted'
                                : 'bg-tertiary hover:bg-elevated'
                                }`}
                            style={{ background: maintenanceReason === reason ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)' }}
                        >
                            <input
                                type="radio"
                                name="maintenance"
                                value={reason}
                                checked={maintenanceReason === reason}
                                onChange={(e) => setMaintenanceReason(e.target.value)}
                                className="form-radio mr-3"
                            />
                            <span className="text-sm">{reason}</span>
                        </label>
                    ))}
                </div>

                {maintenanceReason === 'Other (specify below)' && (
                    <Textarea
                        placeholder="Enter custom maintenance reason..."
                        value={customMaintenance}
                        onChange={(e) => setCustomMaintenance(e.target.value)}
                        className="mb-4"
                    />
                )}

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setShowMaintenanceModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleMaintenance}
                        loading={isProcessing}
                        style={{ background: 'var(--warning)', borderColor: 'var(--warning)' }}
                    >
                        Flag for Maintenance
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
