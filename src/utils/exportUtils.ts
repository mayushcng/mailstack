// =============================================================================
// Export Utilities - CSV Export with proper headers and datetime
// =============================================================================

/**
 * Formats a date to a filename-safe string
 */
function formatDateForFilename(date: Date): string {
    return date.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
}

/**
 * Escapes a value for CSV format
 */
function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    const str = String(value);
    // If contains comma, newline, or quote, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Column definition for export
 */
export interface ExportColumn<T> {
    header: string;
    accessor: keyof T | ((row: T) => unknown);
}

/**
 * Exports data to CSV and downloads it
 */
export function exportToCSV<T>(
    data: T[],
    columns: ExportColumn<T>[],
    filePrefix: string
): void {
    // Create CSV header row
    const headers = columns.map(col => escapeCSV(col.header)).join(',');

    // Create CSV data rows
    const rows = data.map(row => {
        return columns.map(col => {
            const value = typeof col.accessor === 'function'
                ? col.accessor(row)
                : row[col.accessor];
            return escapeCSV(value);
        }).join(',');
    });

    // Combine into CSV content
    const csvContent = [headers, ...rows].join('\n');

    // Add BOM for Excel compatibility with UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = formatDateForFilename(new Date());
    link.setAttribute('href', url);
    link.setAttribute('download', `${filePrefix}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Formats a date for display in exports
 */
export function formatDateForExport(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
