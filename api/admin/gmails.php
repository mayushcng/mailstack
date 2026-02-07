<?php
// =============================================================================
// ADMIN GMAILS - GET/POST /api/admin/gmails
// Handles: List gmails, verify, reject, maintenance
// Returns PaginatedResponse<Gmail> for GET
// =============================================================================
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email.php';

$user = authenticateRequest();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 401);
}

$db = getDB();
$uri = $_SERVER['REQUEST_URI'];

// =============================================================================
// POST - Verify/Reject/Maintenance actions
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getInput();
    $gmailIds = $input['gmailIds'] ?? [];

    if (empty($gmailIds)) {
        sendError('No gmail IDs provided', 400);
    }

    // Verify
    if (strpos($uri, '/verify') !== false) {
        $placeholders = implode(',', array_fill(0, count($gmailIds), '?'));
        $stmt = $db->prepare("UPDATE email_submissions SET status = 'verified', reviewed_at = NOW() WHERE id IN ($placeholders)");
        $stmt->execute($gmailIds);

        // Add earnings for verified emails
        $rateStmt = $db->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('gmail_rate', 'outlook_rate')");
        $rates = [];
        while ($row = $rateStmt->fetch()) {
            $rates[$row['setting_key']] = floatval($row['setting_value']);
        }
        $gmailRate = $rates['gmail_rate'] ?? 5;
        $outlookRate = $rates['outlook_rate'] ?? 7;

        foreach ($gmailIds as $id) {
            $sub = $db->query("SELECT supplier_id, email_type FROM email_submissions WHERE id = " . intval($id))->fetch();
            if ($sub) {
                $rate = ($sub['email_type'] === 'outlook') ? $outlookRate : $gmailRate;
                $db->prepare("UPDATE users SET total_earnings = total_earnings + ?, available_balance = available_balance + ? WHERE id = ?")
                    ->execute([$rate, $rate, $sub['supplier_id']]);
            }
        }

        sendResponse(['success' => true, 'message' => 'Verified successfully', 'processed' => count($gmailIds)]);
    }

    // Reject
    if (strpos($uri, '/reject') !== false) {
        $remark = $input['remark'] ?? 'Rejected by admin';
        $placeholders = implode(',', array_fill(0, count($gmailIds), '?'));
        $stmt = $db->prepare("UPDATE email_submissions SET status = 'rejected', rejection_reason = ?, reviewed_at = NOW() WHERE id IN ($placeholders)");
        $stmt->execute(array_merge([$remark], $gmailIds));

        // Send email notifications to affected suppliers
        foreach ($gmailIds as $id) {
            $sub = $db->prepare("
                SELECT es.*, u.email, u.name 
                FROM email_submissions es 
                JOIN users u ON es.supplier_id = u.id 
                WHERE es.id = ?
            ");
            $sub->execute([$id]);
            $submission = $sub->fetch();
            if ($submission) {
                sendSubmissionFlaggedEmail($submission['email'], $submission['name'], 'rejected', $remark);
            }
        }

        sendResponse(['success' => true, 'message' => 'Rejected successfully', 'processed' => count($gmailIds)]);
    }

    // Maintenance (use rejection_reason to store maintenance note)
    if (strpos($uri, '/maintenance') !== false) {
        $reason = $input['reason'] ?? 'Under maintenance';
        $placeholders = implode(',', array_fill(0, count($gmailIds), '?'));
        // Note: Schema doesn't have 'maintenance' status, so we keep it pending with a note
        $stmt = $db->prepare("UPDATE email_submissions SET rejection_reason = CONCAT('MAINTENANCE: ', ?) WHERE id IN ($placeholders)");
        $stmt->execute(array_merge([$reason], $gmailIds));
        sendResponse(['success' => true, 'message' => 'Flagged for maintenance', 'processed' => count($gmailIds)]);
    }

    sendError('Invalid action', 400);
}

// =============================================================================
// GET - List gmails with pagination
// Returns: PaginatedResponse<Gmail>
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Frontend sends UPPERCASE status, convert to lowercase for DB
    $status = strtolower($_GET['status'] ?? 'pending');
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $emailType = $_GET['emailType'] ?? null;
    $supplierId = $_GET['supplierId'] ?? null;

    $where = "WHERE e.status = ?";
    $params = [$status];

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

    // Fetch with supplier info
    // DB columns: email_address, name (not full_name)
    $sql = "SELECT e.*, u.name as supplier_name, CONCAT('SUP', LPAD(u.id, 4, '0')) as supplier_code 
            FROM email_submissions e 
            JOIN users u ON e.supplier_id = u.id 
            $where 
            ORDER BY e.created_at DESC 
            LIMIT $limit OFFSET $offset";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Transform to frontend Gmail type
    $data = array_map(function ($row) {
        return [
            'id' => strval($row['id']),          // Frontend expects string
            'email' => $row['email_address'],     // DB: email_address → Frontend: email
            'password' => $row['password'],
            'emailType' => $row['email_type'],
            'status' => strtoupper($row['status']), // DB: lowercase → Frontend: UPPERCASE
            'remark' => $row['rejection_reason'],   // DB: rejection_reason → Frontend: remark
            'submittedAt' => $row['created_at'],    // DB: created_at → Frontend: submittedAt
            'verifiedAt' => $row['reviewed_at'],    // DB: reviewed_at → Frontend: verifiedAt
            'supplierId' => strval($row['supplier_id']),
            'supplierName' => $row['supplier_name'],
            'supplierCode' => $row['supplier_code']
        ];
    }, $rows);

    sendPaginatedResponse($data, $total, $page, $limit);
}

sendError('Method not allowed', 405);
