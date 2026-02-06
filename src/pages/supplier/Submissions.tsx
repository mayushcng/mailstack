// =============================================================================
// My Submissions Page (Supplier Gmails List)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { apiClient } from '../../api/client';
import { formatters } from '../../utils/formatters';
import { toast } from '../../store/toastStore';
import type { Gmail, PaginatedResponse, GmailStatus } from '../../api/types';

const STATUS_TABS: { label: string; value: GmailStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'Rejected', value: 'REJECTED' },
];

export const Submissions: React.FC = () => {
    const [gmails, setGmails] = useState<Gmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<GmailStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchGmails = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '10');
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (searchQuery) params.set('q', searchQuery);

            const response = await apiClient.get<PaginatedResponse<Gmail>>(
                `/supplier/gmails?${params.toString()}`
            );

            setGmails(response.data);
            setTotalPages(response.totalPages);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to fetch gmails:', error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchQuery]);

    useEffect(() => {
        fetchGmails();
    }, [fetchGmails]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1);
    }, []);

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        toast.success('Copied!', email);
    };

    const columns: Column<Gmail>[] = [
        {
            key: 'email',
            header: 'Email',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span style={{ fontFamily: 'monospace' }}>{row.email}</span>
                    <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => handleCopyEmail(row.email)}
                        title="Copy email"
                    >
                        📋
                    </button>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '120px',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'remark',
            header: 'Remark',
            render: (row) => (
                <span className="text-sm text-muted">{row.remark || '-'}</span>
            ),
        },
        {
            key: 'submittedAt',
            header: 'Submitted',
            width: '150px',
            render: (row) => (
                <span className="text-sm text-muted">
                    {formatters.relativeTime(row.submittedAt)}
                </span>
            ),
        },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">My Submissions</h1>
                <p className="page-subtitle">View all your submitted Gmail accounts</p>
            </div>

            {/* Status Tabs */}
            <div className="tabs mb-4">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        className={`tab ${statusFilter === tab.value ? 'active' : ''}`}
                        onClick={() => {
                            setStatusFilter(tab.value);
                            setPage(1);
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={gmails}
                loading={loading}
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
                searchable
                searchPlaceholder="Search by email..."
                onSearch={handleSearch}
                emptyTitle="No emails found"
                emptyDescription={
                    statusFilter === 'all'
                        ? 'You haven\'t submitted any emails yet.'
                        : `No ${statusFilter.toLowerCase()} emails.`
                }
            />
        </div>
    );
};
