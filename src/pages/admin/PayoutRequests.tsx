// =============================================================================
// Admin Payout Requests Page - With Payment Method Details
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { apiClient } from '../../api/client';
import { toast } from '../../store/toastStore';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { PayoutRequest, PaginatedResponse, NepalPayoutSettings } from '../../api/types';

type TabType = 'pending' | 'approved' | 'paid';

interface PayoutRequestWithDetails extends PayoutRequest {
    paymentSettings?: NepalPayoutSettings;
}

export const PayoutRequests: React.FC = () => {
    const [requests, setRequests] = useState<PayoutRequestWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<PayoutRequestWithDetails | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const fetchRequests = async (status: string) => {
        setLoading(true);
        try {
            const result = await apiClient.get<PaginatedResponse<PayoutRequestWithDetails>>(
                `/admin/payout-requests?status=${status.toUpperCase()}`
            );
            setRequests(result.data);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(activeTab);
    }, [activeTab]);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await apiClient.post(`/admin/payout-requests/${id}/approve`);
            toast.success('Approved!', 'Payout request has been approved');
            fetchRequests(activeTab);
        } catch (error) {
            toast.error('Error', 'Failed to approve request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleMarkPaid = async (id: string) => {
        setProcessingId(id);
        try {
            await apiClient.post(`/admin/payout-requests/${id}/pay`);
            toast.success('Marked Paid!', 'Payment has been released');
            fetchRequests(activeTab);
            setShowPaymentModal(false);
        } catch (error) {
            toast.error('Error', 'Failed to mark as paid');
        } finally {
            setProcessingId(null);
        }
    };

    const openPaymentDetails = (request: PayoutRequestWithDetails) => {
        setSelectedRequest(request);
        setShowPaymentModal(true);
    };

    const getPaymentMethodLabel = (settings?: NepalPayoutSettings) => {
        if (!settings) return 'Not configured';
        switch (settings.method) {
            case 'esewa': return '💚 eSewa';
            case 'khalti': return '💜 Khalti';
            case 'bank_transfer': return '🏦 Bank Transfer';
            default: return 'Unknown';
        }
    };

    const tabs: { key: TabType; label: string }[] = [
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'paid', label: 'Paid' },
    ];

    const totalPending = requests.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Payout Requests</h1>
                <p className="page-subtitle">Manage supplier payout requests</p>
            </div>

            {/* Summary Stats */}
            {activeTab === 'pending' && requests.length > 0 && (
                <Card className="mb-6" style={{ background: 'var(--warning-muted)', border: 'none' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">💰</span>
                            <div>
                                <div className="font-semibold">Total Pending Payouts</div>
                                <div className="text-sm text-secondary">{requests.length} requests waiting for action</div>
                            </div>
                        </div>
                        <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
                    </div>
                </Card>
            )}

            {/* Tabs */}
            <div className="tabs mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <Card>
                {loading ? (
                    <div className="space-y-4 p-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton skeleton-card" style={{ height: 80 }} />
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-title">No {activeTab} requests</div>
                        <div className="empty-state-description">
                            {activeTab === 'pending'
                                ? 'Supplier payout requests will appear here'
                                : `No ${activeTab} requests to show`
                            }
                        </div>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Supplier</th>
                                    <th>Amount</th>
                                    <th>Payment Method</th>
                                    <th>Requested</th>
                                    {activeTab !== 'pending' && <th>Processed</th>}
                                    <th>Status</th>
                                    <th style={{ width: 200 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <span className="font-medium">{request.supplierName}</span>
                                        </td>
                                        <td>
                                            <span className="font-bold tabular-nums">{formatCurrency(request.amount)}</span>
                                        </td>
                                        <td>
                                            <span className="text-sm">
                                                {getPaymentMethodLabel(request.paymentSettings)}
                                            </span>
                                        </td>
                                        <td className="text-tertiary">{formatDate(request.requestedAt)}</td>
                                        {activeTab !== 'pending' && (
                                            <td className="text-tertiary">
                                                {request.paidAt
                                                    ? formatDate(request.paidAt)
                                                    : request.approvedAt
                                                        ? formatDate(request.approvedAt)
                                                        : '-'
                                                }
                                            </td>
                                        )}
                                        <td>
                                            <StatusBadge status={request.status} />
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {request.status === 'PENDING' && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleApprove(request.id)}
                                                        loading={processingId === request.id}
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                                {request.status === 'APPROVED' && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => openPaymentDetails(request)}
                                                    >
                                                        Pay Now
                                                    </Button>
                                                )}
                                                {request.status !== 'PAID' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openPaymentDetails(request)}
                                                    >
                                                        Details
                                                    </Button>
                                                )}
                                                {request.status === 'PAID' && (
                                                    <span className="text-success text-sm">✓ Completed</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Payment Details Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Payment Details"
            >
                {selectedRequest && (
                    <div>
                        {/* Amount */}
                        <div className="mb-6 p-4 bg-surface-2 rounded-lg text-center">
                            <div className="text-sm text-tertiary mb-1">Amount to Pay</div>
                            <div className="text-3xl font-bold text-accent">
                                {formatCurrency(selectedRequest.amount)}
                            </div>
                            <div className="text-sm text-secondary mt-1">to {selectedRequest.supplierName}</div>
                        </div>

                        {/* Payment Method Details */}
                        {selectedRequest.paymentSettings ? (
                            <div className="space-y-4">
                                <div className="text-lg font-semibold">
                                    {getPaymentMethodLabel(selectedRequest.paymentSettings)}
                                </div>

                                {(selectedRequest.paymentSettings.method === 'esewa' ||
                                    selectedRequest.paymentSettings.method === 'khalti') && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs text-tertiary uppercase tracking-wide">Wallet ID</div>
                                                    <div className="font-mono font-semibold">{selectedRequest.paymentSettings.walletId}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-tertiary uppercase tracking-wide">Name</div>
                                                    <div className="font-medium">{selectedRequest.paymentSettings.walletName}</div>
                                                </div>
                                            </div>
                                            {selectedRequest.paymentSettings.walletQrUrl && (
                                                <div className="text-center p-4 bg-white rounded-lg">
                                                    <img
                                                        src={selectedRequest.paymentSettings.walletQrUrl}
                                                        alt="Payment QR"
                                                        style={{ maxWidth: 200, maxHeight: 200, margin: '0 auto' }}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                {selectedRequest.paymentSettings.method === 'bank_transfer' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-tertiary uppercase tracking-wide">Bank Name</div>
                                                <div className="font-medium">{selectedRequest.paymentSettings.bankName}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-tertiary uppercase tracking-wide">Account Holder</div>
                                                <div className="font-medium">{selectedRequest.paymentSettings.bankAccountHolderName}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-tertiary uppercase tracking-wide">Account Number</div>
                                            <div className="font-mono font-semibold text-lg">{selectedRequest.paymentSettings.bankAccountNumber}</div>
                                        </div>
                                        {selectedRequest.paymentSettings.bankQrUrl && (
                                            <div className="text-center p-4 bg-white rounded-lg">
                                                <img
                                                    src={selectedRequest.paymentSettings.bankQrUrl}
                                                    alt="Bank QR"
                                                    style={{ maxWidth: 200, maxHeight: 200, margin: '0 auto' }}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-tertiary py-4">
                                <span className="text-2xl mb-2 block">⚠️</span>
                                Supplier has not configured payment settings.
                            </div>
                        )}

                        {/* Action Button */}
                        {selectedRequest.status === 'APPROVED' && (
                            <div className="mt-6 pt-4 border-t border-subtle">
                                <Button
                                    variant="primary"
                                    block
                                    onClick={() => handleMarkPaid(selectedRequest.id)}
                                    loading={processingId === selectedRequest.id}
                                >
                                    ✓ Mark as Paid
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
