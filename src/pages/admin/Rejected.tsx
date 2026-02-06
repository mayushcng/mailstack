// =============================================================================
// Admin Rejected Page
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { DataTable } from '../../components/DataTable';
import { apiClient } from '../../api/client';
import { formatDate } from '../../utils/formatters';
import type { Gmail, PaginatedResponse, EmailType } from '../../api/types';

export const Rejected: React.FC = () => {
    const [gmails, setGmails] = useState<Gmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [emailTypeFilter, setEmailTypeFilter] = useState<EmailType | ''>('');

    const fetchGmails = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                status: 'REJECTED',
                page: String(page),
                limit: '10',
            });
            if (search) params.append('q', search);
            if (emailTypeFilter) params.append('emailType', emailTypeFilter);

            const result = await apiClient.get<PaginatedResponse<Gmail>>(
                `/admin/gmails?${params.toString()}`
            );
            setGmails(result.data);
            setTotalPages(result.totalPages);
            setTotal(result.total);
        } catch (error) {
            console.error('Failed to fetch gmails:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGmails();
    }, [page, search, emailTypeFilter]);

    const columns = [
        {
            key: 'email',
            header: 'Email',
            render: (gmail: Gmail) => (
                <span className="mono text-sm">{gmail.email}</span>
            ),
        },
        {
            key: 'emailType',
            header: 'Type',
            render: (gmail: Gmail) => <StatusBadge status={gmail.emailType} />,
        },
        {
            key: 'remark',
            header: 'Reason',
            render: (gmail: Gmail) => (
                <span className="text-danger text-sm">{gmail.remark || '-'}</span>
            ),
        },
        {
            key: 'supplierName',
            header: 'Supplier',
            render: (gmail: Gmail) => gmail.supplierName || '-',
        },
        {
            key: 'rejectedAt',
            header: 'Rejected On',
            render: (gmail: Gmail) => gmail.rejectedAt ? formatDate(gmail.rejectedAt) : '-',
        },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Rejected Accounts</h1>
                <p className="page-subtitle">{total} accounts rejected</p>
            </div>

            <Card padding="none">
                <div className="table-header">
                    <input
                        type="text"
                        className="form-input table-search"
                        placeholder="Search emails..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="table-actions">
                        <select
                            className="form-select"
                            value={emailTypeFilter}
                            onChange={(e) => setEmailTypeFilter(e.target.value as EmailType | '')}
                        >
                            <option value="">All Types</option>
                            <option value="gmail">Gmail</option>
                            <option value="outlook">Outlook</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    data={gmails}
                    columns={columns}
                    loading={loading}
                    emptyTitle="No rejected accounts"
                />

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
