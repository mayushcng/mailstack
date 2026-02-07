<?php
// =============================================================================
// ADMIN REGISTRATIONS - GET/PUT /api/admin/registrations
// GET: List pending supplier registrations
// PUT: Approve/Reject supplier registration
// =============================================================================
require_once __DIR__ . '/../config/database.php';

$user = authenticateRequest();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 401);
}

$db = getDB();
$uri = $_SERVER['REQUEST_URI'];

// =============================================================================
// PUT - Approve or Reject registration
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = getInput();

    // Check if URL contains ID like /registrations/123
    preg_match('/\/registrations\/(\d+)/', $uri, $matches);
    $id = $matches[1] ?? intval($input['id'] ?? 0);

    if (!$id) {
        sendError('User ID required', 400);
    }

    $action = $input['action'] ?? $input['status'] ?? null;

    // Handle approve/reject actions
    if ($action === 'approve' || $action === 'approved') {
        $stmt = $db->prepare("UPDATE users SET status = 'approved' WHERE id = ? AND role = 'supplier'");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            sendError('User not found', 404);
        }

        sendResponse(['success' => true, 'message' => 'Supplier approved successfully']);
    }

    if ($action === 'reject' || $action === 'rejected') {
        $reason = $input['reason'] ?? 'Application rejected';
        $stmt = $db->prepare("UPDATE users SET status = 'rejected' WHERE id = ? AND role = 'supplier'");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            sendError('User not found', 404);
        }

        sendResponse(['success' => true, 'message' => 'Supplier rejected']);
    }

    // Handle direct status update
    if ($action) {
        $validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
        $status = strtolower($action);
        if (!in_array($status, $validStatuses)) {
            sendError('Invalid status', 400);
        }

        $stmt = $db->prepare("UPDATE users SET status = ? WHERE id = ? AND role = 'supplier'");
        $stmt->execute([$status, $id]);

        sendResponse(['success' => true, 'message' => 'Status updated']);
    }

    sendError('Action required (approve/reject)', 400);
}

// =============================================================================
// POST - Alternative way to approve/reject (for flexibility)
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getInput();

    preg_match('/\/registrations\/(\d+)\/(approve|reject)/', $uri, $matches);
    $id = $matches[1] ?? 0;
    $action = $matches[2] ?? null;

    if (!$id) {
        $id = intval($input['id'] ?? 0);
        $action = $input['action'] ?? null;
    }

    if (!$id) {
        sendError('User ID required', 400);
    }

    if ($action === 'approve') {
        $db->prepare("UPDATE users SET status = 'approved' WHERE id = ? AND role = 'supplier'")->execute([$id]);
        sendResponse(['success' => true, 'message' => 'Supplier approved']);
    }

    if ($action === 'reject') {
        $db->prepare("UPDATE users SET status = 'rejected' WHERE id = ? AND role = 'supplier'")->execute([$id]);
        sendResponse(['success' => true, 'message' => 'Supplier rejected']);
    }

    sendError('Invalid action', 400);
}

// =============================================================================
// GET - List pending registrations
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $status = strtolower($_GET['status'] ?? 'pending');

    // Count
    $countStmt = $db->prepare("SELECT COUNT(*) FROM users WHERE role = 'supplier' AND status = ?");
    $countStmt->execute([$status]);
    $total = $countStmt->fetchColumn();

    // Fetch
    $stmt = $db->prepare("
        SELECT * FROM users 
        WHERE role = 'supplier' AND status = ?
        ORDER BY created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute([$status]);
    $rows = $stmt->fetchAll();

    $data = array_map(function ($s) {
        return [
            'id' => strval($s['id']),
            'email' => $s['email'],
            'name' => $s['name'],
            'code' => 'SUP' . str_pad($s['id'], 4, '0', STR_PAD_LEFT),
            'phone' => $s['phone'],
            'profilePicture' => $s['profile_picture'],
            'dateOfBirth' => $s['date_of_birth'],
            'status' => strtoupper($s['status']),
            'role' => 'supplier',
            'isVip' => false,
            'rate' => 0,
            'totalEarnings' => floatval($s['total_earnings'] ?? 0),
            'createdAt' => $s['created_at']
        ];
    }, $rows);

    sendPaginatedResponse($data, $total, $page, $limit);
}

sendError('Method not allowed', 405);
