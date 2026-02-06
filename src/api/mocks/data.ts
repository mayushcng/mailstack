// =============================================================================
// Mock Data - Realistic test data for development
// =============================================================================

import type {
    Supplier,
    Admin,
    Gmail,
    Payment,
    Activity,
    SupplierDashboard,
    AdminDashboard,
    PayoutRequest,
    LeaderboardEntry,
    EmailType,
    SystemSettings,
} from '../types';

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------
const randomDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString();
};

const randomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
    const length = 8 + Math.floor(Math.random() * 6);
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const randomEmail = (type: EmailType = 'gmail') => {
    const names = ['john', 'jane', 'mike', 'sarah', 'alex', 'emma', 'david', 'lisa', 'chris', 'anna'];
    const domain = type === 'gmail' ? 'gmail.com' : 'outlook.com';
    const name = names[Math.floor(Math.random() * names.length)];
    const num = Math.floor(Math.random() * 9999);
    return `${name}${num}@${domain}`;
};

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------
export const mockAdmin: Admin = {
    id: 'admin-001',
    email: 'admin@mailstack.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
};

export const mockSuppliers: Supplier[] = [
    {
        id: 'sup-001',
        email: 'john.supplier@example.com',
        name: 'John Smith',
        role: 'supplier',
        code: 'JOHN001',
        status: 'ACTIVE',
        rate: 5.00,
        isVip: true,
        totalEarnings: 15750,
        phone: '+977 98765 43210',
        city: 'Kathmandu',
        country: 'Nepal',
        occupation: 'Digital Marketing',
        dateOfBirth: '1990-05-15',
        nepalPayoutSettings: {
            method: 'esewa',
            walletId: '9876543210',
            walletName: 'John Smith',
            walletQrUrl: 'https://example.com/qr/john-esewa',
        },
        bonusAmount: 500,
        bonusThreshold: 100,
        submittedCount: 65,
        createdAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'sup-002',
        email: 'sarah.doe@example.com',
        name: 'Sarah Doe',
        role: 'supplier',
        code: 'SARAH02',
        status: 'ACTIVE',
        rate: 4.50,
        isVip: false,
        totalEarnings: 12500,
        nepalPayoutSettings: {
            method: 'khalti',
            walletId: '9812345678',
            walletName: 'Sarah Doe',
        },
        bonusAmount: 300,
        bonusThreshold: 50,
        submittedCount: 42,
        createdAt: '2024-07-15T00:00:00Z',
    },
    {
        id: 'sup-003',
        email: 'mike.wilson@example.com',
        name: 'Mike Wilson',
        role: 'supplier',
        code: 'MIKE003',
        status: 'PENDING',
        rate: 4.00,
        isVip: false,
        totalEarnings: 8200,
        submittedCount: 25,
        createdAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'sup-004',
        email: 'emma.brown@example.com',
        name: 'Emma Brown',
        role: 'supplier',
        code: 'EMMA004',
        status: 'DISABLED',
        rate: 3.50,
        isVip: false,
        totalEarnings: 4500,
        submittedCount: 30,
        createdAt: '2024-03-20T00:00:00Z',
    },
    {
        id: 'sup-005',
        email: 'priya.sharma@example.com',
        name: 'Priya Sharma',
        role: 'supplier',
        code: 'PRIYA05',
        status: 'ACTIVE',
        rate: 5.50,
        isVip: true,
        totalEarnings: 22000,
        nepalPayoutSettings: {
            method: 'bank_transfer',
            bankName: 'Nabil Bank',
            bankAccountHolderName: 'Priya Sharma',
            bankAccountNumber: '1234567890123',
            bankQrUrl: 'https://example.com/qr/priya-bank',
        },
        bonusAmount: 1000,
        bonusThreshold: 200,
        submittedCount: 180,
        createdAt: '2024-02-10T00:00:00Z',
    },
];

export const mockCurrentSupplier = mockSuppliers[0];

