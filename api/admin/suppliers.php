<?php
// =============================================================================
// ADMIN SUPPLIERS - GET/PUT/PATCH /api/admin/suppliers
// Handles RESTful paths (/suppliers/123) and query params (?id=123)
// =============================================================================
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email.php';

$user = authenticateRequest();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 401);
}

$db = getDB();
$uri = $_SERVER['REQUEST_URI'];

// Helper: Extract supplier ID from URL path OR query params OR body
function getSupplierIdFromRequest($uri, $input = null)
{
    // Check URL path: /suppliers/123 or /suppliers/123.php
    if (preg_match('/\/suppliers\/(\d+)/', $uri, $matches)) {
        return intval($matches[1]);
    }
    // Check query params: ?id=123
    if (!empty($_GET['id'])) {
        return intval($_GET['id']);
    }
    // Check request body
    if ($input && !empty($input['id'])) {
        return intval($input['id']);
    }
    return 0;
}

// =============================================================================
// GET - List suppliers or get single supplier details
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = getSupplierIdFromRequest($uri);

    // Single supplier requested
    if ($id > 0) {
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ? AND role = 'supplier'");
        $stmt->execute([$id]);
        $supplier = $stmt->fetch();

        if (!$supplier) {
            sendError('Supplier not found', 404);
        }

        // Get stats
        $stats = $db->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM email_submissions WHERE supplier_id = ?
        ");
        $stats->execute([$id]);
        $counts = $stats->fetch();

        $statusMap = ['approved' => 'ACTIVE', 'pending' => 'PENDING', 'suspended' => 'DISABLED', 'rejected' => 'DISABLED'];

        sendResponse([
            'supplier' => [
                'id' => strval($supplier['id']),
                'email' => $supplier['email'],
                'name' => $supplier['name'],
                'code' => 'SUP' . str_pad($supplier['id'], 4, '0', STR_PAD_LEFT),
                'phone' => $supplier['phone'],
                'profilePicture' => $supplier['profile_picture'],
                'status' => $statusMap[$supplier['status']] ?? 'PENDING',
                'totalEarnings' => floatval($supplier['total_earnings'] ?? 0),
                'role' => 'supplier',
                'isVip' => false,
                'rate' => 0,
                'createdAt' => $supplier['created_at']
            ],
            'totalSubmitted' => intval($counts['total'] ?? 0),
            'verifiedCount' => intval($counts['verified'] ?? 0),
            'pendingCount' => intval($counts['pending'] ?? 0),
            'rejectedCount' => intval($counts['rejected'] ?? 0),
            'unpaidAmount' => floatval($supplier['available_balance'] ?? 0)
        ]);
    }

    // List all suppliers
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $status = isset($_GET['status']) ? strtolower($_GET['status']) : null;
    $search = $_GET['q'] ?? $_GET['search'] ?? null;

    $where = "WHERE role = 'supplier'";
    $params = [];

    // Map frontend status to DB status
    $statusMap = ['active' => 'approved', 'pending' => 'pending', 'disabled' => 'suspended'];
    if ($status && isset($statusMap[$status])) {
        $where .= " AND status = ?";
        $params[] = $statusMap[$status];
    } elseif ($status) {
        $where .= " AND status = ?";
        $params[] = $status;
    }

    if ($search) {
        $where .= " AND (name LIKE ? OR email LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    // Count
    $countStmt = $db->prepare("SELECT COUNT(*) FROM users $where");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    // Fetch with stats
    $sql = "SELECT u.*, 
            (SELECT COUNT(*) FROM email_submissions WHERE supplier_id = u.id) as total_submissions,
            (SELECT COUNT(*) FROM email_submissions WHERE supplier_id = u.id AND status = 'verified') as verified_count
            FROM users u
            $where
            ORDER BY u.created_at DESC
            LIMIT $limit OFFSET $offset";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Transform to frontend Supplier type
    $data = array_map(function ($s) {
        $statusMap = ['approved' => 'ACTIVE', 'pending' => 'PENDING', 'suspended' => 'DISABLED', 'rejected' => 'DISABLED'];
        return [
            'id' => strval($s['id']),
            'email' => $s['email'],
            'name' => $s['name'],
            'code' => 'SUP' . str_pad($s['id'], 4, '0', STR_PAD_LEFT),
            'phone' => $s['phone'],
            'profilePicture' => $s['profile_picture'],
            'status' => $statusMap[$s['status']] ?? 'PENDING',
            'role' => 'supplier',
            'isVip' => false,
            'rate' => 0,
            'totalEarnings' => floatval($s['total_earnings'] ?? 0),
            'totalSubmissions' => intval($s['total_submissions'] ?? 0),
            'verifiedCount' => intval($s['verified_count'] ?? 0),
            'createdAt' => $s['created_at']
        ];
    }, $rows);

    sendPaginatedResponse($data, $total, $page, $limit);
}

// =============================================================================
// PUT/PATCH - Update supplier status
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input = getInput();
    $id = getSupplierIdFromRequest($uri, $input);

    if (!$id) {
        sendError('Supplier ID required', 400);
    }

    // Get supplier info for email
    $supplierStmt = $db->prepare("SELECT email, name, status FROM users WHERE id = ?");
    $supplierStmt->execute([$id]);
    $supplier = $supplierStmt->fetch();
    $oldStatus = $supplier['status'] ?? '';

    $updates = [];
    $params = [];
    $newStatus = null;

    if (isset($input['status'])) {
        $statusMap = ['ACTIVE' => 'approved', 'PENDING' => 'pending', 'DISABLED' => 'suspended'];
        $dbStatus = $statusMap[$input['status']] ?? strtolower($input['status']);
        $updates[] = "status = ?";
        $params[] = $dbStatus;
        $newStatus = $dbStatus;
    }

    if (empty($updates)) {
        sendError('No updates provided', 400);
    }

    $params[] = $id;
    $stmt = $db->prepare("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?");
    $stmt->execute($params);

    // Send email notification on status change
    if ($newStatus && $supplier && $oldStatus !== $newStatus) {
        $email = $supplier['email'];
        $name = $supplier['name'];

        if ($newStatus === 'approved') {
            sendApprovalEmail($email, $name);
        } elseif ($newStatus === 'suspended' || $newStatus === 'rejected') {
            sendDisabledEmail($email, $name, $input['reason'] ?? null);
        }
    }

    sendResponse(['success' => true, 'message' => 'Supplier updated']);
}

sendError('Method not allowed', 405);
