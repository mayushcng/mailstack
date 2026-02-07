<?php
// =============================================================================
// ADMIN DASHBOARD - GET /api/admin/dashboard
// Returns: AdminDashboard type matching frontend exactly
// =============================================================================
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$user = authenticateRequest();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 401);
}

$db = getDB();

// All queries use lowercase status values to match database schema
$pendingGmailsCount = $db->query("SELECT COUNT(*) FROM email_submissions WHERE status = 'pending'")->fetchColumn() ?: 0;
$verifiedToday = $db->query("SELECT COUNT(*) FROM email_submissions WHERE status = 'verified' AND DATE(reviewed_at) = CURDATE()")->fetchColumn() ?: 0;
$rejectedToday = $db->query("SELECT COUNT(*) FROM email_submissions WHERE status = 'rejected' AND DATE(reviewed_at) = CURDATE()")->fetchColumn() ?: 0;
$newSuppliersToday = $db->query("SELECT COUNT(*) FROM users WHERE role = 'supplier' AND DATE(created_at) = CURDATE()")->fetchColumn() ?: 0;

// Financial data
$totalRoughPayout = $db->query("SELECT COALESCE(SUM(available_balance), 0) FROM users WHERE role = 'supplier'")->fetchColumn() ?: 0;
$totalRequestedPayout = $db->query("SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status = 'pending'")->fetchColumn() ?: 0;
$totalUnpaidAmount = $db->query("SELECT COALESCE(SUM(available_balance), 0) FROM users WHERE role = 'supplier'")->fetchColumn() ?: 0;

// Response matches AdminDashboard type exactly
sendResponse([
    'pendingGmailsCount' => intval($pendingGmailsCount),
    'verifiedToday' => intval($verifiedToday),
    'rejectedToday' => intval($rejectedToday),
    'newSuppliersToday' => intval($newSuppliersToday),
    'totalRoughPayout' => floatval($totalRoughPayout),
    'totalRequestedPayout' => floatval($totalRequestedPayout),
    'totalUnpaidAmount' => floatval($totalUnpaidAmount)
]);
