// =============================================================================
// Register Page - Wide Layout, No Scroll, Compact Design
// =============================================================================

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Icon, Icons } from '../../components/Icon';
import { validators } from '../../utils/validators';
import { toast } from '../../store/toastStore';

// Country codes for phone
const COUNTRY_CODES = [
    { code: '+1', country: 'US' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'IN' },
    { code: '+977', country: 'NP' },
    { code: '+86', country: 'CN' },
    { code: '+81', country: 'JP' },
    { code: '+49', country: 'DE' },
    { code: '+33', country: 'FR' },
    { code: '+61', country: 'AU' },
    { code: '+971', country: 'AE' },
];


export const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register, isLoading, error, clearError } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        countryCode: '+977',
        phone: '',
        dateOfBirth: '',
        password: '',
        confirmPassword: '',
    });

    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    // Convert HEIC/HEIF to JPEG using canvas
    const convertToJpeg = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    URL.revokeObjectURL(url);
                    resolve(jpegDataUrl);
                } else {
                    reject(new Error('Canvas context not available'));
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File too large', 'Please select an image under 10MB');
                return;
            }

            const isHeic = file.type === 'image/heic' ||
                file.type === 'image/heif' ||
                file.name.toLowerCase().endsWith('.heic') ||
                file.name.toLowerCase().endsWith('.heif');

            try {
                if (isHeic) {
                    // Convert HEIC to JPEG
                    toast.info('Converting...', 'Converting image format');
                    const jpegData = await convertToJpeg(file);
                    setProfilePhoto(jpegData);
                } else {
                    // Regular image - read as base64
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setProfilePhoto(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                toast.error('Conversion failed', 'Please try a different image format (JPG, PNG)');
            }
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Profile photo is required
        if (!profilePhoto) {
            newErrors.profilePhoto = 'Profile photo is required';
        }

        const nameError = validators.required(formData.name, 'Full name');
        if (nameError) newErrors.name = nameError;

        const emailError = validators.email(formData.email);
        if (emailError) newErrors.email = emailError;

        if (!formData.phone.trim()) {
            newErrors.phone = 'Required';
        } else if (!/^\d{7,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Invalid phone';
        }


        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = 'Required';
        } else {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            if (age < 18) {
                newErrors.dateOfBirth = 'Must be 18+';
            }
        }

        const passwordError = validators.password(formData.password);
        if (passwordError) newErrors.password = passwordError;

        const confirmError = validators.confirmPassword(
            formData.confirmPassword,
            formData.password
        );
        if (confirmError) newErrors.confirmPassword = confirmError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) {
            // Show toast for photo error since it's not near a field
            if (errors.profilePhoto) {
                toast.error('Photo Required', 'Please upload a profile photo');
            }
            return;
        }

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: `${formData.countryCode}${formData.phone}`,
                dateOfBirth: formData.dateOfBirth,
                profilePicture: profilePhoto || undefined,
            });
            // Registration creates pending account - redirect to login with message
            toast.success('Registration Submitted!', 'Your account is pending admin approval. You will be notified once approved.');
            navigate('/login');
        } catch {
            // Error is already in the store
        }
    };

    return (
        <div className="auth-page">
            {/* Animated Background */}
            <div className="auth-bg">
                <div className="auth-bg-gradient" />
                <div className="auth-bg-glow auth-bg-glow-1" />
                <div className="auth-bg-glow auth-bg-glow-2" />
                <div className="auth-bg-grid" />
                <div className="auth-bg-rays" />
            </div>

            {/* Floating Orbs */}
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
            <div className="auth-orb auth-orb-3" />

            {/* Corner Decorations */}
            <div className="auth-corner auth-corner-tl" />
            <div className="auth-corner auth-corner-tr" />
            <div className="auth-corner auth-corner-bl" />
            <div className="auth-corner auth-corner-br" />

            {/* Header */}
            <header className="auth-header">
                <Link to="/" className="auth-logo">
                    <div className="auth-logo-icon">
                        <Icon name="envelope" size="md" />
                    </div>
                    <span className="auth-logo-text">Mailstack</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="auth-main">
                {/* Tagline */}
                <div className="auth-tagline auth-tagline-compact">
                    <h1 className="auth-tagline-slogan">
                        <span>Verification.</span>
                        <span>Accountability.</span>
                        <span>Payment.</span>
                    </h1>
                </div>

                {/* Register Card - Wide layout */}
                <div className="auth-card auth-card-wide">
                    <div className="auth-card-glow" />

                    <div className="auth-card-header">
                        <h2 className="auth-card-title">Create Account</h2>
                        <p className="auth-card-subtitle">Join thousands of suppliers earning daily</p>
                    </div>

                    {error && (
                        <div className="auth-alert auth-alert-error">
                            <Icon name={Icons.error} size="sm" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form auth-form-compact">
                        {/* Identity Block: Photo | Name | Email | DOB */}
                        <div className="register-row register-identity-row">
                            {/* Profile Photo */}
                            <div className="register-photo-cell">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    className="register-photo-btn"
                                    onClick={handlePhotoClick}
                                >
                                    {profilePhoto ? (
                                        <img src={profilePhoto} alt="Profile" className="register-photo-img" />
                                    ) : (
                                        <Icon name="camera" size="md" />
                                    )}
                                </button>
                                <span className="register-photo-label">Photo</span>
                            </div>

                            {/* Full Name */}
                            <div className="auth-field">
                                <label className="auth-label">Full Name</label>
                                <div className={`auth-input-wrapper auth-input-compact ${errors.name ? 'error' : ''}`}>
                                    <span className="auth-input-icon">
                                        <Icon name="user" size="sm" />
                                    </span>
                                    <input
                                        type="text"
                                        name="name"
                                        className="auth-input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="auth-field">
                                <label className="auth-label">Email</label>
                                <div className={`auth-input-wrapper auth-input-compact ${errors.email ? 'error' : ''}`}>
                                    <span className="auth-input-icon">
                                        <Icon name={Icons.email} size="sm" />
                                    </span>
                                    <input
                                        type="email"
                                        name="email"
                                        className="auth-input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div className="auth-field">
                                <label className="auth-label">Date of Birth</label>
                                <div className={`auth-input-wrapper auth-input-compact ${errors.dateOfBirth ? 'error' : ''}`}>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        className="auth-input auth-date-input"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Account Block: Phone | Password | Confirm */}
                        <div className="register-row register-account-row">
                            {/* Phone */}
                            <div className="auth-field">
                                <label className="auth-label">Phone</label>
                                <div className={`auth-input-wrapper auth-phone-wrapper auth-input-compact ${errors.phone ? 'error' : ''}`}>
                                    <select
                                        name="countryCode"
                                        className="auth-country-select"
                                        value={formData.countryCode}
                                        onChange={handleChange}
                                    >
                                        {COUNTRY_CODES.map((c) => (
                                            <option key={c.code} value={c.code}>{c.code}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="auth-input auth-phone-input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="9800000000"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="auth-field">
                                <label className="auth-label">Password</label>
                                <div className={`auth-input-wrapper auth-input-compact ${errors.password ? 'error' : ''}`}>
                                    <span className="auth-input-icon">
                                        <Icon name="lock" size="sm" />
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="auth-input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Min 8 chars"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="auth-toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <Icon name={showPassword ? Icons.hide : Icons.view} size="sm" />
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="auth-field">
                                <label className="auth-label">Confirm</label>
                                <div className={`auth-input-wrapper auth-input-compact ${errors.confirmPassword ? 'error' : ''}`}>
                                    <span className="auth-input-icon">
                                        <Icon name="lock" size="sm" />
                                    </span>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        className="auth-input"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Re-enter"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="auth-toggle-password"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <Icon name={showConfirmPassword ? Icons.hide : Icons.view} size="sm" />
                                    </button>
                                </div>
                            </div>
                        </div>


                        {/* Submit Button - Full Width */}
                        <button
                            type="submit"
                            className="auth-submit-btn auth-submit-compact"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="auth-spinner" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <Icon name="arrow-right" size="sm" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-card-footer">
                        <span>Already have an account?</span>
                        <Link to="/login" className="auth-link">Sign In</Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="auth-footer">
                <p>©2026 Mailstack Ltd. All rights reserved.</p>
            </footer>
        </div>
    );
};
