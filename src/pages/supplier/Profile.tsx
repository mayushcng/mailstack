// =============================================================================
// Supplier Profile Page
// =============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { toast } from '../../store/toastStore';
import { validators } from '../../utils/validators';
import { formatters } from '../../utils/formatters';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: (user as any)?.phone || '',
        city: (user as any)?.city || '',
        country: (user as any)?.country || '',
        occupation: (user as any)?.occupation || '',
    });

    // Password change state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = () => {
        // In real app, would call API
        toast.success('Profile updated!', 'Your changes have been saved.');
        setIsEditing(false);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
        if (passwordErrors[name]) {
            setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleChangePassword = () => {
        const errors: Record<string, string> = {};

        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }

        const newPasswordError = validators.password(passwordData.newPassword);
        if (newPasswordError) errors.newPassword = newPasswordError;

        const confirmError = validators.confirmPassword(
            passwordData.confirmPassword,
            passwordData.newPassword
        );
        if (confirmError) errors.confirmPassword = confirmError;

        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }

        // In real app, would call API
        toast.success('Password changed!', 'Your password has been updated.');
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Profile</h1>
                <p className="page-subtitle">Manage your account settings</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="md:col-span-2">
                    <Card>
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex gap-4">
                                <div className="avatar avatar-lg">
                                    {user?.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-lg">{user?.name}</h2>
                                    <p className="text-sm text-muted">{user?.email}</p>
                                    <p className="text-xs text-muted mt-1">
                                        Member since {formatters.date(user?.createdAt || '')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={isEditing ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? 'Cancel' : 'Edit'}
                            </Button>
                        </div>

                        {isEditing ? (
                            <div>
                                <Input
                                    name="name"
                                    label="Full Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                                <Input
                                    name="phone"
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        name="city"
                                        label="City"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        name="country"
                                        label="Country"
                                        value={formData.country}
                                        onChange={handleChange}
                                    />
                                </div>
                                <Input
                                    name="occupation"
                                    label="Occupation"
                                    value={formData.occupation}
                                    onChange={handleChange}
                                />
                                <div className="flex justify-end mt-4">
                                    <Button variant="primary" onClick={handleSaveProfile}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted">Phone</div>
                                    <div>{formData.phone || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted">Occupation</div>
                                    <div>{formData.occupation || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted">City</div>
                                    <div>{formData.city || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted">Country</div>
                                    <div>{formData.country || '-'}</div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-4">
                    {/* Change Password */}
                    <Card>
                        <h3 className="font-semibold mb-4">Security</h3>
                        {showPasswordForm ? (
                            <div>
                                <Input
                                    type="password"
                                    name="currentPassword"
                                    label="Current Password"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    error={passwordErrors.currentPassword}
                                />
                                <Input
                                    type="password"
                                    name="newPassword"
                                    label="New Password"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    error={passwordErrors.newPassword}
                                />
                                <Input
                                    type="password"
                                    name="confirmPassword"
                                    label="Confirm New Password"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    error={passwordErrors.confirmPassword}
                                />
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setShowPasswordForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleChangePassword}
                                    >
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
        </div>
    );
};
