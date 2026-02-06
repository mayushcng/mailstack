// =============================================================================
// Submit Batch Page - With Duplicate Detection & Quota Status
// =============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Input';
import { StatusBadge } from '../../components/StatusBadge';
import { apiClient } from '../../api/client';
import { toast } from '../../store/toastStore';
import type { EmailEntry, SubmitBatchResponse, EmailType, SystemSettings } from '../../api/types';

interface ParsedEntry extends EmailEntry {
    error?: string;
    isDuplicate?: boolean;
}

export const SubmitBatch: React.FC = () => {
    const [rawInput, setRawInput] = useState('');
    const [emailType, setEmailType] = useState<EmailType>('gmail');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<SubmitBatchResponse | null>(null);
    const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

    // Fetch system settings for quota display
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await apiClient.get<SystemSettings>('/supplier/system-settings');
                setSystemSettings(data);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();
    }, []);

    // Parse input into email entries with duplicate detection
    const parsedEntries = useMemo((): ParsedEntry[] => {
        if (!rawInput.trim()) return [];

        const lines = rawInput.split('\n').filter(line => line.trim());
        const entries: ParsedEntry[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const seenEmails = new Set<string>(); // Track duplicates within batch

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Format 1: email:password
            if (trimmed.includes(':')) {
                const colonIndex = trimmed.lastIndexOf(':');
                const emailPart = trimmed.substring(0, colonIndex);
                const password = trimmed.substring(colonIndex + 1);

                // Check if emailPart contains multiple emails (comma-separated)
                const emails = emailPart.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

                for (const email of emails) {
                    if (!emailRegex.test(email)) {
                        entries.push({
                            email,
                            password,
                            emailType,
                            error: 'Invalid email format',
                        });
                    } else if (!password) {
                        entries.push({
                            email,
                            password,
                            emailType,
                            error: 'Password missing',
                        });
                    } else if (seenEmails.has(email)) {
                        // Duplicate within batch
                        entries.push({
                            email,
                            password,
                            emailType,
                            error: 'Duplicate in batch',
                            isDuplicate: true,
                        });
                    } else {
                        seenEmails.add(email);
                        entries.push({
                            email,
                            password,
                            emailType,
                        });
                    }
                }
            } else {
                // No password provided
                entries.push({
                    email: trimmed,
                    password: '',
                    emailType,
                    error: 'Password missing (use email:password format)',
                });
            }
        }

        return entries;
    }, [rawInput, emailType]);

    const validEntries = parsedEntries.filter(e => !e.error);
    const invalidEntries = parsedEntries.filter(e => e.error);
    const duplicateCount = parsedEntries.filter(e => e.isDuplicate).length;

    // Check quota status
    const getQuotaInfo = () => {
        if (!systemSettings) return null;
        const quota = emailType === 'gmail' ? systemSettings.gmailQuota : systemSettings.outlookQuota;
        const submitted = emailType === 'gmail' ? systemSettings.gmailSubmitted : systemSettings.outlookSubmitted;
        if (quota === null) return { unlimited: true, remaining: Infinity };
        const remaining = Math.max(quota - submitted, 0);
        return { unlimited: false, remaining, quota, submitted };
    };

    const quotaInfo = getQuotaInfo();
    const isQuotaExceeded = !!(quotaInfo && !quotaInfo.unlimited && quotaInfo.remaining === 0);
    const willExceedQuota = !!(quotaInfo && !quotaInfo.unlimited && validEntries.length > quotaInfo.remaining);

    const handleSubmit = async () => {
        if (validEntries.length === 0) {
            toast.error('No valid entries', 'Please provide valid email:password pairs.');
            return;
        }

        if (isQuotaExceeded) {
            toast.error('Quota Reached', `${emailType === 'gmail' ? 'Gmail' : 'Outlook'} quota has been reached.`);
            return;
        }

        setIsSubmitting(true);
        setResult(null);

        try {
            const response = await apiClient.post<SubmitBatchResponse>('/supplier/submit', {
                entries: validEntries.map(({ email, password, emailType }) => ({
                    email,
                    password,
                    emailType,
                })),
            });

            setResult(response);

            if (response.acceptedNew > 0) {
                toast.success('Submitted!', `${response.acceptedNew} accounts added successfully.`);
                setRawInput('');
            } else if (response.duplicateRejected > 0) {
                toast.warning('Duplicates Found', `All ${response.duplicateRejected} emails were already in the system.`);
            }
        } catch (error) {
            toast.error('Failed', 'Could not submit batch. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClear = () => {
        setRawInput('');
        setResult(null);
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Submit Accounts</h1>
                <p className="page-subtitle">Submit email accounts for verification</p>
            </div>

            {/* Quota Warning */}
            {isQuotaExceeded && (
                <Card className="mb-6" style={{ background: 'var(--danger-muted)', border: 'none' }}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🚫</span>
                        <div>
                            <div className="font-semibold text-danger">Quota Reached</div>
                            <div className="text-sm">
                                {emailType === 'gmail' ? 'Gmail' : 'Outlook'} submission quota has been reached.
                                Please try the other email type or contact admin.
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Will Exceed Quota Warning */}
            {willExceedQuota && !isQuotaExceeded && quotaInfo && (
                <Card className="mb-6" style={{ background: 'var(--warning-muted)', border: 'none' }}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <div className="font-semibold">Partial Submission</div>
                            <div className="text-sm">
                                Only {quotaInfo.remaining} of {validEntries.length} entries can be submitted
                                (first-come, first-served basis).
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Input Section */}
                <Card>
                    <div className="card-header">
                        <h3 className="card-title">Enter Credentials</h3>
                        <div className="flex gap-2">
                            <button
                                className={`btn btn-sm ${emailType === 'gmail' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setEmailType('gmail')}
                            >
                                Gmail
                            </button>
                            <button
                                className={`btn btn-sm ${emailType === 'outlook' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setEmailType('outlook')}
                            >
                                Outlook
                            </button>
                        </div>
                    </div>

                    {/* Quota Status */}
                    {quotaInfo && (
                        <div className="mb-4 p-3 rounded-lg bg-surface-2 flex justify-between items-center">
                            <span className="text-sm">
                                {emailType === 'gmail' ? '📧 Gmail' : '📬 Outlook'} Status:
                            </span>
                            {quotaInfo.unlimited ? (
                                <span className="text-success font-medium text-sm">✓ Unlimited</span>
                            ) : (
                                <span className={`font-medium text-sm ${quotaInfo.remaining === 0 ? 'text-danger' : ''}`}>
                                    {quotaInfo.remaining} / {quotaInfo.quota} remaining
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mb-4">
                        <Textarea
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            placeholder={`Enter accounts in any of these formats:

email@${emailType === 'gmail' ? 'gmail.com' : 'outlook.com'}:password123
user1@${emailType === 'gmail' ? 'gmail.com' : 'outlook.com'},user2@${emailType === 'gmail' ? 'gmail.com' : 'outlook.com'}:sharedpass

One entry per line. Use : to separate email(s) from password.
Multiple emails can share a password using commas.`}
                            style={{ minHeight: 280, fontFamily: 'monospace', fontSize: 13 }}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            disabled={validEntries.length === 0 || isQuotaExceeded}
                        >
                            Submit {validEntries.length > 0 ? `(${validEntries.length})` : ''}
                        </Button>
                        <Button variant="secondary" onClick={handleClear}>
                            Clear
                        </Button>
                    </div>
                </Card>

                {/* Preview Section */}
                <Card>
                    <div className="card-header">
                        <h3 className="card-title">Preview</h3>
                        <div className="flex gap-4 text-sm">
                            <span className="text-success">✓ {validEntries.length} valid</span>
                            {invalidEntries.length > 0 && (
                                <span className="text-danger">✕ {invalidEntries.length} invalid</span>
                            )}
                            {duplicateCount > 0 && (
                                <span className="text-warning">⚠ {duplicateCount} duplicates</span>
                            )}
                        </div>
                    </div>

                    {parsedEntries.length === 0 ? (
                        <div className="empty-state" style={{ padding: '48px 24px' }}>
                            <div className="empty-state-icon">📧</div>
                            <div className="empty-state-title">No entries yet</div>
                            <div className="empty-state-description">
                                Start typing email:password pairs to see a preview
                            </div>
                        </div>
                    ) : (
                        <div className="table-wrapper" style={{ maxHeight: 360, overflowY: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Password</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedEntries.slice(0, 50).map((entry, idx) => (
                                        <tr key={idx} style={{ opacity: entry.error ? 0.6 : 1 }}>
                                            <td>
                                                <span className="mono text-sm">{entry.email}</span>
                                            </td>
                                            <td>
                                                <span className="mono text-sm">
                                                    {entry.password ? '••••••••' : '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <StatusBadge status={entry.emailType} />
                                            </td>
                                            <td>
                                                {entry.error ? (
                                                    <span className={`text-xs ${entry.isDuplicate ? 'text-warning' : 'text-danger'}`}>
                                                        {entry.error}
                                                    </span>
                                                ) : (
                                                    <span className="text-success text-xs">Ready</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parsedEntries.length > 50 && (
                                <div className="text-center text-tertiary text-sm py-3">
                                    Showing first 50 of {parsedEntries.length} entries
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>

            {/* Result Section */}
            {result && (
                <Card className="mt-6">
                    <h3 className="card-title mb-4">Submission Result</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="stat-card">
                            <div className="stat-card-icon success">✓</div>
                            <div className="stat-card-value">{result.acceptedNew}</div>
                            <div className="stat-card-label">Accepted</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-icon warning">⚠</div>
                            <div className="stat-card-value">{result.duplicateRejected}</div>
                            <div className="stat-card-label">Duplicates</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-icon danger">✕</div>
                            <div className="stat-card-value">{result.invalidRejected}</div>
                            <div className="stat-card-label">Invalid</div>
                        </div>
                    </div>

                    {/* Show duplicate emails if any */}
                    {result.duplicates && result.duplicates.length > 0 && (
                        <div className="mt-4 p-4 bg-surface-2 rounded-lg">
                            <div className="font-semibold text-sm mb-2 text-warning">
                                ⚠️ Duplicate emails (already in system):
                            </div>
                            <div className="text-xs font-mono text-tertiary">
                                {result.duplicates.slice(0, 5).join(', ')}
                                {result.duplicates.length > 5 && ` +${result.duplicates.length - 5} more`}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Format Guide */}
            <Card className="mt-6">
                <h3 className="card-title mb-4">Input Format Guide</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Single Entry</h4>
                        <code className="mono text-xs text-secondary">
                            email@gmail.com:password123
                        </code>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Shared Password</h4>
                        <code className="mono text-xs text-secondary">
                            a@gmail.com,b@gmail.com:samepass
                        </code>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Multiple Lines</h4>
                        <code className="mono text-xs text-secondary">
                            user1@gmail.com:pass1<br />
                            user2@gmail.com:pass2
                        </code>
                    </div>
                </div>
            </Card>
        </div>
    );
};