// -----------------------------------------------------------------------------
// Gmails
// -----------------------------------------------------------------------------
const generateMockGmails = (count: number): Gmail[] => {
    const statuses: Gmail['status'][] = ['PENDING', 'VERIFIED', 'REJECTED'];
    const emailTypes: EmailType[] = ['gmail', 'outlook'];
    const remarks = [
        'Invalid credentials',
        'Account suspended',
        'Phone verification required',
        'Recovery email invalid',
    ];

    return Array.from({ length: count }, (_, i) => {
        const status = statuses[Math.floor(Math.random() * 3)];
        const emailType = emailTypes[Math.floor(Math.random() * 10) < 8 ? 0 : 1]; // 80% gmail
        const supplier = mockSuppliers[Math.floor(Math.random() * mockSuppliers.length)];

        return {
            id: `gmail-${String(i + 1).padStart(4, '0')}`,
            email: randomEmail(emailType),
            password: randomPassword(),
            emailType,
            status,
            remark: status === 'REJECTED' ? remarks[Math.floor(Math.random() * remarks.length)] : undefined,
            submittedAt: randomDate(30),
            verifiedAt: status === 'VERIFIED' ? randomDate(15) : undefined,
            rejectedAt: status === 'REJECTED' ? randomDate(15) : undefined,
            supplierId: supplier.id,
            supplierName: supplier.name,
            supplierCode: supplier.code,
        };
    });
};

export const mockGmails: Gmail[] = generateMockGmails(150);

// Filter helpers
export const getGmailsByStatus = (status?: Gmail['status']) =>
    status ? mockGmails.filter((g) => g.status === status) : mockGmails;

export const getGmailsBySupplierId = (supplierId: string) =>
    mockGmails.filter((g) => g.supplierId === supplierId);

export const getPendingGmails = () => mockGmails.filter((g) => g.status === 'PENDING');
export const getVerifiedGmails = () => mockGmails.filter((g) => g.status === 'VERIFIED');
export const getRejectedGmails = () => mockGmails.filter((g) => g.status === 'REJECTED');

// -----------------------------------------------------------------------------
// Payments
// -----------------------------------------------------------------------------
export const mockPayments: Payment[] = [
    {
        id: 'pay-001',
        supplierId: 'sup-001',
        supplierName: 'John Smith',
        period: 'Jan 1-15, 2025',
        snapshotDate: '2025-01-15T00:00:00Z',
        verifiedCount: 120,
        rate: 5.00,
        amount: 600,
        status: 'PAID',
        paidAt: '2025-01-18T00:00:00Z',
        createdAt: '2025-01-15T00:00:00Z',
    },
    {
        id: 'pay-002',
        supplierId: 'sup-001',
        supplierName: 'John Smith',
        period: 'Jan 16-31, 2025',
        snapshotDate: '2025-01-31T00:00:00Z',
        verifiedCount: 95,
        rate: 5.00,
        amount: 475,
        status: 'UNPAID',
        createdAt: '2025-01-31T00:00:00Z',
    },
    {
        id: 'pay-003',
        supplierId: 'sup-002',
        supplierName: 'Sarah Doe',
        period: 'Jan 1-31, 2025',
        snapshotDate: '2025-01-31T00:00:00Z',
        verifiedCount: 200,
        rate: 4.50,
        amount: 900,
        status: 'UNPAID',
        createdAt: '2025-01-31T00:00:00Z',
    },
];

