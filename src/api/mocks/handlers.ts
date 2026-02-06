// =============================================================================
// MSW Request Handlers - Mock API endpoints
// =============================================================================

import { http, HttpResponse, delay } from 'msw';
import type {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    SubmitBatchRequest,
    SubmitBatchResponse,
    VerifyGmailsRequest,
    RejectGmailsRequest,
    BulkActionResponse,
    PaginatedResponse,
    Gmail,
    Supplier,
    Payment,
    PayoutRequest,
    PayoutSettings,
    SystemSettings,
    EmailType,
} from '../types';
import { MINIMUM_PAYOUT } from '../types';
import {
    mockAdmin,
    mockCurrentSupplier,
    mockSuppliers,
    mockGmails,
    mockPayments,
    mockPayoutRequests,
    mockRecentActivity,
    mockTokens,
    getLeaderboard,
    mockSystemSettings,
} from './data';

const API_BASE = '/api';

// Helper to simulate network delay
const networkDelay = () => delay(150 + Math.random() * 200);

// Helper to paginate data
function paginate<T>(data: T[], page = 1, limit = 10): PaginatedResponse<T> {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = data.slice(start, end);

    return {
        data: paginatedData,
        total: data.length,
        page,
        limit,
        totalPages: Math.ceil(data.length / limit),
    };
}

// In-memory store for mutations
let mutableGmails = [...mockGmails];
let mutablePayments = [...mockPayments];
let mutableSuppliers = [...mockSuppliers];
let mutablePayoutRequests = [...mockPayoutRequests];
let mutableSystemSettings = { ...mockSystemSettings };

