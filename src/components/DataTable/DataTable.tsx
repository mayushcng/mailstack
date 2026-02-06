// =============================================================================
// DataTable Component
// =============================================================================

import React, { useState, useCallback } from 'react';
import { Input } from '../Input';
import { EmptyState } from '../EmptyState';
import { SkeletonRow } from '../Skeleton';

export interface Column<T> {
    key: string;
    header: string;
    width?: string;
    render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: { label: string; onClick: () => void };

    // Pagination
    page?: number;
    totalPages?: number;
    total?: number;
    onPageChange?: (page: number) => void;

    // Search
    searchable?: boolean;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;

    // Selection
    selectable?: boolean;
    selectedIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
    getRowId?: (row: T) => string;

    // Actions
    actions?: React.ReactNode;
}

export function DataTable<T>({
    columns,
    data,
    loading = false,
    emptyTitle = 'No data',
    emptyDescription,
    emptyAction,
    page = 1,
    totalPages = 1,
    total,
    onPageChange,
    searchable = false,
    searchPlaceholder = 'Search...',
    onSearch,
    selectable = false,
    selectedIds = new Set(),
    onSelectionChange,
    getRowId = (row: any) => row.id,
    actions,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setSearchQuery(value);
            onSearch?.(value);
        },
        [onSearch]
    );

    const handleSelectAll = useCallback(() => {
        if (!onSelectionChange) return;

        const allIds = data.map(getRowId);
        const allSelected = allIds.every((id) => selectedIds.has(id));

        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(allIds));
        }
    }, [data, getRowId, selectedIds, onSelectionChange]);

    const handleSelectRow = useCallback(
        (id: string) => {
            if (!onSelectionChange) return;

            const newSelection = new Set(selectedIds);
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                newSelection.add(id);
            }
            onSelectionChange(newSelection);
        },
        [selectedIds, onSelectionChange]
    );

    const allSelected = data.length > 0 && data.every((row) => selectedIds.has(getRowId(row)));
    const someSelected = selectedIds.size > 0 && !allSelected;

    return (
        <div className="table-container">
            {(searchable || actions) && (
                <div className="table-header">
                    {searchable && (
                        <div className="table-search">
                            <Input
                                type="search"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                    )}
                    {actions && <div className="table-actions">{actions}</div>}
                </div>
            )}

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            {selectable && (
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        className="row-checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected;
                                        }}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th key={col.key} style={{ width: col.width }}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonRow key={i} columns={columns.length + (selectable ? 1 : 0)} />
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                                    <EmptyState
                                        title={emptyTitle}
                                        description={emptyDescription}
                                        action={emptyAction}
                                    />
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => {
                                const id = getRowId(row);
                                const isSelected = selectedIds.has(id);

                                return (
                                    <tr key={id} style={{ backgroundColor: isSelected ? 'var(--color-primary-light)' : undefined }}>
                                        {selectable && (
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="row-checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(id)}
                                                />
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td key={col.key}>
                                                {col.render
                                                    ? col.render(row, idx)
                                                    : (row as any)[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="table-footer">
                    <span>
                        {total !== undefined && `${total} total • `}
                        Page {page} of {totalPages}
                    </span>
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            disabled={page <= 1}
                            onClick={() => onPageChange?.(page - 1)}
                        >
                            ‹
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            // Show pages around current page
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                                    onClick={() => onPageChange?.(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            className="pagination-btn"
                            disabled={page >= totalPages}
                            onClick={() => onPageChange?.(page + 1)}
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
