// =============================================================================
// Admin Dashboard Page
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Icon, Icons } from '../../components/Icon';
import { apiClient } from '../../api/client';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import type { AdminDashboard as DashboardType } from '../../api/types';

export const Dashboard: React.FC = () => {
    const [dashboard, setDashboard] = useState<DashboardType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await apiClient.get<DashboardType>('/admin/dashboard');
                setDashboard(data);
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="page">
                <div className="page-header">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text mt-2" style={{ width: 200 }} />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton skeleton-card" />
                    ))}
                </div>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Icon name={Icons.warning} size="2xl" />
                    </div>
                    <div className="empty-state-title">Failed to load dashboard</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Admin control center</p>
            </div>

            {/* Primary Stats - Verification */}
            <div className="dashboard-grid dashboard-grid-4 page-section">
                <StatCard
                    icon={<Icon name={Icons.pending} />}
                    iconColor="pending"
                    value={formatNumber(dashboard.pendingGmailsCount)}
                    label="Pending Review"
                />
                <StatCard
                    icon={<Icon name={Icons.verified} />}
                    iconColor="success"
                    value={formatNumber(dashboard.verifiedToday)}
                    label="Verified Today"
                />
                <StatCard
                    icon={<Icon name={Icons.rejected} />}
                    iconColor="danger"
                    value={formatNumber(dashboard.rejectedToday)}
                    label="Rejected Today"
                />
                <StatCard
                    icon={<Icon name={Icons.userPlus} />}
                    iconColor="primary"
                    value={formatNumber(dashboard.newSuppliersToday)}
                    label="New Suppliers Today"
                />
            </div>

            {/* Financial Overview */}
            <Card className="mb-6">
                <div className="card-header">
                    <h3 className="card-title">
                        <Icon name={Icons.money} className="icon-mr" style={{ color: 'var(--success-soft)' }} />
                        Financial Overview
                    </h3>
                    <Link to="/admin/payments">
                        <Button variant="ghost" size="sm">View All Payments</Button>
                    </Link>
                </div>

                <div className="dashboard-grid dashboard-grid-3">
                    <div className="stat-card">
                        <div className="stat-card-icon warning">
                            <Icon name="money-bill-wave" />
                        </div>
                        <div className="stat-card-value tabular-nums">
                            {formatCurrency(dashboard.totalRoughPayout)}
                        </div>
                        <div className="stat-card-label">Total Rough Payout</div>
                        <div className="text-xs text-tertiary mt-1">Estimated pending amount</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-icon pending">
                            <Icon name={Icons.invoice} />
                        </div>
                        <div className="stat-card-value tabular-nums">
                            {formatCurrency(dashboard.totalRequestedPayout)}
                        </div>
                        <div className="stat-card-label">Total Requested</div>
                        <div className="text-xs text-tertiary mt-1">Active payout requests</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-icon danger">
                            <Icon name={Icons.warning} />
                        </div>
                        <div className="stat-card-value tabular-nums">
                            {formatCurrency(dashboard.totalUnpaidAmount)}
                        </div>
                        <div className="stat-card-label">Total Unpaid</div>
                        <div className="text-xs text-tertiary mt-1">Payments not yet released</div>
                    </div>
                </div>
            </Card>

            {/* Quick Actions */}
            <div className="dashboard-grid dashboard-grid-3 page-section">
                <Link to="/admin/queue">
                    <Card className="quick-action-card">
                        <div className="quick-action-icon">
                            <Icon name={Icons.clipboard} size="2xl" />
                        </div>
                        <div className="font-semibold mb-1">Review Queue</div>
                        <div className="text-sm text-tertiary mb-3">
                            {dashboard.pendingGmailsCount} accounts waiting
                        </div>
                        <Button variant="primary" className="w-full">Start Reviewing</Button>
                    </Card>
                </Link>

                <Link to="/admin/payout-requests">
                    <Card className="quick-action-card">
                        <div className="quick-action-icon">
                            <Icon name={Icons.creditCard} size="2xl" />
                        </div>
                        <div className="font-semibold mb-1">Payout Requests</div>
                        <div className="text-sm text-tertiary mb-3">
                            Process supplier payouts
                        </div>
                        <Button variant="secondary" className="w-full">View Requests</Button>
                    </Card>
                </Link>

                <Link to="/admin/suppliers">
                    <Card className="quick-action-card">
                        <div className="quick-action-icon">
                            <Icon name={Icons.users} size="2xl" />
                        </div>
                        <div className="font-semibold mb-1">Manage Suppliers</div>
                        <div className="text-sm text-tertiary mb-3">
                            View and edit suppliers
                        </div>
                        <Button variant="secondary" className="w-full">View Suppliers</Button>
                    </Card>
                </Link>
            </div>

            {/* System Status */}
            <Card className="mt-6 system-status-card" style={{ background: 'var(--success-muted)', border: 'none' }}>
                <div className="flex items-center gap-4">
                    <span className="status-indicator online">
                        <Icon name={Icons.circle} style={{ color: 'var(--success)' }} />
                    </span>
                    <div>
                        <div className="font-semibold" style={{ color: 'var(--success-soft)' }}>System Operational</div>
                        <div className="text-sm text-secondary">
                            All services running normally. Last updated: Just now
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