// -----------------------------------------------------------------------------
// Payout Requests
// -----------------------------------------------------------------------------
export const mockPayoutRequests: PayoutRequest[] = [
    {
        id: 'req-001',
        supplierId: 'sup-002',
        supplierName: 'Sarah Doe',
        amount: 500,
        status: 'PENDING',
        requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
        id: 'req-002',
        supplierId: 'sup-005',
        supplierName: 'Priya Sharma',
        amount: 1000,
        status: 'APPROVED',
        requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
];

// -----------------------------------------------------------------------------
// Leaderboard
// -----------------------------------------------------------------------------
export const getLeaderboard = (): LeaderboardEntry[] => {
    return mockSuppliers
        .filter(s => s.status === 'ACTIVE')
        .sort((a, b) => b.totalEarnings - a.totalEarnings)
        .slice(0, 3)
        .map((s, i) => ({
            rank: i + 1,
            supplierId: s.id,
            supplierName: s.name,
            profilePicture: s.profilePicture,
            totalEarnings: s.totalEarnings,
        }));
};

// -----------------------------------------------------------------------------
// Activity
// -----------------------------------------------------------------------------
export const mockRecentActivity: Activity[] = [
    {
        id: 'act-001',
        type: 'batch_submitted',
        message: 'You submitted 25 new accounts',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        id: 'act-002',
        type: 'gmail_verified',
        message: 'Admin verified 15 of your accounts',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
        id: 'act-003',
        type: 'gmail_rejected',
        message: '3 accounts were rejected',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
        id: 'act-004',
        type: 'payment_paid',
        message: 'Payment of Rs. 600 was released',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
        id: 'act-005',
        type: 'payout_requested',
        message: 'Payout request for Rs. 475 submitted',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
];

// -----------------------------------------------------------------------------
// Dashboard Data
// -----------------------------------------------------------------------------
export const mockSupplierDashboard: SupplierDashboard = {
    totalSubmitted: getGmailsBySupplierId('sup-001').length,
    pendingCount: getGmailsBySupplierId('sup-001').filter((g) => g.status === 'PENDING').length,
    verifiedCount: getGmailsBySupplierId('sup-001').filter((g) => g.status === 'VERIFIED').length,
    rejectedCount: getGmailsBySupplierId('sup-001').filter((g) => g.status === 'REJECTED').length,
    estimatedEarnings: getGmailsBySupplierId('sup-001').filter((g) => g.status === 'VERIFIED').length * 5.00,
    pendingPayoutAmount: 475,
    availableForPayout: 475,
    recentActivity: mockRecentActivity,
};

export const mockAdminDashboard: AdminDashboard = {
    pendingGmailsCount: getPendingGmails().length,
    verifiedToday: 45,
    rejectedToday: 12,
    newSuppliersToday: 2,
    totalRoughPayout: mockPayments.filter(p => p.status === 'UNPAID').reduce((sum, p) => sum + p.amount, 0),
    totalRequestedPayout: mockPayoutRequests.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0),
    totalUnpaidAmount: mockPayments
        .filter((p) => p.status === 'UNPAID')
        .reduce((sum, p) => sum + p.amount, 0),
};

// -----------------------------------------------------------------------------
// Auth tokens (mock)
// -----------------------------------------------------------------------------
export const mockTokens = {
    supplier: 'mock-supplier-token-12345',
    admin: 'mock-admin-token-67890',
};

// Current logged in user storage key
export const AUTH_STORAGE_KEY = 'mailstack_auth';

// -----------------------------------------------------------------------------
// System Settings (Quota Management)
// -----------------------------------------------------------------------------
export const mockSystemSettings: SystemSettings = {
    gmailQuota: 500,          // 500 Gmail limit (null = unlimited)
    outlookQuota: null,       // Unlimited Outlook
    gmailSubmitted: 285,      // Current Gmail count
    outlookSubmitted: 47,     // Current Outlook count
    bonusTiers: [
        { id: 'tier-1', emailsRequired: 500, bonusAmount: 500 },
        { id: 'tier-2', emailsRequired: 1000, bonusAmount: 1000 },
        { id: 'tier-3', emailsRequired: 2000, bonusAmount: 2000 },
        { id: 'tier-4', emailsRequired: 5000, bonusAmount: 5000 },
    ],
    telegramChannelUrl: 'https://t.me/mailstack_channel',
};
