// =============================================================================
// API Types - All entity and request/response types
// =============================================================================

// -----------------------------------------------------------------------------
// User & Auth Types
// -----------------------------------------------------------------------------
export type UserRole = 'supplier' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePicture?: string;
  phone?: string;
  city?: string;
  country?: string;
  dateOfBirth?: string;
  occupation?: string;
  createdAt: string;
}

export interface PayoutSettings {
  qrCodeUrl?: string;
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
}

// Nepal Payment Methods
export type PaymentMethod = 'esewa' | 'khalti' | 'bank_transfer';

export interface NepalPayoutSettings {
  method: PaymentMethod;
  // eSewa/Khalti fields
  walletId?: string;
  walletName?: string;
  walletQrUrl?: string;
  // Bank Transfer fields
  bankName?: string;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankQrUrl?: string;
}

export interface Supplier extends User {
  role: 'supplier';
  code: string;
  status: 'ACTIVE' | 'PENDING' | 'DISABLED';
  rate: number;
  payoutSettings?: PayoutSettings;
  nepalPayoutSettings?: NepalPayoutSettings;
  isVip: boolean;
  totalEarnings: number;
  // Bonus & quota tracking
  bonusAmount?: number;        // Bonus Rs. amount (set by admin)
  bonusThreshold?: number;     // Emails needed for bonus (set by admin)
  submittedCount?: number;     // Current submitted emails count
}

export interface Admin extends User {
  role: 'admin';
}

// Auth Requests
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  dateOfBirth?: string;
  occupation?: string;
  phone?: string;
  city?: string;
  country?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Auth Responses
export interface AuthResponse {
  user: User;
  token: string;
}

// -----------------------------------------------------------------------------
// Gmail Types
// -----------------------------------------------------------------------------
export type GmailStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'MAINTENANCE';
export type EmailType = 'gmail' | 'outlook';

export interface Gmail {
  id: string;
  email: string;
  password: string; // Visible to admin for login verification
  emailType: EmailType;
  status: GmailStatus;
  remark?: string;
  submittedAt: string;
  verifiedAt?: string;
  rejectedAt?: string;
  maintenanceAt?: string; // When email was flagged for maintenance
  maintenanceReason?: string;
  supplierId: string;
  supplierName?: string;
  supplierCode?: string;
}

// Submit batch - flexible format support
export interface EmailEntry {
  email: string;
  password: string;
  emailType: EmailType;
}

export interface SubmitBatchRequest {
  entries: EmailEntry[];
}

export interface SubmitBatchResponse {
  batchId: string;
  acceptedNew: number;
  duplicateRejected: number;
  invalidRejected: number;
  duplicates: string[];  // List of duplicate email addresses
}

// Admin verify/reject
export interface VerifyGmailsRequest {
  gmailIds: string[];
}

export interface RejectGmailsRequest {
  gmailIds: string[];
  remark: string;
}

export interface BulkActionResponse {
  success: boolean;
  processed: number;
}

// -----------------------------------------------------------------------------
// Payment Types
// -----------------------------------------------------------------------------
export type PaymentStatus = 'UNPAID' | 'PAID';
export type PayoutRequestStatus = 'PENDING' | 'APPROVED' | 'PAID';

export interface Payment {
  id: string;
  supplierId: string;
  supplierName?: string;
  period: string;
  snapshotDate: string;
  verifiedCount: number;
  rate: number;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  supplierId: string;
  supplierName?: string;
  amount: number;
  status: PayoutRequestStatus;
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
}

export const MINIMUM_PAYOUT = 300; // Rs. 300 minimum

export interface CreatePaymentSnapshotRequest {
  supplierId: string;
  periodStart: string;
  periodEnd: string;
}

export interface RequestPayoutRequest {
  amount: number;
}

// -----------------------------------------------------------------------------
// System Settings (Admin configurable)
// -----------------------------------------------------------------------------

// Bonus tier configuration (e.g., 500 mails = Rs. 500 bonus + Netflix 1 month)
export interface BonusTier {
  id: string;
  emailsRequired: number;
  bonusAmount: number;
  // Optional reward fields
  rewardType?: 'money' | 'netflix' | 'prime' | 'spotify' | 'custom';
  rewardName?: string;      // e.g., "Netflix Premium", "Prime Video"
  rewardDuration?: string;  // e.g., "1 month", "6 months"
}

export interface SystemSettings {
  gmailQuota: number | null;      // null = unlimited
  outlookQuota: number | null;    // null = unlimited
  gmailSubmitted: number;         // Current total submitted
  outlookSubmitted: number;       // Current total submitted
  bonusTiers: BonusTier[];        // Multi-tier bonus configuration
  telegramChannelUrl?: string;    // Telegram channel link for suppliers
}

// -----------------------------------------------------------------------------
// Dashboard Types
// -----------------------------------------------------------------------------
export interface SupplierDashboard {
  totalSubmitted: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  estimatedEarnings: number;
  pendingPayoutAmount: number;
  availableForPayout: number;
  recentActivity: Activity[];
}

export interface AdminDashboard {
  pendingGmailsCount: number;
  verifiedToday: number;
  rejectedToday: number;
  newSuppliersToday: number;
  totalRoughPayout: number;   // Estimated total needed
  totalRequestedPayout: number; // Total payout requests
  totalUnpaidAmount: number;
}

export interface Activity {
  id: string;
  type: 'batch_submitted' | 'gmail_verified' | 'gmail_rejected' | 'payment_paid' | 'supplier_registered' | 'payout_requested';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Leaderboard Types
// -----------------------------------------------------------------------------
export interface LeaderboardEntry {
  rank: number;
  supplierId: string;
  supplierName: string;
  profilePicture?: string;
  totalEarnings: number;
}

// -----------------------------------------------------------------------------
// Pagination Types
// -----------------------------------------------------------------------------
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Gmail list filters
export interface GmailFilters extends PaginationParams {
  status?: GmailStatus;
  emailType?: EmailType;
  q?: string;
  supplierId?: string;
}

// Supplier list filters
export interface SupplierFilters extends PaginationParams {
  status?: Supplier['status'];
  q?: string;
}

// -----------------------------------------------------------------------------
// Admin Supplier Management
// -----------------------------------------------------------------------------
export interface UpdateSupplierRequest {
  rate?: number;
  code?: string;
  payoutSettings?: PayoutSettings;
  isVip?: boolean;
  status?: Supplier['status'];
}

export interface SupplierStats {
  supplier: Supplier;
  totalSubmitted: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  unpaidAmount: number;
}

// -----------------------------------------------------------------------------
// API Error
// -----------------------------------------------------------------------------
export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// -----------------------------------------------------------------------------
// Common rejection remarks
// -----------------------------------------------------------------------------
export const REJECTION_REMARKS = [
  'Invalid credentials',
  'Account suspended',
  'Duplicate account',
  'Phone verification required',
  'Recovery email invalid',
  'Account compromised',
  'Other (specify below)',
] as const;

export type RejectionRemark = (typeof REJECTION_REMARKS)[number];
