// =============================================================================
// Admin Profile Page
// =============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { toast } from '../../store/toastStore';
import { formatters } from '../../utils/formatters';

export const AdminProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleChangePassword = () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Error', 'Passwords do not match.');
            return;
        }
        toast.success('Password changed!', 'Your password has been updated.');
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Profile</h1>
                <p className="page-subtitle">Admin account settings</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Profile Info */}
                <Card>
                    <div className="flex gap-4 mb-6">
                        <div className="avatar avatar-lg">
                            {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">{user?.name}</h2>
                            <p className="text-sm text-muted">{user?.email}</p>
                            <p className="text-xs text-muted mt-1">
                                Administrator • Since {formatters.date(user?.createdAt || '')}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Security */}
                <Card>
                    <h3 className="font-semibold mb-4">Security</h3>
                    {showPasswordForm ? (
                        <div>
                            <Input
                                type="password"
                                label="Current Password"
                                value={passwordData.currentPassword}
                                onChange={(e) =>
                                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                                }
                            />
                            <Input
                                type="password"
                                label="New Password"
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                                }
                            />
                            <Input
                                type="password"
                                label="Confirm New Password"
                                value={passwordData.confirmPassword}
                                onChange={(e) =>
                                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                                }
                            />
                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowPasswordForm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button variant="primary" size="sm" onClick={handleChangePassword}>
                                    Update
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="secondary"
                            block
                            onClick={() => setShowPasswordForm(true)}
                        >
                            Change Password
                        </Button>
                    )}
                </Card>

                {/* Logout */}
                <Card>
                    <h3 className="font-semibold mb-4">Session</h3>
                    <Button variant="danger" block onClick={handleLogout}>
                        Logout
                    </Button>
                </Card>
            </div>
        </div>
    );
};
