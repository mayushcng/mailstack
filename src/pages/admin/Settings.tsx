// =============================================================================
// Admin Settings Page - Quotas, Bonus Tiers, and Telegram
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Icon, Icons } from '../../components/Icon';
import { apiClient } from '../../api/client';
import { toast } from '../../store/toastStore';
import type { SystemSettings, BonusTier } from '../../api/types';

export const Settings: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Quota form state
    const [gmailQuotaInput, setGmailQuotaInput] = useState('');
    const [outlookQuotaInput, setOutlookQuotaInput] = useState('');
    const [gmailUnlimited, setGmailUnlimited] = useState(false);
    const [outlookUnlimited, setOutlookUnlimited] = useState(false);

    // Bonus tiers state
    const [bonusTiers, setBonusTiers] = useState<BonusTier[]>([]);
    const [newTierEmails, setNewTierEmails] = useState('');
    const [newTierBonus, setNewTierBonus] = useState('');
    const [newTierRewardType, setNewTierRewardType] = useState<string>('money');
    const [newTierRewardName, setNewTierRewardName] = useState('');
    const [newTierRewardDuration, setNewTierRewardDuration] = useState('');

    // Telegram state
    const [telegramUrl, setTelegramUrl] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiClient.get<SystemSettings>('/admin/settings');
            setSettings(data);
            setGmailQuotaInput(data.gmailQuota?.toString() || '');
            setOutlookQuotaInput(data.outlookQuota?.toString() || '');
            setGmailUnlimited(data.gmailQuota === null);
            setOutlookUnlimited(data.outlookQuota === null);
            setBonusTiers(data.bonusTiers || []);
            setTelegramUrl(data.telegramChannelUrl || '');
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.patch('/admin/settings', {
                gmailQuota: gmailUnlimited ? null : parseInt(gmailQuotaInput) || null,
                outlookQuota: outlookUnlimited ? null : parseInt(outlookQuotaInput) || null,
                bonusTiers,
                telegramChannelUrl: telegramUrl || undefined,
            });
            toast.success('Saved!', 'System settings have been updated.');
            fetchSettings();
        } catch (error) {
            toast.error('Error', 'Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const addBonusTier = () => {
        const emails = parseInt(newTierEmails);
        const bonus = parseInt(newTierBonus);
        if (!emails || !bonus || emails <= 0 || bonus <= 0) {
            toast.error('Invalid', 'Please enter valid values for emails and bonus amount.');
            return;
        }
        // Check for duplicate
        if (bonusTiers.some(t => t.emailsRequired === emails)) {
            toast.error('Duplicate', 'A tier with this email count already exists.');
            return;
        }
        const newTier: BonusTier = {
            id: `tier-${Date.now()}`,
            emailsRequired: emails,
            bonusAmount: bonus,
            rewardType: newTierRewardType !== 'money' ? newTierRewardType as BonusTier['rewardType'] : undefined,
            rewardName: newTierRewardName || undefined,
            rewardDuration: newTierRewardDuration || undefined,
        };
        const updated = [...bonusTiers, newTier].sort((a, b) => a.emailsRequired - b.emailsRequired);
        setBonusTiers(updated);
        setNewTierEmails('');
        setNewTierBonus('');
        setNewTierRewardType('money');
        setNewTierRewardName('');
        setNewTierRewardDuration('');
    };

    const removeBonusTier = (id: string) => {
        setBonusTiers(bonusTiers.filter(t => t.id !== id));
    };

    const getProgress = (submitted: number, quota: number | null) => {
        if (quota === null) return 0;
        return Math.min((submitted / quota) * 100, 100);
    };

    const getRemaining = (submitted: number, quota: number | null) => {
        if (quota === null) return '∞';
        return Math.max(quota - submitted, 0);
    };

    // Get reward icon and color
    const getRewardDisplay = (type?: string) => {
        switch (type) {
            case 'netflix': return { icon: 'film', color: '#e50914', label: 'Netflix' };
            case 'prime': return { icon: 'tv', color: '#00a8e1', label: 'Prime Video' };
            case 'spotify': return { icon: 'music', color: '#1db954', label: 'Spotify' };
            case 'custom': return { icon: 'gift', color: 'var(--accent)', label: 'Custom' };
            default: return { icon: 'coins', color: 'var(--success)', label: 'Money Only' };
        }
    };

    if (loading || !settings) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1 className="page-title">Settings</h1>
                </div>
                <div className="skeleton skeleton-card" style={{ height: 300 }} />
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">System Settings</h1>
                <p className="page-subtitle">Configure quotas, bonuses, and system-wide settings</p>
            </div>

            {/* Quota Section */}
            <div className="section-header">
                <h2 className="section-title flex items-center gap-2">
                    <Icon name="chart-pie" style={{ color: 'var(--accent-soft)' }} />
                    Email Quotas
                </h2>
            </div>
            <div className="dashboard-grid dashboard-grid-2 page-section">
                {/* Gmail Quota */}
                <Card>
                    <div className="card-header mb-4">
                        <h3 className="card-title flex items-center gap-2">
                            <Icon name={Icons.gmail} style={{ color: '#ea4335' }} />
                            Gmail Quota
                        </h3>
                    </div>
                    <div className="mb-6 p-4 bg-surface-2 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-secondary">Current Progress</span>
                            <span className="font-bold">
                                {settings.gmailSubmitted} / {settings.gmailQuota ?? '∞'}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${getProgress(settings.gmailSubmitted, settings.gmailQuota)}%`,
                                    background: getProgress(settings.gmailSubmitted, settings.gmailQuota) >= 90
                                        ? 'var(--danger)'
                                        : 'var(--accent)'
                                }}
                            />
                        </div>
                        <div className="text-xs text-tertiary mt-2">
                            {getRemaining(settings.gmailSubmitted, settings.gmailQuota)} remaining
                        </div>
                    </div>
                    <div className="form-group mb-4">
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input
                                type="checkbox"
                                checked={gmailUnlimited}
                                onChange={(e) => setGmailUnlimited(e.target.checked)}
                            />
                            <span className="font-medium">Unlimited Gmail submissions</span>
                        </label>
                        {!gmailUnlimited && (
                            <Input
                                type="number"
                                placeholder="Enter quota limit"
                                value={gmailQuotaInput}
                                onChange={(e) => setGmailQuotaInput(e.target.value)}
                            />
                        )}
                    </div>
                </Card>

                {/* Outlook Quota */}
                <Card>
                    <div className="card-header mb-4">
                        <h3 className="card-title flex items-center gap-2">
                            <Icon name={Icons.outlook} style={{ color: '#0078d4' }} />
                            Outlook Quota
                        </h3>
                    </div>
                    <div className="mb-6 p-4 bg-surface-2 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-secondary">Current Progress</span>
                            <span className="font-bold">
                                {settings.outlookSubmitted} / {settings.outlookQuota ?? '∞'}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${getProgress(settings.outlookSubmitted, settings.outlookQuota)}%`,
                                    background: getProgress(settings.outlookSubmitted, settings.outlookQuota) >= 90
                                        ? 'var(--danger)'
                                        : 'var(--accent)'
                                }}
                            />
                        </div>
                        <div className="text-xs text-tertiary mt-2">
                            {getRemaining(settings.outlookSubmitted, settings.outlookQuota)} remaining
                        </div>
                    </div>
                    <div className="form-group mb-4">
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input
                                type="checkbox"
                                checked={outlookUnlimited}
                                onChange={(e) => setOutlookUnlimited(e.target.checked)}
                            />
                            <span className="font-medium">Unlimited Outlook submissions</span>
                        </label>
                        {!outlookUnlimited && (
                            <Input
                                type="number"
                                placeholder="Enter quota limit"
                                value={outlookQuotaInput}
                                onChange={(e) => setOutlookQuotaInput(e.target.value)}
                            />
                        )}
                    </div>
                </Card>
            </div>

            {/* Bonus Tiers Section */}
            <div className="section-header">
                <h2 className="section-title flex items-center gap-2">
                    <Icon name={Icons.gift} style={{ color: 'var(--accent-soft)' }} />
                    Bonus Tiers & Rewards
                </h2>
            </div>
            <Card className="page-section">
                <p className="text-sm text-secondary mb-4">
                    Configure multiple bonus tiers with money and/or reward incentives. Suppliers will unlock bonuses as they reach each email threshold.
                </p>

                {/* Current Tiers */}
                {bonusTiers.length > 0 && (
                    <div className="mb-4">
                        <div className="grid gap-2">
                            {bonusTiers.map((tier) => {
                                const reward = getRewardDisplay(tier.rewardType);
                                return (
                                    <div
                                        key={tier.id}
                                        className="flex items-center justify-between p-3 bg-surface-2 rounded-lg"
                                    >
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span className="flex items-center gap-2 text-accent font-bold">
                                                <Icon name={Icons.target} />
                                                {tier.emailsRequired} emails
                                            </span>
                                            <span className="text-secondary">→</span>
                                            <span className="text-success font-bold">Rs. {tier.bonusAmount}</span>
                                            {tier.rewardType && tier.rewardType !== 'money' && (
                                                <span
                                                    className="reward-tag flex items-center gap-1"
                                                    style={{
                                                        background: reward.color,
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <Icon name={reward.icon} size="xs" />
                                                    + {tier.rewardName || reward.label} {tier.rewardDuration}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeBonusTier(tier.id)}
                                        >
                                            <Icon name={Icons.close} />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Add New Tier */}
                <div className="p-4 bg-surface-2 rounded-lg">
                    <div className="text-sm font-medium mb-3">Add New Tier</div>
                    <div className="form-row form-row-3">
                        <Input
                            label="Emails Required"
                            type="number"
                            placeholder="e.g., 500"
                            value={newTierEmails}
                            onChange={(e) => setNewTierEmails(e.target.value)}
                        />
                        <Input
                            label="Bonus Amount (Rs.)"
                            type="number"
                            placeholder="e.g., 500"
                            value={newTierBonus}
                            onChange={(e) => setNewTierBonus(e.target.value)}
                        />
                        <div className="form-group">
                            <label className="form-label">Reward Type</label>
                            <select
                                className="form-select"
                                value={newTierRewardType}
                                onChange={(e) => setNewTierRewardType(e.target.value)}
                            >
                                <option value="money">Money Only</option>
                                <option value="netflix">+ Netflix</option>
                                <option value="prime">+ Prime Video</option>
                                <option value="spotify">+ Spotify</option>
                                <option value="custom">+ Custom Reward</option>
                            </select>
                        </div>
                    </div>

                    {newTierRewardType !== 'money' && (
                        <div className="form-row dashboard-grid-2-1 mt-4">
                            <Input
                                label={newTierRewardType === 'custom' ? "Reward Name" : "Override Name (optional)"}
                                placeholder={newTierRewardType === 'custom' ? "e.g., Disney+ Hotstar" : `${getRewardDisplay(newTierRewardType).label} Premium`}
                                value={newTierRewardName}
                                onChange={(e) => setNewTierRewardName(e.target.value)}
                            />
                            <Input
                                label="Duration"
                                placeholder="e.g., 1 month, 6 months"
                                value={newTierRewardDuration}
                                onChange={(e) => setNewTierRewardDuration(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex justify-end mt-4">
                        <Button variant="secondary" onClick={addBonusTier}>
                            <Icon name="plus" className="icon-mr" size="sm" />
                            Add Tier
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Telegram Channel */}
            <div className="section-header">
                <h2 className="section-title flex items-center gap-2">
                    <Icon name={Icons.telegram} prefix="fab" style={{ color: '#0088cc' }} />
                    Telegram Channel
                </h2>
            </div>
            <Card className="page-section">
                <p className="text-sm text-secondary mb-4">
                    Suppliers will see a "Join our Telegram" button on their dashboard linking to this channel.
                </p>
                <Input
                    label="Telegram Channel URL"
                    placeholder="https://t.me/your_channel"
                    value={telegramUrl}
                    onChange={(e) => setTelegramUrl(e.target.value)}
                />
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button variant="primary" onClick={handleSave} loading={isSaving}>
                    <Icon name="floppy-disk" className="icon-mr" size="sm" />
                    Save All Settings
                </Button>
            </div>
        </div>
    );
};
