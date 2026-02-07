<?php
// =============================================================================
// SUPPLIER PAYOUT - POST /api/supplier/payout or /api/supplier/request-payout
// Creates a payout request
// =============================================================================
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = authenticateRequest();
if (!$user || $user['role'] !== 'supplier') {
    sendError('Unauthorized', 401);
}

$db = getDB();
$userId = $user['id'];
$input = getInput();

$amount = floatval($input['amount'] ?? 0);
if ($amount <= 0) {
    sendError('Invalid amount', 400);
}

// Check minimum payout
$minPayout = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'min_payout'")->fetchColumn() ?: 300;
if ($amount < $minPayout) {
    sendError("Minimum payout is Rs. $minPayout", 400);
}

// Check available balance
if ($amount > floatval($user['available_balance'])) {
    sendError('Insufficient balance', 400);
}

// Check if already has pending payout
$pending = $db->prepare("SELECT COUNT(*) FROM payout_requests WHERE supplier_id = ? AND status = 'pending'");
$pending->execute([$userId]);
if ($pending->fetchColumn() > 0) {
    sendError('You already have a pending payout request', 400);
}

// Get payment settings
$ps = $db->prepare("SELECT * FROM payout_settings WHERE supplier_id = ?");
$ps->execute([$userId]);
$payoutSettings = $ps->fetch();

if (!$payoutSettings) {
    sendError('Please set up your payment method first', 400);
}

// Create payout request
$stmt = $db->prepare("
    INSERT INTO payout_requests (supplier_id, amount, payment_method, payment_details, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', NOW())
");
$stmt->execute([
    $userId,
    $amount,
    $payoutSettings['payment_method'],
    json_encode($payoutSettings)
]);

sendResponse([
    'success' => true,
    'message' => 'Payout request submitted successfully',
    'requestId' => strval($db->lastInsertId())
], 201);
