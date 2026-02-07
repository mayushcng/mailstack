<?php
// =============================================================================
// ADMIN PAYMENTS - GET/POST /api/admin/payments
// =============================================================================
require_once __DIR__ . '/../config/database.php';

$user = authenticateRequest();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 401);
}

$db = getDB();
$uri = $_SERVER['REQUEST_URI'];

// POST - Mark payment as paid
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (preg_match('/\/payments\/(\d+)\/mark-paid/', $uri, $matches)) {
        $id = intval($matches[1]);
        $stmt = $db->prepare("UPDATE payments SET status = 'completed', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['success' => true, 'message' => 'Payment marked as paid']);
    }
    sendError('Invalid action', 400);
}

// GET - List payments
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $countStmt = $db->query("SELECT COUNT(*) FROM payments");
    $total = $countStmt->fetchColumn();

    $stmt = $db->prepare("
        SELECT p.*, u.name as supplier_name 
        FROM payments p
        JOIN users u ON p.supplier_id = u.id
        ORDER BY p.created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $data = array_map(function ($p) {
        return [
            'id' => strval($p['id']),
            'supplierId' => strval($p['supplier_id']),
            'supplierName' => $p['supplier_name'],
            'amount' => floatval($p['amount']),
            'status' => strtoupper($p['status']),
            'period' => $p['description'] ?? '',
            'snapshotDate' => $p['created_at'],
            'verifiedCount' => 0,
            'rate' => 0,
            'paidAt' => $p['status'] === 'completed' ? $p['created_at'] : null,
            'createdAt' => $p['created_at']
        ];
    }, $rows);

    sendPaginatedResponse($data, $total, $page, $limit);
}

sendError('Method not allowed', 405);
