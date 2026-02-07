<?php
// =============================================================================
// SUPPLIER DASHBOARD - GET /api/supplier/dashboard
// Returns: SupplierDashboard type
// =============================================================================
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$user = authenticateRequest();
if (!$user || $user['role'] !== 'supplier') {
    sendError('Unauthorized', 401);
}

$db = getDB();
$userId = $user['id'];

// Get submission counts (lowercase status in DB)
$stmt = $db->prepare("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM email_submissions 
    WHERE supplier_id = ?
");
$stmt->execute([$userId]);
$counts = $stmt->fetch();

// Get pending payout amount
$pendingPayout = $db->prepare("SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE supplier_id = ? AND status = 'pending'");
$pendingPayout->execute([$userId]);
$pendingPayoutAmount = $pendingPayout->fetchColumn() ?: 0;

// Get recent activity (use email_address column, not email)
$stmt = $db->prepare("
    SELECT id, email_address, email_type, status, created_at, reviewed_at
    FROM email_submissions 
    WHERE supplier_id = ?
    ORDER BY created_at DESC
    LIMIT 5
");
$stmt->execute([$userId]);
$recentSubmissions = $stmt->fetchAll();

$recentActivity = [];
foreach ($recentSubmissions as $sub) {
    $type = 'batch_submitted';
    $message = "Submitted {$sub['email_address']}";

    if ($sub['status'] === 'verified') {
        $type = 'gmail_verified';
        $message = "{$sub['email_address']} was verified";
    } elseif ($sub['status'] === 'rejected') {
        $type = 'gmail_rejected';
        $message = "{$sub['email_address']} was rejected";
    }

    $recentActivity[] = [
        'id' => strval($sub['id']),
        'type' => $type,
        'message' => $message,
        'timestamp' => $sub['reviewed_at'] ?: $sub['created_at']
    ];
}

// Response matches SupplierDashboard type
sendResponse([
    'totalSubmitted' => intval($counts['total'] ?? 0),
    'pendingCount' => intval($counts['pending'] ?? 0),
    'verifiedCount' => intval($counts['verified'] ?? 0),
    'rejectedCount' => intval($counts['rejected'] ?? 0),
    'estimatedEarnings' => floatval($user['total_earnings'] ?? 0),
    'pendingPayoutAmount' => floatval($pendingPayoutAmount),
    'availableForPayout' => floatval($user['available_balance'] ?? 0),
    'recentActivity' => $recentActivity
]);
