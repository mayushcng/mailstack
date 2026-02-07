<?php
// =============================================================================
// ADMIN VERIFIED - GET /api/admin/verified
// Returns PaginatedResponse<Gmail> for verified emails
// =============================================================================
require_once __DIR__ . '/../config/database.php';

$user = authenticateRequest();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$db = getDB();

$page = max(1, intval($_GET['page'] ?? 1));
$limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;
$emailType = $_GET['emailType'] ?? null;
$supplierId = $_GET['supplierId'] ?? null;

$where = "WHERE e.status = 'verified'";
$params = [];

if ($emailType) {
    $where .= " AND e.email_type = ?";
    $params[] = strtolower($emailType);
}

if ($supplierId) {
    $where .= " AND e.supplier_id = ?";
    $params[] = intval($supplierId);
}

// Count
$countStmt = $db->prepare("SELECT COUNT(*) FROM email_submissions e $where");
$countStmt->execute($params);
$total = $countStmt->fetchColumn();

// Fetch
$sql = "SELECT e.*, u.name as supplier_name, CONCAT('SUP', LPAD(u.id, 4, '0')) as supplier_code 
        FROM email_submissions e 
        JOIN users u ON e.supplier_id = u.id 
        $where 
        ORDER BY e.reviewed_at DESC 
        LIMIT $limit OFFSET $offset";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$data = array_map(function ($row) {
    return [
        'id' => strval($row['id']),
        'email' => $row['email_address'],
        'password' => $row['password'],
        'emailType' => $row['email_type'],
        'status' => 'VERIFIED',
        'remark' => $row['rejection_reason'],
        'submittedAt' => $row['created_at'],
        'verifiedAt' => $row['reviewed_at'],
        'supplierId' => strval($row['supplier_id']),
        'supplierName' => $row['supplier_name'],
        'supplierCode' => $row['supplier_code']
    ];
}, $rows);

sendPaginatedResponse($data, $total, $page, $limit);
