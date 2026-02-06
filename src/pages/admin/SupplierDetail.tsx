// =============================================================================
// Supplier Detail Page (Admin)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatCard, Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { SkeletonCard } from '../../components/Skeleton';
import { apiClient } from '../../api/client';
import { formatters } from '../../utils/formatters';
import { toast } from '../../store/toastStore';
import type { Gmail, SupplierStats, PaginatedResponse } from '../../api/types';

type TabValue = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'payments';

const TABS: { label: string; value: TabValue }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Payments', value: 'payments' },
];

export const SupplierDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [stats, setStats] = useState<SupplierStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabValue>('PENDING');

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        rate: '',
        code: '',
        isVip: false,
        bonusAmount: '',
        bonusThreshold: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    // Gmail list state
    const [gmails, setGmails] = useState<Gmail[]>([]);
    const [gmailsLoading, setGmailsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchStats = useCallback(async () => {
        if (!id) return;
        try {
            const data = await apiClient.get<SupplierStats>(`/admin/suppliers/${id}`);
            setStats(data);
            setEditData({
                rate: String(data.supplier.rate),
                code: data.supplier.code,
                isVip: data.supplier.isVip,
                bonusAmount: data.supplier.bonusAmount ? String(data.supplier.bonusAmount) : '',
                bonusThreshold: data.supplier.bonusThreshold ? String(data.supplier.bonusThreshold) : '',
            });
        } catch (error) {
            console.error('Failed to fetch supplier:', error);
            toast.error('Error', 'Could not load supplier details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchGmails = useCallback(async () => {
        if (!id || activeTab === 'payments') return;
        setGmailsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '10');
            params.set('status', activeTab);
            params.set('supplierId', id);

            const response = await apiClient.get<PaginatedResponse<Gmail>>(
                `/admin/gmails?${params.toString()}`
            );

            setGmails(response.data);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to fetch gmails:', error);
        } finally {
            setGmailsLoading(false);
        }
    }, [id, activeTab, page]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (activeTab !== 'payments') {
            fetchGmails();
        }
    }, [activeTab, fetchGmails]);

    const handleSaveEdit = async () => {
        if (!id) return;
        setIsSaving(true);
        try {
            await apiClient.patch(`/admin/suppliers/${id}`, {
                rate: parseFloat(editData.rate),
                code: editData.code,
                isVip: editData.isVip,
                bonusAmount: editData.bonusAmount ? parseFloat(editData.bonusAmount) : null,
                bonusThreshold: editData.bonusThreshold ? parseInt(editData.bonusThreshold) : null,
            });
            toast.success('Updated!', 'Supplier details saved.');
            setShowEditModal(false);
            fetchStats();
        } catch (error) {
            toast.error('Error', 'Could not update supplier.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDisable = async () => {
        if (!id || !stats) return;
        const newStatus = stats.supplier.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
        try {
            await apiClient.patch(`/admin/suppliers/${id}`, { status: newStatus });
            toast.success('Updated!', `Supplier ${newStatus.toLowerCase()}.`);
            fetchStats();
        } catch (error) {
            toast.error('Error', 'Could not update supplier status.');
        }
    };

    const gmailColumns: Column<Gmail>[] = [
        {
            key: 'email',
            header: 'Email',
            render: (row) => (
                <span style={{ fontFamily: 'monospace' }}>{row.email}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '120px',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'submittedAt',
            header: 'Submitted',
            width: '150px',
            render: (row) => formatters.relativeTime(row.submittedAt),
        },
    ];

    if (loading) {
        return (
            <div className="page">
                <div className="page-header">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        ← Back
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="page">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold mb-2">Supplier not found</h2>
                    <Button variant="secondary" onClick={() => navigate('/admin/suppliers')}>
                        Back to Suppliers
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                        ← Back
                    </Button>
                    <h1 className="page-title mt-2">{stats.supplier.name}</h1>
                    <p className="page-subtitle">{stats.supplier.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={stats.supplier.status} />
                        {stats.supplier.isVip && (
                            <span className="badge badge-verified">⭐ VIP</span>
                        )}
                        <span className="text-sm text-muted">Code: {stats.supplier.code}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowEditModal(true)}>
                        Edit
                    </Button>
                    <Button
                        variant={stats.supplier.status === 'DISABLED' ? 'primary' : 'danger'}
                        onClick={handleDisable}
                    >
                        {stats.supplier.status === 'DISABLED' ? 'Enable' : 'Disable'}
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard
                    icon="📤"
                    iconVariant="primary"
                    value={formatters.number(stats.totalSubmitted)}
                    label="Total Submitted"
                />
                <StatCard
                    icon="⏳"
                    iconVariant="warning"
                    value={formatters.number(stats.pendingCount)}
                    label="Pending"
                />
                <StatCard
                    icon="✅"
                    iconVariant="success"
                    value={formatters.number(stats.verifiedCount)}
                    label="Verified"
                />
                <StatCard
                    icon="❌"
                    iconVariant="danger"
                    value={formatters.number(stats.rejectedCount)}
                    label="Rejected"
                />
                <StatCard
                    icon="💵"
                    iconVariant="primary"
                    value={formatters.currency(stats.supplier.rate)}
                    label="Rate per Email"
                />
                <StatCard
                    icon="💰"
                    iconVariant="warning"
                    value={formatters.currency(stats.unpaidAmount)}
                    label="Unpaid Amount"
                />
            </div>

            {/* Tabs */}
            <div className="tabs mb-4">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        className={`tab ${activeTab === tab.value ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab.value);
                            setPage(1);
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab !== 'payments' ? (
                <DataTable
                    columns={gmailColumns}
                    data={gmails}
                    loading={gmailsLoading}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    emptyTitle={`No ${activeTab.toLowerCase()} emails`}
                />
            ) : (
                <Card>
                    <div className="text-center py-8 text-muted">
                        Payment snapshots and management available from the Payments page.
                    </div>
                </Card>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Supplier"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSaveEdit} loading={isSaving}>
                            Save Changes
                        </Button>
                    </>
                }
            >
                <Input
                    label="Rate (Rs. per email)"
                    type="number"
                    step="0.01"
                    value={editData.rate}
                    onChange={(e) => setEditData((prev) => ({ ...prev, rate: e.target.value }))}
                />
                <Input
                    label="Supplier Code"
                    value={editData.code}
                    onChange={(e) => setEditData((prev) => ({ ...prev, code: e.target.value }))}
                />

                {/* Bonus Settings Section */}
                <div className="mt-6 pt-4 border-t border-subtle">
                    <h4 className="font-semibold mb-4">🎁 Bonus Settings</h4>
                    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <Input
                            label="Bonus Amount (Rs.)"
                            type="number"
                            placeholder="e.g., 500"
                            value={editData.bonusAmount}
                            onChange={(e) => setEditData((prev) => ({ ...prev, bonusAmount: e.target.value }))}
                        />
                        <Input
                            label="Emails Required"
                            type="number"
                            placeholder="e.g., 100"
                            value={editData.bonusThreshold}
                            onChange={(e) => setEditData((prev) => ({ ...prev, bonusThreshold: e.target.value }))}
                        />
                    </div>
                    <p className="text-xs text-tertiary mt-2">
                        Leave blank to disable bonus for this supplier
                    </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input
                        type="checkbox"
                        checked={editData.isVip}
                        onChange={(e) => setEditData((prev) => ({ ...prev, isVip: e.target.checked }))}
                    />
                    <span>VIP Supplier</span>
                </label>
            </Modal>
        </div>
    );
};
