// =============================================================================
// Supplier Dashboard Page - With Bonus & Quota Display
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Leaderboard } from '../../components/Leaderboard';
import { Icon, Icons } from '../../components/Icon';
import { apiClient } from '../../api/client';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import type { SupplierDashboard as DashboardType, LeaderboardEntry, SystemSettings } from '../../api/types';

export const Dashboard: React.FC = () => {
    const [dashboard, setDashboard] = useState<DashboardType | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashData, leaderData, settingsData] = await Promise.all([
                    apiClient.get<DashboardType>('/supplier/dashboard'),
                    apiClient.get<LeaderboardEntry[]>('/supplier/leaderboard'),
                    apiClient.get<SystemSettings>('/supplier/system-settings'),
                ]);
                setDashboard(dashData);
                setLeaderboard(leaderData);
                setSystemSettings(settingsData);
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate bonus progress from tiers
    const getBonusProgress = () => {
        if (!systemSettings?.bonusTiers?.length || !dashboard) return null;
        const submitted = dashboard.totalSubmitted || 0;
        // Find the next tier that hasn't been reached yet
        const sortedTiers = [...systemSettings.bonusTiers].sort((a, b) => a.emailsRequired - b.emailsRequired);
        const nextTier = sortedTiers.find(tier => submitted < tier.emailsRequired);
        if (!nextTier) return null; // All tiers completed
        const remaining = Math.max(nextTier.emailsRequired - submitted, 0);
        const prevTier = sortedTiers.filter(t => t.emailsRequired < nextTier.emailsRequired).pop();
        const prevCount = prevTier?.emailsRequired || 0;
        const rangeTotal = nextTier.emailsRequired - prevCount;
        const rangeProgress = submitted - prevCount;
        const progress = Math.min((rangeProgress / rangeTotal) * 100, 100);
        return {
            remaining,
            progress,
            amount: nextTier.bonusAmount,
            threshold: nextTier.emailsRequired,
            submitted,
            rewardType: nextTier.rewardType,
            rewardName: nextTier.rewardName,
            rewardDuration: nextTier.rewardDuration
        };
    };

    const bonusInfo = getBonusProgress();

    // Calculate quota status
    const getQuotaStatus = (type: 'gmail' | 'outlook') => {
        if (!systemSettings) return null;
        const quota = type === 'gmail' ? systemSettings.gmailQuota : systemSettings.outlookQuota;
        const submitted = type === 'gmail' ? systemSettings.gmailSubmitted : systemSettings.outlookSubmitted;
        if (quota === null) return { unlimited: true, submitted, remaining: null };
        const remaining = Math.max(quota - submitted, 0);
        const progress = Math.min((submitted / quota) * 100, 100);
        return { unlimited: false, submitted, remaining, quota, progress };
    };

    // Get reward badge color based on type
    const getRewardColor = (type?: string) => {
        switch (type) {
            case 'netflix': return '#e50914';
            case 'prime': return '#00a8e1';
            case 'spotify': return '#1db954';
            default: return 'var(--success)';
        }
    };

    // Get reward icon based on type
    const getRewardIcon = (type?: string) => {
        switch (type) {
            case 'netflix': return 'film';
            case 'prime': return 'tv';
            case 'spotify': return 'music';
            default: return 'coins';
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="page-header">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text mt-2" style={{ width: 200 }} />
                </div>
                <div className="dashboard-grid dashboard-grid-4 page-section">
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
                    <div className="empty-state-title">Something went wrong</div>
                </div>
            </div>
        );
    }

    const gmailQuota = getQuotaStatus('gmail');
    const outlookQuota = getQuotaStatus('outlook');

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Your submission overview and earnings</p>
            </div>

            {/* Bonus Motivation Card */}
            {bonusInfo && bonusInfo.remaining > 0 && (
                <Card className="mb-6 bonus-card" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)', border: 'none' }}>
                    <div className="flex items-center gap-4">
                        <span className="bonus-icon">
                            <Icon name={Icons.gift} size="2xl" style={{ color: 'white' }} />
                        </span>
                        <div className="flex-1">
                            <div className="text-white font-bold text-lg mb-1">
                                Submit {bonusInfo.remaining} more emails to earn Rs. {bonusInfo.amount} bonus!
                                {bonusInfo.rewardType && bonusInfo.rewardType !== 'money' && (
                                    <span className="reward-badge" style={{
                                        background: getRewardColor(bonusInfo.rewardType),
                                        marginLeft: '8px',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        <Icon name={getRewardIcon(bonusInfo.rewardType)} size="xs" style={{ marginRight: '4px' }} />
                                        + {bonusInfo.rewardName || bonusInfo.rewardType} {bonusInfo.rewardDuration}
                                    </span>
                                )}
                            </div>
                            <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        width: `${bonusInfo.progress}%`,
                                        background: 'white'
                                    }}
                                />
                            </div>
                            <div className="text-white/80 text-sm mt-2">
                                {bonusInfo.submitted} / {bonusInfo.threshold} emails submitted
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Quota Status Cards */}
            {systemSettings && (
                <div className="dashboard-grid dashboard-grid-2 page-section">
                    <Card className="card-compact">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="quota-icon gmail">
                                <Icon name={Icons.gmail} />
                            </span>
                            <span className="font-semibold">Gmail Quota</span>
                        </div>
                        {gmailQuota?.unlimited ? (
                            <div className="text-success font-medium">
                                <Icon name={Icons.verified} className="icon-mr" size="sm" />
                                Unlimited submissions available
                            </div>
                        ) : gmailQuota && (
                            <>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>{gmailQuota.submitted} submitted</span>
                                    <span className={gmailQuota.remaining === 0 ? 'text-danger font-bold' : ''}>
                                        {gmailQuota.remaining} remaining
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${gmailQuota.progress || 0}%`,
                                            background: (gmailQuota.progress || 0) >= 90 ? 'var(--danger)' : 'var(--accent)'
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </Card>
                    <Card className="card-compact">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="quota-icon outlook">
                                <Icon name={Icons.outlook} />
                            </span>
                            <span className="font-semibold">Outlook Quota</span>
                        </div>
                        {outlookQuota?.unlimited ? (
                            <div className="text-success font-medium">
                                <Icon name={Icons.verified} className="icon-mr" size="sm" />
                                Unlimited submissions available
                            </div>
                        ) : outlookQuota && (
                            <>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>{outlookQuota.submitted} submitted</span>
                                    <span className={outlookQuota.remaining === 0 ? 'text-danger font-bold' : ''}>
                                        {outlookQuota.remaining} remaining
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${outlookQuota.progress || 0}%`,
                                            background: (outlookQuota.progress || 0) >= 90 ? 'var(--danger)' : 'var(--accent)'
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            )}

            {/* Stats Grid */}
            <div className="dashboard-grid dashboard-grid-4 page-section">
                <StatCard
                    icon={<Icon name={Icons.upload} />}
                    iconColor="primary"
                    value={dashboard.totalSubmitted}
                    label="Total Submitted"
                />
                <StatCard
                    icon={<Icon name={Icons.pending} />}
                    iconColor="warning"
                    value={dashboard.pendingCount}
                    label="Pending Review"
                />
                <StatCard
                    icon={<Icon name={Icons.verified} />}
                    iconColor="success"
                    value={dashboard.verifiedCount}
                    label="Verified"
                />
                <StatCard
                    icon={<Icon name={Icons.rejected} />}
                    iconColor="danger"
                    value={dashboard.rejectedCount}
                    label="Rejected"
                />
            </div>

            {/* Earnings & Leaderboard */}
            <div className="dashboard-grid dashboard-grid-2-1 page-section">
                {/* Earnings Section */}
                <Card>
                    <div className="card-header">
                        <h3 className="card-title">
                            <Icon name={Icons.money} className="icon-mr" style={{ color: 'var(--success-soft)' }} />
                            Earnings
                        </h3>
                        <Link to="/supplier/payments">
                            <Button variant="ghost" size="sm">View All</Button>
                        </Link>
                    </div>

                    <div className="dashboard-grid dashboard-grid-2 page-section">
                        <div className="stat-card">
                            <div className="stat-card-label">Estimated Earnings</div>
                            <div className="stat-card-value text-success">
                                {formatCurrency(dashboard.estimatedEarnings)}
                            </div>
                            <div className="text-xs text-tertiary">Based on verified accounts</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Available for Payout</div>
                            <div className="stat-card-value">
                                {formatCurrency(dashboard.availableForPayout)}
                            </div>
                            <div className="text-xs text-tertiary">Min Rs. 300 to request</div>
                        </div>
                    </div>

                    <Link to="/supplier/payments">
                        <Button
                            variant="primary"
                            className="w-full"
                            disabled={dashboard.availableForPayout < 300}
                        >
                            {dashboard.availableForPayout >= 300
                                ? 'Request Payout'
                                : 'Need Rs. 300 minimum to request payout'}
                        </Button>
                    </Link>
                </Card>

                {/* Leaderboard */}
                <Leaderboard entries={leaderboard} loading={loading} />
            </div>

            {/* Recent Activity */}
            <Card className="mt-6">
                <div className="card-header">
                    <h3 className="card-title">
                        <Icon name={Icons.clipboard} className="icon-mr" />
                        Recent Activity
                    </h3>
                </div>

                {dashboard.recentActivity.length === 0 ? (
                    <div className="empty-state p-8">
                        <div className="empty-state-title">No recent activity</div>
                        <div className="empty-state-description">Start submitting accounts to see your activity here</div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {dashboard.recentActivity.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center justify-between py-3 border-b"
                                style={{ borderColor: 'var(--border-subtle)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="activity-icon">
                                        {activity.type === 'batch_submitted' && <Icon name={Icons.upload} style={{ color: 'var(--accent-soft)' }} />}
                                        {activity.type === 'gmail_verified' && <Icon name={Icons.verified} style={{ color: 'var(--success-soft)' }} />}
                                        {activity.type === 'gmail_rejected' && <Icon name={Icons.rejected} style={{ color: 'var(--danger-soft)' }} />}
                                        {activity.type === 'payment_paid' && <Icon name={Icons.money} style={{ color: 'var(--success-soft)' }} />}
                                        {activity.type === 'payout_requested' && <Icon name={Icons.invoice} style={{ color: 'var(--pending-soft)' }} />}
                                    </span>
                                    <span className="text-sm">{activity.message}</span>
                                </div>
                                <span className="text-xs text-tertiary">
                                    {formatRelativeTime(activity.timestamp)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Telegram Button - Enhanced Design */}
            {systemSettings?.telegramChannelUrl && (
                <a
                    href={systemSettings.telegramChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 block telegram-cta"
                >
                    <Card
                        className="telegram-card"
                        style={{
                            textAlign: 'center',
                            padding: 'var(--space-5)',
                        }}
                    >
                        <div className="flex items-center justify-center gap-3">
                            <span className="telegram-icon">
                                <Icon name={Icons.telegram} prefix="fab" size="xl" />
                            </span>
                            <div className="text-white font-semibold text-lg">Join our Telegram Channel</div>
                        </div>
                        <div className="text-white/80 text-sm mt-2">Get updates, tips, and support</div>
                    </Card>
                </a>
            )}

            {/* Quick Actions */}
            <div className="dashboard-grid dashboard-grid-3 page-section">
                <Link to="/supplier/submit">
                    <Card className="quick-action-card">
                        <div className="quick-action-icon">
                            <Icon name={Icons.email} size="xl" />
                        </div>
                        <div className="font-semibold">Submit Accounts</div>
                        <div className="text-sm text-tertiary">Add new Gmail or Outlook</div>
                    </Card>
                </Link>
                <Link to="/supplier/submissions">
                    <Card className="quick-action-card">
                        <div className="quick-action-icon">
                            <Icon name={Icons.clipboard} size="xl" />
                        </div>
                        <div className="font-semibold">My Submissions</div>
                        <div className="text-sm text-tertiary">Track your accounts</div>
                    </Card>
                </Link>
                <Link to="/supplier/payout-settings">
                    <Card className="quick-action-card">
                        <div className="quick-action-icon">
                            <Icon name={Icons.settings} size="xl" />
                        </div>
                        <div className="font-semibold">Payout Settings</div>
                        <div className="text-sm text-tertiary">Configure payment method</div>
                    </Card>
                </Link>
            </div>
        </div>
    );
};
