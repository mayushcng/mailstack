// =============================================================================
// Rejected List Page (Admin)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { apiClient } from '../../api/client';
import { formatters } from '../../utils/formatters';
import type { Gmail, PaginatedResponse } from '../../api/types';

export const RejectedList: React.FC = () => {
    const [gmails, setGmails] = useState<Gmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchGmails = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '10');
            params.set('status', 'REJECTED');
            if (searchQuery) params.set('q', searchQuery);

            const response = await apiClient.get<PaginatedResponse<Gmail>>(
                `/admin/gmails?${params.toString()}`
            );

            setGmails(response.data);
            setTotalPages(response.totalPages);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to fetch gmails:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        fetchGmails();
    }, [fetchGmails]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1);
    }, []);

    const columns: Column<Gmail>[] = [
        {
            key: 'email',
            header: 'Email',
            render: (row) => (
                <span style={{ fontFamily: 'monospace' }}>{row.email}</span>
            ),
        },
        {
            key: 'supplierName',
            header: 'Supplier',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.supplierName}</div>
                    <div className="text-xs text-muted">{row.supplierCode}</div>
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
            header: 'Reason',
            render: (row) => (
                <span className="text-sm text-muted">{row.remark || '-'}</span>
            ),
        },
        {
            key: 'rejectedAt',
            header: 'Rejected At',
            width: '150px',
            render: (row) => (
                <span className="text-sm text-muted">
                    {row.rejectedAt ? formatters.date(row.rejectedAt) : '-'}
                </span>
            ),
        },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Rejected Emails</h1>
                <p className="page-subtitle">All rejected Gmail accounts</p>
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
                searchPlaceholder="Search by email or supplier..."
                onSearch={handleSearch}
                emptyTitle="No rejected emails"
                emptyDescription="Rejected emails will appear here."
            />
        </div>
    );
};
