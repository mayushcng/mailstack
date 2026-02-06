// =============================================================================
// Supplier Payments Page
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { apiClient } from '../../api/client';
import { toast } from '../../store/toastStore';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { MINIMUM_PAYOUT } from '../../api/types';
import type { Payment, PayoutRequest } from '../../api/types';

interface PaymentsData {
    earned: number;
    paid: number;
    unpaid: number;
    pendingRequest: PayoutRequest | null;
    payments: Payment[];
}

export const Payments: React.FC = () => {
    const [data, setData] = useState<PaymentsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    const fetchData = async () => {
        try {
            const result = await apiClient.get<PaymentsData>('/supplier/payments');
            setData(result);
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRequestPayout = async () => {
        if (!data || data.unpaid < MINIMUM_PAYOUT) return;

        setIsRequesting(true);
        try {
            await apiClient.post('/supplier/request-payout', { amount: data.unpaid });
            toast.success('Request Submitted!', 'Your payout request has been sent for approval.');
            setShowRequestModal(false);
            fetchData(); // Refresh data
        } catch (error) {
            toast.error('Failed', 'Could not submit payout request. Please try again.');
        } finally {
            setIsRequesting(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="page-header">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text mt-2" style={{ width: 200 }} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton skeleton-card" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <div className="empty-state-title">Failed to load payments</div>
                </div>
            </div>
        );
    }

    const canRequestPayout = data.unpaid >= MINIMUM_PAYOUT && !data.pendingRequest;

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Payments</h1>
                <p className="page-subtitle">Your earnings and payment history</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard
                    icon="💰"
                    iconColor="success"
                    value={formatCurrency(data.earned)}
                    label="Total Earned"
                />
                <StatCard
                    icon="✅"
                    iconColor="primary"
                    value={formatCurrency(data.paid)}
                    label="Already Paid"
                />
                <StatCard
                    icon="⏳"
                    iconColor="warning"
                    value={formatCurrency(data.unpaid)}
                    label="Available"
                />
            </div>

            {/* Pending Request Banner */}
            {data.pendingRequest && (
                <Card className="mb-6" style={{ background: 'var(--warning-muted)', border: 'none' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📨</span>
                            <div>
                                <div className="font-semibold">Payout Request Pending</div>
                                <div className="text-sm text-secondary">
                                    You requested {formatCurrency(data.pendingRequest.amount)} on{' '}
                                    {formatDate(data.pendingRequest.requestedAt)}
                                </div>
                            </div>
                        </div>
                        <StatusBadge status={data.pendingRequest.status} />
                    </div>
                </Card>
            )}

            {/* Request Payout Button */}
            <Card className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="card-title mb-1">Request Payout</h3>
                        <p className="text-sm text-tertiary">
                            Minimum payout is {formatCurrency(MINIMUM_PAYOUT)}.
                            You have {formatCurrency(data.unpaid)} available.
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowRequestModal(true)}
                        disabled={!canRequestPayout}
                    >
                        {data.pendingRequest
                            ? 'Request Pending'
                            : data.unpaid < MINIMUM_PAYOUT
                                ? `Need ${formatCurrency(MINIMUM_PAYOUT - data.unpaid)} more`
                                : 'Request Payout'
                        }
                    </Button>
                </div>
            </Card>

            {/* Payment History */}
            <Card>
                <div className="card-header">
                    <h3 className="card-title">Payment History</h3>
                </div>

                {data.payments.length === 0 ? (
                    <div className="empty-state" style={{ padding: '48px' }}>
                        <div className="empty-state-icon">💳</div>
                        <div className="empty-state-title">No payments yet</div>
                        <div className="empty-state-description">
                            Your payment history will appear here once you receive payments
                        </div>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Verified Accounts</th>
                                    <th>Rate</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Paid On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>{payment.period}</td>
                                        <td className="tabular-nums">{payment.verifiedCount}</td>
                                        <td className="tabular-nums">{formatCurrency(payment.rate)}</td>
                                        <td className="tabular-nums font-semibold">{formatCurrency(payment.amount)}</td>
                                        <td>
                                            <StatusBadge status={payment.status} />
                                        </td>
                                        <td className="text-tertiary">
                                            {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Request Modal */}
            <Modal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                title="Confirm Payout Request"
            >
                <div className="text-center mb-6">
                    <div className="text-4xl mb-4">💰</div>
                    <p className="text-secondary">You are requesting a payout of</p>
                    <div className="text-3xl font-bold text-success mt-2">
                        {formatCurrency(data.unpaid)}
                    </div>
                </div>

                <div className="p-4 rounded-lg mb-6" style={{ background: 'var(--bg-tertiary)' }}>
                    <p className="text-sm text-tertiary text-center">
                        Make sure your payout settings are up to date.
                        The admin will review and process your request.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setShowRequestModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleRequestPayout}
                        loading={isRequesting}
                    >
                        Confirm Request
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
