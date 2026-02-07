<?php
// =============================================================================
// ADMIN PAYOUTS - GET/POST /api/admin/payouts (or payout-requests)
// =============================================================================
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email.php';

$user = authenticateRequest();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 401);
}

$db = getDB();
$uri = $_SERVER['REQUEST_URI'];

// POST - Approve or pay payout request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // /admin/payout-requests/123/approve
    if (preg_match('/\/payout-requests\/(\d+)\/approve/', $uri, $matches)) {
        $id = intval($matches[1]);
        $stmt = $db->prepare("UPDATE payout_requests SET status = 'approved', processed_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['success' => true, 'message' => 'Payout approved']);
    }

    // /admin/payout-requests/123/pay
    if (preg_match('/\/payout-requests\/(\d+)\/pay/', $uri, $matches)) {
        $id = intval($matches[1]);

        // Get payout details with supplier info
        $payout = $db->prepare("
            SELECT pr.*, u.name, u.email 
            FROM payout_requests pr 
            JOIN users u ON pr.supplier_id = u.id 
            WHERE pr.id = ?
        ");
        $payout->execute([$id]);
        $payoutData = $payout->fetch();

        if ($payoutData) {
            // Deduct from user's available balance
            $db->prepare("UPDATE users SET available_balance = available_balance - ? WHERE id = ?")
                ->execute([$payoutData['amount'], $payoutData['supplier_id']]);

            // Update payout status
            $stmt = $db->prepare("UPDATE payout_requests SET status = 'completed', processed_at = NOW() WHERE id = ?");
            $stmt->execute([$id]);

            // Send email notification
            sendPayoutProcessedEmail(
                $payoutData['email'],
                $payoutData['name'],
                $payoutData['amount'],
                $payoutData['payment_method'] ?? 'Bank Transfer'
            );
        }

        sendResponse(['success' => true, 'message' => 'Payout marked as paid']);
    }

    sendError('Invalid action', 400);
}

// GET - List payout requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $status = isset($_GET['status']) ? strtolower($_GET['status']) : null;

    $where = "WHERE 1=1";
    $params = [];

    if ($status) {
        $where .= " AND pr.status = ?";
        $params[] = $status;
    }

    $countStmt = $db->prepare("SELECT COUNT(*) FROM payout_requests pr $where");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    $stmt = $db->prepare("
        SELECT pr.*, u.name as supplier_name, u.email as supplier_email,
               ps.payment_method, ps.esewa_id, ps.khalti_id, ps.bank_name, ps.bank_account_number
        FROM payout_requests pr
        JOIN users u ON pr.supplier_id = u.id
        LEFT JOIN payout_settings ps ON pr.supplier_id = ps.supplier_id
        $where
        ORDER BY pr.created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $data = array_map(function ($p) {
        return [
            'id' => strval($p['id']),
            'supplierId' => strval($p['supplier_id']),
            'supplierName' => $p['supplier_name'],
            'supplierEmail' => $p['supplier_email'],
            'amount' => floatval($p['amount']),
            'status' => strtoupper($p['status']),
            'paymentMethod' => $p['payment_method'],
            'paymentDetails' => json_encode([
                'esewa_id' => $p['esewa_id'],
                'khalti_id' => $p['khalti_id'],
                'bank_name' => $p['bank_name'],
                'bank_account' => $p['bank_account_number']
            ]),
            'requestedAt' => $p['created_at'],
            'approvedAt' => $p['status'] !== 'pending' ? $p['processed_at'] : null,
            'paidAt' => $p['status'] === 'completed' ? $p['processed_at'] : null
        ];
    }, $rows);

    sendPaginatedResponse($data, $total, $page, $limit);
}

sendError('Method not allowed', 405);
