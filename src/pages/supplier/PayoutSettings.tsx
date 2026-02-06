// =============================================================================
// Payout Settings Page - Nepal Payment Methods
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Icon } from '../../components/Icon';
import { apiClient } from '../../api/client';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import type { NepalPayoutSettings, PaymentMethod, Supplier } from '../../api/types';
import esewaLogo from '../../assets/esewa-logo.svg';
import khaltiLogo from '../../assets/khalti-logo.svg';

interface PaymentMethodConfig {
    value: PaymentMethod;
    label: string;
    logo?: string;
    icon?: string;
    color: string;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
    { value: 'esewa', label: 'eSewa', logo: esewaLogo, color: '#60BB46' },
    { value: 'khalti', label: 'Khalti', logo: khaltiLogo, color: '#5C2D91' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'building-columns', color: 'var(--accent)' },
];

export const PayoutSettings: React.FC = () => {
    const user = useAuthStore((s) => s.user) as Supplier | null;
    const [activeMethod, setActiveMethod] = useState<PaymentMethod>('esewa');
    const [settings, setSettings] = useState<NepalPayoutSettings>({
        method: 'esewa',
        walletId: '',
        walletName: '',
        walletQrUrl: '',
        bankName: '',
        bankAccountHolderName: '',
        bankAccountNumber: '',
        bankQrUrl: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user && 'nepalPayoutSettings' in user && user.nepalPayoutSettings) {
            setSettings(user.nepalPayoutSettings);
            setActiveMethod(user.nepalPayoutSettings.method);
        }
    }, [user]);

    const handleChange = (field: keyof NepalPayoutSettings, value: string) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const handleMethodChange = (method: PaymentMethod) => {
        setActiveMethod(method);
        setSettings((prev) => ({ ...prev, method }));
    };

    const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In real app, upload to server. For demo, create blob URL
            const url = URL.createObjectURL(file);
            if (activeMethod === 'bank_transfer') {
                handleChange('bankQrUrl', url);
            } else {
                handleChange('walletQrUrl', url);
            }
            toast.success('QR Uploaded', 'QR code image has been uploaded.');
        }
    };

    const handleSave = async () => {
        // Validation
        if (activeMethod === 'esewa' || activeMethod === 'khalti') {
            if (!settings.walletId || !settings.walletName) {
                toast.error('Required', 'Please provide wallet ID and name.');
                return;
            }
        } else if (activeMethod === 'bank_transfer') {
            if (!settings.bankName || !settings.bankAccountHolderName || !settings.bankAccountNumber) {
                toast.error('Required', 'Please provide all bank details.');
                return;
            }
        }

        setIsSaving(true);

        try {
            await apiClient.patch('/supplier/payout-settings', settings);
            toast.success('Saved!', 'Your payout settings have been updated.');
        } catch (error) {
            toast.error('Failed', 'Could not save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const getCurrentQrUrl = () => {
        return activeMethod === 'bank_transfer' ? settings.bankQrUrl : settings.walletQrUrl;
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Payout Settings</h1>
                <p className="page-subtitle">Configure how you receive payments</p>
            </div>

            {/* Payment Method Tabs */}
            <div className="tabs mb-6">
                {PAYMENT_METHODS.map((method) => (
                    <button
                        key={method.value}
                        className={`tab ${activeMethod === method.value ? 'active' : ''}`}
                        onClick={() => handleMethodChange(method.value)}
                    >
                        <span className="mr-2" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {method.logo ? (
                                <img src={method.logo} alt={method.label} style={{ width: 20, height: 20 }} />
                            ) : (
                                <Icon name={method.icon!} />
                            )}
                        </span>
                        {method.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
                {/* Settings Form */}
                <Card>
                    <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {PAYMENT_METHODS.find(m => m.value === activeMethod)?.logo ? (
                            <img
                                src={PAYMENT_METHODS.find(m => m.value === activeMethod)?.logo}
                                alt=""
                                style={{ width: 24, height: 24 }}
                            />
                        ) : (
                            <Icon name={PAYMENT_METHODS.find(m => m.value === activeMethod)?.icon || 'building-columns'} />
                        )}
                        {PAYMENT_METHODS.find(m => m.value === activeMethod)?.label} Details
                    </h3>

                    {/* eSewa / Khalti Fields */}
                    {(activeMethod === 'esewa' || activeMethod === 'khalti') && (
                        <>
                            <div className="form-group mb-4">
                                <label className="form-label">
                                    {activeMethod === 'esewa' ? 'eSewa' : 'Khalti'} Wallet ID
                                </label>
                                <Input
                                    placeholder="Enter your 10-digit mobile number"
                                    value={settings.walletId || ''}
                                    onChange={(e) => handleChange('walletId', e.target.value)}
                                />
                                <span className="form-hint">
                                    Your registered mobile number for {activeMethod === 'esewa' ? 'eSewa' : 'Khalti'}
                                </span>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">Account Holder Name</label>
                                <Input
                                    placeholder="Full name as registered"
                                    value={settings.walletName || ''}
                                    onChange={(e) => handleChange('walletName', e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Bank Transfer Fields */}
                    {activeMethod === 'bank_transfer' && (
                        <>
                            <div className="form-group mb-4">
                                <label className="form-label">Bank Name</label>
                                <Input
                                    placeholder="e.g., Nabil Bank, NIC Asia, Himalayan Bank"
                                    value={settings.bankName || ''}
                                    onChange={(e) => handleChange('bankName', e.target.value)}
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">Account Holder Name</label>
                                <Input
                                    placeholder="Name as per bank records"
                                    value={settings.bankAccountHolderName || ''}
                                    onChange={(e) => handleChange('bankAccountHolderName', e.target.value)}
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">Account Number</label>
                                <Input
                                    placeholder="Your bank account number"
                                    value={settings.bankAccountNumber || ''}
                                    onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* QR Upload Section */}
                    <div className="form-group">
                        <label className="form-label">Payment QR Code (Optional)</label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleQrUpload}
                                style={{ display: 'none' }}
                            />
                            <Button
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Icon name="camera" style={{ marginRight: '4px' }} /> Upload QR
                            </Button>
                            {getCurrentQrUrl() && (
                                <span className="text-success text-sm"><Icon name="circle-check" size="sm" style={{ marginRight: '4px' }} /> QR uploaded</span>
                            )}
                        </div>
                        <span className="form-hint">
                            Upload your {activeMethod === 'bank_transfer' ? 'bank' : activeMethod} payment QR code for faster payments
                        </span>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                        <Button variant="primary" onClick={handleSave} loading={isSaving}>
                            Save Payout Settings
                        </Button>
                    </div>
                </Card>

                {/* QR Preview & Info */}
                <div className="flex flex-col gap-6">
                    {/* QR Preview */}
                    {getCurrentQrUrl() && (
                        <Card>
                            <h4 className="card-title mb-3">QR Code Preview</h4>
                            <div className="flex justify-center p-4 bg-white rounded-lg">
                                <img
                                    src={getCurrentQrUrl()}
                                    alt="Payment QR Code"
                                    style={{ maxWidth: 180, maxHeight: 180 }}
                                />
                            </div>
                        </Card>
                    )}

                    {/* Info Box */}
                    <Card style={{ background: 'var(--accent-muted)', border: 'none' }}>
                        <div className="flex gap-3">
                            <span className="text-accent text-xl"><Icon name="lightbulb" size="lg" /></span>
                            <div>
                                <h4 className="font-semibold text-accent mb-1">Payment Processing</h4>
                                <p className="text-sm text-secondary">
                                    Payments are processed after you request a payout and an admin approves it.
                                    {activeMethod === 'esewa' && ' eSewa transfers are typically instant.'}
                                    {activeMethod === 'khalti' && ' Khalti transfers are typically instant.'}
                                    {activeMethod === 'bank_transfer' && ' Bank transfers may take 1-3 business days.'}
                                    <br /><br />
                                    Minimum payout amount is <strong>Rs. 300</strong>.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
