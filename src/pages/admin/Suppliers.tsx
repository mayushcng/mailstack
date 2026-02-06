// =============================================================================
// Admin Suppliers List
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { apiClient } from '../../api/client';
import { formatters } from '../../utils/formatters';
import { exportToCSV, formatDateForExport, type ExportColumn } from '../../utils/exportUtils';
import { toast } from '../../store/toastStore';
import type { Supplier, PaginatedResponse } from '../../api/types';

interface SupplierWithStats extends Supplier {
    verifiedCount: number;
    pendingCount: number;
    unpaidAmount: number;
}

export const Suppliers: React.FC = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '10');
            if (searchQuery) params.set('q', searchQuery);

            const response = await apiClient.get<PaginatedResponse<SupplierWithStats>>(
                `/admin/suppliers?${params.toString()}`
            );

            setSuppliers(response.data);
            setTotalPages(response.totalPages);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1);
    }, []);

    const handleRowClick = (supplier: SupplierWithStats) => {
        navigate(`/admin/suppliers/${supplier.id}`);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            // Fetch all suppliers for export
            const response = await apiClient.get<PaginatedResponse<SupplierWithStats>>(
                '/admin/suppliers?limit=10000'
            );

            const exportColumns: ExportColumn<SupplierWithStats>[] = [
                { header: 'Name', accessor: 'name' },
                { header: 'Email', accessor: 'email' },
                { header: 'Code', accessor: 'code' },
                { header: 'Status', accessor: 'status' },
                { header: 'Phone', accessor: 'phone' },
                { header: 'City', accessor: 'city' },
                { header: 'Country', accessor: 'country' },
                { header: 'Rate (Rs.)', accessor: 'rate' },
                { header: 'VIP', accessor: (row) => row.isVip ? 'Yes' : 'No' },
                { header: 'Verified Count', accessor: 'verifiedCount' },
                { header: 'Pending Count', accessor: 'pendingCount' },
                { header: 'Unpaid Amount (Rs.)', accessor: 'unpaidAmount' },
                { header: 'Registered At', accessor: (row) => formatDateForExport(row.createdAt) },
            ];

            exportToCSV(response.data, exportColumns, 'suppliers');
            toast.success('Export Complete', `Exported ${response.data.length} suppliers`);
        } catch (error) {
            toast.error('Export Failed', 'Failed to export suppliers');
        } finally {
            setExporting(false);
        }
    };

    const columns: Column<SupplierWithStats>[] = [
        {
            key: 'name',
            header: 'Supplier',
            render: (row) => (
                <div
                    className="cursor-pointer"
                    onClick={() => handleRowClick(row)}
                >
                    <div className="font-medium text-primary">{row.name}</div>
                    <div className="text-xs text-muted">{row.email}</div>
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            width: '100px',
            render: (row) => (
                <span className="font-mono text-sm">{row.code}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '100px',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'verifiedCount',
            header: 'Verified',
            width: '100px',
            render: (row) => (
                <span className="text-success font-medium">
                    {formatters.number(row.verifiedCount)}
                </span>
            ),
        },
        {
            key: 'pendingCount',
            header: 'Pending',
            width: '100px',
            render: (row) => (
                <span className="text-warning font-medium">
                    {formatters.number(row.pendingCount)}
                </span>
            ),
        },
        {
            key: 'unpaidAmount',
            header: 'Unpaid',
            width: '100px',
            render: (row) => (
                <span className="font-medium">
                    {formatters.currency(row.unpaidAmount)}
                </span>
            ),
        },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">Suppliers</h1>
                        <p className="page-subtitle">Manage all suppliers</p>
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
                data={suppliers}
                loading={loading}
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
                searchable
                searchPlaceholder="Search by name, email, or code..."
                onSearch={handleSearch}
                emptyTitle="No suppliers found"
                emptyDescription="Suppliers will appear here after registration."
            />
        </div>
    );
};
