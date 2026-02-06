// =============================================================================
// Admin Payments Page
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { apiClient } from '../../api/client';
import { toast } from '../../store/toastStore';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Payment, PaginatedResponse } from '../../api/types';

export const Payments: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'PAID' | 'UNPAID' | ''>('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '10',
            });
            if (statusFilter) params.append('status', statusFilter);

            const result = await apiClient.get<PaginatedResponse<Payment>>(
                `/admin/payments?${params.toString()}`
            );
            setPayments(result.data);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [page, statusFilter]);

    const handleMarkPaid = async (id: string) => {
        setProcessingId(id);
        try {
            await apiClient.post(`/admin/payments/${id}/mark-paid`);
            toast.success('Marked Paid!', 'Payment status updated');
            fetchPayments();
        } catch (error) {
            toast.error('Error', 'Failed to update payment');
        } finally {
            setProcessingId(null);
        }
    };

    const totalUnpaid = payments
        .filter(p => p.status === 'UNPAID')
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Payments</h1>
                <p className="page-subtitle">Manage supplier payments</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard
                    icon="💰"
                    iconColor="success"
                    value={formatCurrency(payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0))}
                    label="Total Paid"
                />
                <StatCard
                    icon="⏳"
                    iconColor="warning"
                    value={formatCurrency(totalUnpaid)}
                    label="Total Unpaid"
                />
                <StatCard
                    icon="📊"
                    iconColor="primary"
                    value={payments.length}
                    label="Total Records"
                />
            </div>

            <Card padding="none">
                <div className="table-header">
                    <div className="flex gap-2">
                        <button
                            className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setStatusFilter('')}
                        >
                            All
                        </button>
                        <button
                            className={`btn btn-sm ${statusFilter === 'UNPAID' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setStatusFilter('UNPAID')}
                        >
                            Unpaid
                        </button>
                        <button
                            className={`btn btn-sm ${statusFilter === 'PAID' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setStatusFilter('PAID')}
                        >
                            Paid
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-text mb-4" style={{ height: 48 }} />
                        ))}
                    </div>
                ) : payments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">💳</div>
                        <div className="empty-state-title">No payments found</div>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Supplier</th>
                                    <th>Period</th>
                                    <th>Verified</th>
                                    <th>Rate</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Paid On</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>{payment.supplierName}</td>
                                        <td className="text-sm">{payment.period}</td>
                                        <td className="tabular-nums">{payment.verifiedCount}</td>
                                        <td className="tabular-nums">{formatCurrency(payment.rate)}</td>
                                        <td className="tabular-nums font-semibold">{formatCurrency(payment.amount)}</td>
                                        <td><StatusBadge status={payment.status} /></td>
                                        <td className="text-tertiary">{payment.paidAt ? formatDate(payment.paidAt) : '-'}</td>
                                        <td>
                                            {payment.status === 'UNPAID' ? (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => handleMarkPaid(payment.id)}
                                                    loading={processingId === payment.id}
                                                >
                                                    Mark Paid
                                                </Button>
                                            ) : (
                                                <span className="text-success text-sm">✓ Paid</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="table-footer">
                        <span>Page {page} of {totalPages}</span>
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                ←
                            </button>
                            <button
                                className="pagination-btn"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                →
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