export const handlers = [
    // ==========================================================================
    // Auth Endpoints
    // ==========================================================================

    // POST /auth/register
    http.post(`${API_BASE}/auth/register`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as RegisterRequest;

        // Check if email already exists
        if (mutableSuppliers.some((s) => s.email === body.email)) {
            return HttpResponse.json(
                { message: 'Email already registered' },
                { status: 400 }
            );
        }

        const newSupplier: Supplier = {
            id: `sup-${Date.now()}`,
            email: body.email,
            name: body.name,
            role: 'supplier',
            code: body.name.substring(0, 4).toUpperCase() + String(Date.now()).slice(-4),
            status: 'ACTIVE',
            rate: 4.00,
            isVip: false,
            totalEarnings: 0,
            phone: body.phone,
            city: body.city,
            country: body.country,
            occupation: body.occupation,
            dateOfBirth: body.dateOfBirth,
            profilePicture: body.profilePicture,
            createdAt: new Date().toISOString(),
        };

        mutableSuppliers.push(newSupplier);

        const response: AuthResponse = {
            user: newSupplier,
            token: mockTokens.supplier,
        };

        return HttpResponse.json(response, { status: 201 });
    }),

    // POST /auth/login
    http.post(`${API_BASE}/auth/login`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as LoginRequest;

        // Admin login
        if (body.email === 'admin@mailstack.com' && body.password === 'admin123') {
            const response: AuthResponse = {
                user: mockAdmin,
                token: mockTokens.admin,
            };
            return HttpResponse.json(response);
        }

        // Supplier login (accept any supplier email with password "password")
        const supplier = mutableSuppliers.find((s) => s.email === body.email);
        if (supplier && body.password === 'password') {
            const response: AuthResponse = {
                user: supplier,
                token: mockTokens.supplier,
            };
            return HttpResponse.json(response);
        }

        return HttpResponse.json(
            { message: 'Invalid email or password' },
            { status: 401 }
        );
    }),

    // POST /auth/logout
    http.post(`${API_BASE}/auth/logout`, async () => {
        await networkDelay();
        return HttpResponse.json({ success: true });
    }),

    // POST /auth/forgot-password
    http.post(`${API_BASE}/auth/forgot-password`, async () => {
        await networkDelay();
        return HttpResponse.json({
            message: 'If an account exists with this email, you will receive a password reset link.'
        });
    }),

    // POST /auth/reset-password
    http.post(`${API_BASE}/auth/reset-password`, async () => {
        await networkDelay();
        return HttpResponse.json({
            message: 'Password has been reset successfully.'
        });
    }),

    // ==========================================================================
    // Supplier Endpoints
    // ==========================================================================

    // GET /supplier/me
    http.get(`${API_BASE}/supplier/me`, async () => {
        await networkDelay();
        return HttpResponse.json(mockCurrentSupplier);
    }),

    // PATCH /supplier/payout-settings
    http.patch(`${API_BASE}/supplier/payout-settings`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as PayoutSettings;

        // Update the current supplier's payout settings
        const supplier = mutableSuppliers.find(s => s.id === mockCurrentSupplier.id);
        if (supplier) {
            supplier.payoutSettings = { ...supplier.payoutSettings, ...body };
        }

        return HttpResponse.json({ success: true, payoutSettings: supplier?.payoutSettings });
    }),

    // GET /supplier/dashboard
    http.get(`${API_BASE}/supplier/dashboard`, async () => {
        await networkDelay();

        const supplierGmails = mutableGmails.filter((g) => g.supplierId === mockCurrentSupplier.id);
        const verifiedCount = supplierGmails.filter((g) => g.status === 'VERIFIED').length;
        const unpaidPayments = mutablePayments
            .filter(p => p.supplierId === mockCurrentSupplier.id && p.status === 'UNPAID')
            .reduce((sum, p) => sum + p.amount, 0);

        const dashboard = {
            totalSubmitted: supplierGmails.length,
            pendingCount: supplierGmails.filter((g) => g.status === 'PENDING').length,
            verifiedCount,
            rejectedCount: supplierGmails.filter((g) => g.status === 'REJECTED').length,
            estimatedEarnings: verifiedCount * mockCurrentSupplier.rate,
            pendingPayoutAmount: unpaidPayments,
            availableForPayout: unpaidPayments,
            recentActivity: mockRecentActivity,
        };

        return HttpResponse.json(dashboard);
    }),

    // GET /supplier/leaderboard
    http.get(`${API_BASE}/supplier/leaderboard`, async () => {
        await networkDelay();
        return HttpResponse.json(getLeaderboard());
    }),

    // POST /supplier/submit
    http.post(`${API_BASE}/supplier/submit`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as SubmitBatchRequest;

        const existingEmails = new Set(mutableGmails.map((g) => g.email.toLowerCase()));
        let acceptedNew = 0;
        let duplicateRejected = 0;
        let invalidRejected = 0;
        const duplicates: string[] = [];

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        for (const entry of body.entries) {
            const trimmedEmail = entry.email.trim().toLowerCase();

            if (!emailRegex.test(trimmedEmail)) {
                invalidRejected++;
                continue;
            }

            if (existingEmails.has(trimmedEmail)) {
                duplicateRejected++;
                duplicates.push(trimmedEmail);
                continue;
            }

            // Add new gmail
            const newGmail: Gmail = {
                id: `gmail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                email: trimmedEmail,
                password: entry.password,
                emailType: entry.emailType,
                status: 'PENDING',
                submittedAt: new Date().toISOString(),
                supplierId: mockCurrentSupplier.id,
                supplierName: mockCurrentSupplier.name,
                supplierCode: mockCurrentSupplier.code,
            };

            mutableGmails.unshift(newGmail);
            existingEmails.add(trimmedEmail);
            acceptedNew++;
        }

        const response: SubmitBatchResponse = {
            batchId: `batch-${Date.now()}`,
            acceptedNew,
            duplicateRejected,
            invalidRejected,
            duplicates,
        };

        return HttpResponse.json(response, { status: 201 });
    }),

    // GET /supplier/gmails
    http.get(`${API_BASE}/supplier/gmails`, async ({ request }) => {
        await networkDelay();
        const url = new URL(request.url);
        const status = url.searchParams.get('status') as Gmail['status'] | null;
        const emailType = url.searchParams.get('emailType') as EmailType | null;
        const q = url.searchParams.get('q') || '';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');

        let filtered = mutableGmails.filter((g) => g.supplierId === mockCurrentSupplier.id);

        if (status) {
            filtered = filtered.filter((g) => g.status === status);
        }

        if (emailType) {
            filtered = filtered.filter((g) => g.emailType === emailType);
        }

        if (q) {
            const query = q.toLowerCase();
            filtered = filtered.filter((g) => g.email.toLowerCase().includes(query));
        }

        // Sort by submitted date descending
        filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

        return HttpResponse.json(paginate(filtered, page, limit));
    }),

    // GET /supplier/payments
    http.get(`${API_BASE}/supplier/payments`, async () => {
        await networkDelay();
        const supplierPayments = mutablePayments.filter(
            (p) => p.supplierId === mockCurrentSupplier.id
        );

        const earned = supplierPayments.reduce((sum, p) => sum + p.amount, 0);
        const paid = supplierPayments
            .filter((p) => p.status === 'PAID')
            .reduce((sum, p) => sum + p.amount, 0);
        const unpaid = earned - paid;

        // Get pending payout requests
        const pendingRequests = mutablePayoutRequests.filter(
            r => r.supplierId === mockCurrentSupplier.id && r.status === 'PENDING'
        );

        return HttpResponse.json({
            earned,
            paid,
            unpaid,
            pendingRequest: pendingRequests[0] || null,
            payments: supplierPayments,
        });
    }),

    // POST /supplier/request-payout
    http.post(`${API_BASE}/supplier/request-payout`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as { amount: number };

        if (body.amount < MINIMUM_PAYOUT) {
            return HttpResponse.json(
                { message: `Minimum payout amount is Rs. ${MINIMUM_PAYOUT}` },
                { status: 400 }
            );
        }

        const newRequest: PayoutRequest = {
            id: `req-${Date.now()}`,
            supplierId: mockCurrentSupplier.id,
            supplierName: mockCurrentSupplier.name,
            amount: body.amount,
            status: 'PENDING',
            requestedAt: new Date().toISOString(),
        };

        mutablePayoutRequests.unshift(newRequest);

        return HttpResponse.json(newRequest, { status: 201 });
    }),

    // ==========================================================================
    // Admin Endpoints
    // ==========================================================================

    // GET /admin/dashboard
    http.get(`${API_BASE}/admin/dashboard`, async () => {
        await networkDelay();

        const today = new Date().toDateString();
        const dashboard = {
            pendingGmailsCount: mutableGmails.filter((g) => g.status === 'PENDING').length,
            verifiedToday: mutableGmails.filter(
                (g) => g.status === 'VERIFIED' && g.verifiedAt && new Date(g.verifiedAt).toDateString() === today
            ).length,
            rejectedToday: mutableGmails.filter(
                (g) => g.status === 'REJECTED' && g.rejectedAt && new Date(g.rejectedAt).toDateString() === today
            ).length,
            newSuppliersToday: mutableSuppliers.filter(
                (s) => new Date(s.createdAt).toDateString() === today
            ).length,
            totalRoughPayout: mutablePayments
                .filter((p) => p.status === 'UNPAID')
                .reduce((sum, p) => sum + p.amount, 0),
            totalRequestedPayout: mutablePayoutRequests
                .filter((r) => r.status === 'PENDING')
                .reduce((sum, r) => sum + r.amount, 0),
            totalUnpaidAmount: mutablePayments
                .filter((p) => p.status === 'UNPAID')
                .reduce((sum, p) => sum + p.amount, 0),
        };

        return HttpResponse.json(dashboard);
    }),

    // GET /admin/gmails
    http.get(`${API_BASE}/admin/gmails`, async ({ request }) => {
        await networkDelay();
        const url = new URL(request.url);
        const status = url.searchParams.get('status') as Gmail['status'] | null;
        const emailType = url.searchParams.get('emailType') as EmailType | null;
        const supplierId = url.searchParams.get('supplierId');
        const q = url.searchParams.get('q') || '';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');

        let filtered = [...mutableGmails];

        if (status) {
            filtered = filtered.filter((g) => g.status === status);
        }

        if (emailType) {
            filtered = filtered.filter((g) => g.emailType === emailType);
        }

        if (supplierId) {
            filtered = filtered.filter((g) => g.supplierId === supplierId);
        }

        if (q) {
            const query = q.toLowerCase();
            filtered = filtered.filter(
                (g) =>
                    g.email.toLowerCase().includes(query) ||
                    g.supplierName?.toLowerCase().includes(query) ||
                    g.supplierCode?.toLowerCase().includes(query)
            );
        }

        // Sort by submitted date descending
        filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

        return HttpResponse.json(paginate(filtered, page, limit));
    }),

    // POST /admin/gmails/verify
    http.post(`${API_BASE}/admin/gmails/verify`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as VerifyGmailsRequest;

        let processed = 0;
        const now = new Date().toISOString();

        for (const id of body.gmailIds) {
            const gmail = mutableGmails.find((g) => g.id === id);
            if (gmail && gmail.status === 'PENDING') {
                gmail.status = 'VERIFIED';
                gmail.verifiedAt = now;
                processed++;
            }
        }

        const response: BulkActionResponse = {
            success: true,
            processed,
        };

        return HttpResponse.json(response);
    }),

    // POST /admin/gmails/reject
    http.post(`${API_BASE}/admin/gmails/reject`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as RejectGmailsRequest;

        let processed = 0;
        const now = new Date().toISOString();

        for (const id of body.gmailIds) {
            const gmail = mutableGmails.find((g) => g.id === id);
            if (gmail && gmail.status === 'PENDING') {
                gmail.status = 'REJECTED';
                gmail.remark = body.remark;
                gmail.rejectedAt = now;
                processed++;
            }
        }

        const response: BulkActionResponse = {
            success: true,
            processed,
        };

        return HttpResponse.json(response);
    }),

    // POST /admin/gmails/maintenance - Mark emails for maintenance
    http.post(`${API_BASE}/admin/gmails/maintenance`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as { gmailIds: string[]; reason: string };

        let processed = 0;
        const now = new Date().toISOString();

        for (const id of body.gmailIds) {
            const gmail = mutableGmails.find((g) => g.id === id);
            if (gmail && gmail.status === 'PENDING') {
                gmail.status = 'MAINTENANCE';
                gmail.maintenanceAt = now;
                gmail.maintenanceReason = body.reason;
                processed++;
            }
        }

        const response: BulkActionResponse = {
            success: true,
            processed,
        };

        return HttpResponse.json(response);
    }),

    // GET /admin/suppliers
    http.get(`${API_BASE}/admin/suppliers`, async ({ request }) => {
        await networkDelay();
        const url = new URL(request.url);
        const status = url.searchParams.get('status') as Supplier['status'] | null;
        const q = url.searchParams.get('q') || '';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');

        let filtered = [...mutableSuppliers];

        if (status) {
            filtered = filtered.filter((s) => s.status === status);
        }

        if (q) {
            const query = q.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s.name.toLowerCase().includes(query) ||
                    s.email.toLowerCase().includes(query) ||
                    s.code.toLowerCase().includes(query)
            );
        }

        // Add computed stats
        const suppliersWithStats = filtered.map((s) => {
            const gmails = mutableGmails.filter((g) => g.supplierId === s.id);
            const payments = mutablePayments.filter((p) => p.supplierId === s.id);

            return {
                ...s,
                verifiedCount: gmails.filter((g) => g.status === 'VERIFIED').length,
                pendingCount: gmails.filter((g) => g.status === 'PENDING').length,
                unpaidAmount: payments
                    .filter((p) => p.status === 'UNPAID')
                    .reduce((sum, p) => sum + p.amount, 0),
            };
        });

        return HttpResponse.json(paginate(suppliersWithStats, page, limit));
    }),

    // GET /admin/suppliers/:id
    http.get(`${API_BASE}/admin/suppliers/:id`, async ({ params }) => {
        await networkDelay();
        const { id } = params;

        const supplier = mutableSuppliers.find((s) => s.id === id);
        if (!supplier) {
            return HttpResponse.json({ message: 'Supplier not found' }, { status: 404 });
        }

        const gmails = mutableGmails.filter((g) => g.supplierId === id);
        const payments = mutablePayments.filter((p) => p.supplierId === id);

        const stats = {
            supplier,
            totalSubmitted: gmails.length,
            verifiedCount: gmails.filter((g) => g.status === 'VERIFIED').length,
            pendingCount: gmails.filter((g) => g.status === 'PENDING').length,
            rejectedCount: gmails.filter((g) => g.status === 'REJECTED').length,
            unpaidAmount: payments
                .filter((p) => p.status === 'UNPAID')
                .reduce((sum, p) => sum + p.amount, 0),
        };

        return HttpResponse.json(stats);
    }),

    // PATCH /admin/suppliers/:id
    http.patch(`${API_BASE}/admin/suppliers/:id`, async ({ params, request }) => {
        await networkDelay();
        const { id } = params;
        const body = await request.json() as Partial<Supplier>;

        const supplier = mutableSuppliers.find((s) => s.id === id);
        if (!supplier) {
            return HttpResponse.json({ message: 'Supplier not found' }, { status: 404 });
        }

        // Update allowed fields
        if (body.rate !== undefined) supplier.rate = body.rate;
        if (body.code !== undefined) supplier.code = body.code;
        if (body.payoutSettings !== undefined) supplier.payoutSettings = body.payoutSettings;
        if (body.isVip !== undefined) supplier.isVip = body.isVip;
        if (body.status !== undefined) supplier.status = body.status;
        if (body.bonusAmount !== undefined) supplier.bonusAmount = body.bonusAmount;
        if (body.bonusThreshold !== undefined) supplier.bonusThreshold = body.bonusThreshold;

        return HttpResponse.json(supplier);
    }),

    // GET /admin/payments
    http.get(`${API_BASE}/admin/payments`, async ({ request }) => {
        await networkDelay();
        const url = new URL(request.url);
        const status = url.searchParams.get('status') as Payment['status'] | null;
        const supplierId = url.searchParams.get('supplierId');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');

        let filtered = [...mutablePayments];

        if (status) {
            filtered = filtered.filter((p) => p.status === status);
        }

        if (supplierId) {
            filtered = filtered.filter((p) => p.supplierId === supplierId);
        }

        // Sort by created date descending
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return HttpResponse.json(paginate(filtered, page, limit));
    }),

    // GET /admin/payout-requests
    http.get(`${API_BASE}/admin/payout-requests`, async ({ request }) => {
        await networkDelay();
        const url = new URL(request.url);
        const status = url.searchParams.get('status') as PayoutRequest['status'] | null;
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');

        let filtered = [...mutablePayoutRequests];

        if (status) {
            filtered = filtered.filter((r) => r.status === status);
        }

        filtered.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

        return HttpResponse.json(paginate(filtered, page, limit));
    }),

    // POST /admin/payout-requests/:id/approve
    http.post(`${API_BASE}/admin/payout-requests/:id/approve`, async ({ params }) => {
        await networkDelay();
        const { id } = params;

        const request = mutablePayoutRequests.find((r) => r.id === id);
        if (!request) {
            return HttpResponse.json({ message: 'Request not found' }, { status: 404 });
        }

        request.status = 'APPROVED';
        request.approvedAt = new Date().toISOString();

        return HttpResponse.json(request);
    }),

    // POST /admin/payout-requests/:id/pay
    http.post(`${API_BASE}/admin/payout-requests/:id/pay`, async ({ params }) => {
        await networkDelay();
        const { id } = params;

        const request = mutablePayoutRequests.find((r) => r.id === id);
        if (!request) {
            return HttpResponse.json({ message: 'Request not found' }, { status: 404 });
        }

        request.status = 'PAID';
        request.paidAt = new Date().toISOString();

        return HttpResponse.json(request);
    }),

    // POST /admin/payments/create
    http.post(`${API_BASE}/admin/payments/create`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as { supplierId: string; periodStart: string; periodEnd: string };

        const supplier = mutableSuppliers.find((s) => s.id === body.supplierId);
        if (!supplier) {
            return HttpResponse.json({ message: 'Supplier not found' }, { status: 404 });
        }

        // Count verified gmails in period
        const verifiedInPeriod = mutableGmails.filter(
            (g) =>
                g.supplierId === body.supplierId &&
                g.status === 'VERIFIED' &&
                g.verifiedAt &&
                new Date(g.verifiedAt) >= new Date(body.periodStart) &&
                new Date(g.verifiedAt) <= new Date(body.periodEnd)
        ).length;

        const newPayment: Payment = {
            id: `pay-${Date.now()}`,
            supplierId: body.supplierId,
            supplierName: supplier.name,
            period: `${new Date(body.periodStart).toLocaleDateString('en-IN')} - ${new Date(body.periodEnd).toLocaleDateString('en-IN')}`,
            snapshotDate: new Date().toISOString(),
            verifiedCount: verifiedInPeriod,
            rate: supplier.rate,
            amount: verifiedInPeriod * supplier.rate,
            status: 'UNPAID',
            createdAt: new Date().toISOString(),
        };

        mutablePayments.unshift(newPayment);

        return HttpResponse.json(newPayment, { status: 201 });
    }),

    // POST /admin/payments/:id/mark-paid
    http.post(`${API_BASE}/admin/payments/:id/mark-paid`, async ({ params }) => {
        await networkDelay();
        const { id } = params;

        const payment = mutablePayments.find((p) => p.id === id);
        if (!payment) {
            return HttpResponse.json({ message: 'Payment not found' }, { status: 404 });
        }

        payment.status = 'PAID';
        payment.paidAt = new Date().toISOString();

        return HttpResponse.json(payment);
    }),

    // ==========================================================================
    // System Settings Endpoints
    // ==========================================================================

    // GET /supplier/system-settings (read-only for suppliers)
    http.get(`${API_BASE}/supplier/system-settings`, async () => {
        await networkDelay();
        return HttpResponse.json(mutableSystemSettings);
    }),

    // GET /admin/settings
    http.get(`${API_BASE}/admin/settings`, async () => {
        await networkDelay();
        return HttpResponse.json(mutableSystemSettings);
    }),

    // PATCH /admin/settings
    http.patch(`${API_BASE}/admin/settings`, async ({ request }) => {
        await networkDelay();
        const body = await request.json() as Partial<SystemSettings>;

        if (body.gmailQuota !== undefined) mutableSystemSettings.gmailQuota = body.gmailQuota;
        if (body.outlookQuota !== undefined) mutableSystemSettings.outlookQuota = body.outlookQuota;
        if (body.bonusTiers !== undefined) mutableSystemSettings.bonusTiers = body.bonusTiers;
        if (body.telegramChannelUrl !== undefined) mutableSystemSettings.telegramChannelUrl = body.telegramChannelUrl;

        return HttpResponse.json(mutableSystemSettings);
    }),
];

