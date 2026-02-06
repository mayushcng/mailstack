// =============================================================================
// Admin Registrations Page - Manual approval for new suppliers
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { apiClient } from '../../api/client';
import { toast } from '../../store/toastStore';
import { formatDateTime } from '../../utils/formatters';
import type { Supplier, PaginatedResponse } from '../../api/types';

type RegistrationStatus = 'PENDING' | 'ACTIVE' | 'DISABLED';

export const Registrations: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState<RegistrationStatus>('PENDING');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchSuppliers();
    }, [page, activeTab]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<PaginatedResponse<Supplier>>(
                `/admin/suppliers?status=${activeTab}&page=${page}&limit=10`
            );
            setSuppliers(response.data);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            await apiClient.patch(`/admin/suppliers/${id}`, { status: 'ACTIVE' });
            toast.success('Approved!', 'Supplier registration has been approved.');
            fetchSuppliers();
        } catch (error) {
            toast.error('Error', 'Failed to approve registration.');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        setProcessing(id);
        try {
            await apiClient.patch(`/admin/suppliers/${id}`, { status: 'DISABLED' });
            toast.success('Rejected', 'Supplier registration has been rejected.');
            fetchSuppliers();
        } catch (error) {
            toast.error('Error', 'Failed to reject registration.');
        } finally {
            setProcessing(null);
        }
    };

    const viewDetails = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setShowDetailModal(true);
    };

    const columns: Column<Supplier>[] = [
        {
            key: 'name',
            header: 'Supplier',
            render: (supplier) => (
                <div>
                    <div className="font-medium">{supplier.name}</div>
                    <div className="text-sm text-tertiary">{supplier.email}</div>
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            render: (supplier) => (
                <span className="font-mono text-sm">{supplier.code}</span>
            ),
        },
        {
            key: 'phone',
            header: 'Phone',
            render: (supplier) => <span>{supplier.phone || '-'}</span>,
        },
        {
            key: 'city',
            header: 'Location',
            render: (supplier) => (
                <span>{supplier.city || '-'}{supplier.country ? `, ${supplier.country}` : ''}</span>
            ),
        },
        {
            key: 'createdAt',
            header: 'Registered',
            render: (supplier) => <span>{formatDateTime(supplier.createdAt)}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (supplier) => (
                <StatusBadge
                    status={supplier.status}
                />
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (supplier) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDetails(supplier)}
                    >
                        View
                    </Button>
                    {supplier.status === 'PENDING' && (
                        <>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(supplier.id)}
                                loading={processing === supplier.id}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(supplier.id)}
                                loading={processing === supplier.id}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    {supplier.status === 'DISABLED' && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleApprove(supplier.id)}
                            loading={processing === supplier.id}
                        >
                            Re-enable
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const tabs: { key: RegistrationStatus; label: string }[] = [
        { key: 'PENDING', label: 'Pending Approval' },
        { key: 'ACTIVE', label: 'Approved' },
        { key: 'DISABLED', label: 'Rejected/Disabled' },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Supplier Registrations</h1>
                <p className="page-subtitle">Manually approve or reject new supplier registrations</p>
            </div>

            {/* Tabs */}
            <div className="tabs mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab.key);
                            setPage(1);
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Info Card for Pending */}
            {activeTab === 'PENDING' && (
                <Card className="mb-6" style={{ background: 'var(--warning-muted)', border: 'none' }}>
                    <div className="flex gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <h4 className="font-semibold mb-1">Manual Approval Required</h4>
                            <p className="text-sm text-secondary">
                                New supplier registrations require manual approval before they can access the system.
                                Review their details carefully before approving.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Table */}
            <Card>
                <DataTable
                    columns={columns}
                    data={suppliers}
                    loading={loading}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    emptyTitle={
                        activeTab === 'PENDING'
                            ? 'No pending registrations'
                            : `No ${activeTab.toLowerCase()} suppliers`
                    }
                />
            </Card>

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Supplier Details"
            >
                {selectedSupplier && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-tertiary">Name</div>
                                <div className="font-medium">{selectedSupplier.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-tertiary">Email</div>
                                <div className="font-medium">{selectedSupplier.email}</div>
                            </div>
                            <div>
                                <div className="text-sm text-tertiary">Phone</div>
                                <div className="font-medium">{selectedSupplier.phone || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-tertiary">Location</div>
                                <div className="font-medium">
                                    {selectedSupplier.city || '-'}
                                    {selectedSupplier.country ? `, ${selectedSupplier.country}` : ''}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-tertiary">Occupation</div>
                                <div className="font-medium">{selectedSupplier.occupation || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-tertiary">Date of Birth</div>
                                <div className="font-medium">{selectedSupplier.dateOfBirth || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-tertiary">Registered</div>
                                <div className="font-medium">{formatDateTime(selectedSupplier.createdAt)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-tertiary">Status</div>
                                <StatusBadge status={selectedSupplier.status} />
                            </div>
                        </div>

                        {selectedSupplier.status === 'PENDING' && (
                            <div className="flex gap-3 pt-4 border-t border-subtle">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        handleApprove(selectedSupplier.id);
                                        setShowDetailModal(false);
                                    }}
                                >
                                    Approve Registration
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        handleReject(selectedSupplier.id);
                                        setShowDetailModal(false);
                                    }}
                                >
                                    Reject
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
