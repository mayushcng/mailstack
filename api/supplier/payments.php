<?php
// =============================================================================
// SUPPLIER PAYMENTS - GET /api/supplier/payments
// Returns: PaymentsData with payment history
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

// Get payment history
$stmt = $db->prepare("
    SELECT * FROM payments 
    WHERE supplier_id = ?
    ORDER BY created_at DESC
    LIMIT 50
");
$stmt->execute([$userId]);
$payments = $stmt->fetchAll();

// Get payout history
$stmt = $db->prepare("
    SELECT * FROM payout_requests
    WHERE supplier_id = ?
    ORDER BY created_at DESC
    LIMIT 50
");
$stmt->execute([$userId]);
$payouts = $stmt->fetchAll();

// Calculate totals
$totalEarned = floatval($user['total_earnings'] ?? 0);
$unpaid = floatval($user['available_balance'] ?? 0);
$pendingPayout = $db->prepare("SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE supplier_id = ? AND status = 'pending'");
$pendingPayout->execute([$userId]);
$pending = floatval($pendingPayout->fetchColumn());

$paidOut = $db->prepare("SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE supplier_id = ? AND status = 'completed'");
$paidOut->execute([$userId]);
$paid = floatval($paidOut->fetchColumn());

sendResponse([
    'totalEarned' => $totalEarned,
    'paid' => $paid,
    'pending' => $pending,
    'unpaid' => $unpaid,
    'payments' => array_map(function ($p) {
        return [
            'id' => strval($p['id']),
            'amount' => floatval($p['amount']),
            'type' => $p['type'],
            'description' => $p['description'],
            'status' => strtoupper($p['status']),
            'createdAt' => $p['created_at']
        ];
    }, $payments),
    'payoutRequests' => array_map(function ($p) {
        return [
            'id' => strval($p['id']),
            'amount' => floatval($p['amount']),
            'status' => strtoupper($p['status']),
            'requestedAt' => $p['created_at'],
            'processedAt' => $p['processed_at']
        ];
    }, $payouts)
]);
