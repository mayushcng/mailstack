// =============================================================================
// Verified List Page (Admin)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { apiClient } from '../../api/client';
import { formatters } from '../../utils/formatters';
import { exportToCSV, formatDateForExport, type ExportColumn } from '../../utils/exportUtils';
import { toast } from '../../store/toastStore';
import type { Gmail, PaginatedResponse } from '../../api/types';

export const VerifiedList: React.FC = () => {
    const [gmails, setGmails] = useState<Gmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
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
            params.set('status', 'VERIFIED');
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

    const handleExport = async () => {
        setExporting(true);
        try {
            // Fetch all verified emails for export
            const response = await apiClient.get<PaginatedResponse<Gmail>>(
                '/admin/gmails?status=VERIFIED&limit=10000'
            );

            const exportColumns: ExportColumn<Gmail>[] = [
                { header: 'Email', accessor: 'email' },
                { header: 'Password', accessor: 'password' },
                { header: 'Type', accessor: 'emailType' },
                { header: 'Supplier Name', accessor: 'supplierName' },
                { header: 'Supplier Code', accessor: 'supplierCode' },
                { header: 'Status', accessor: 'status' },
                { header: 'Submitted At', accessor: (row) => formatDateForExport(row.submittedAt) },
                { header: 'Verified At', accessor: (row) => formatDateForExport(row.verifiedAt) },
            ];

            exportToCSV(response.data, exportColumns, 'verified_emails');
            toast.success('Export Complete', `Exported ${response.data.length} verified emails`);
        } catch (error) {
            toast.error('Export Failed', 'Failed to export verified emails');
        } finally {
            setExporting(false);
        }
    };

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
            key: 'verifiedAt',
            header: 'Verified At',
            width: '150px',
            render: (row) => (
                <span className="text-sm text-muted">
                    {row.verifiedAt ? formatters.date(row.verifiedAt) : '-'}
                </span>
            ),
        },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">Verified Emails</h1>
                        <p className="page-subtitle">All verified Gmail accounts</p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={handleExport}
                        loading={exporting}
                    >
                        📥 Export to CSV
                    </Button>
                </div>
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
                emptyTitle="No verified emails"
                emptyDescription="Verified emails will appear here."
            />
        </div>
    );
};
