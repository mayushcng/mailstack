<?php
// =============================================================================
// SUPPLIER SUBMISSIONS - GET/POST /api/supplier/submissions
// Also handles POST /api/supplier/submit
// =============================================================================
require_once __DIR__ . '/../config/database.php';

$user = authenticateRequest();
if (!$user || $user['role'] !== 'supplier') {
    sendError('Unauthorized', 401);
}

$db = getDB();
$userId = $user['id'];
$uri = $_SERVER['REQUEST_URI'];

// =============================================================================
// POST - Submit new batch (handles both /submissions and /submit)
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getInput();
    $entries = $input['entries'] ?? $input['accounts'] ?? [];

    if (empty($entries)) {
        sendError('No entries provided', 400);
    }

    // Check for duplicates in database
    $duplicates = [];
    $validEntries = [];

    foreach ($entries as $entry) {
        $email = $entry['email'] ?? '';
        $checkStmt = $db->prepare("SELECT id FROM email_submissions WHERE email_address = ?");
        $checkStmt->execute([$email]);
        if ($checkStmt->fetch()) {
            $duplicates[] = $email;
        } else {
            $validEntries[] = $entry;
        }
    }

    // Insert valid entries (DB uses email_address column, not email)
    $stmt = $db->prepare("
        INSERT INTO email_submissions (supplier_id, email_type, email_address, password, created_at, status)
        VALUES (?, ?, ?, ?, NOW(), 'pending')
    ");

    $acceptedNew = 0;
    foreach ($validEntries as $entry) {
        $stmt->execute([
            $userId,
            $entry['emailType'] ?? 'gmail',
            $entry['email'],
            $entry['password']
        ]);
        $acceptedNew++;
    }

    // Update user quota counts
    $gmailCount = 0;
    $outlookCount = 0;
    foreach ($validEntries as $entry) {
        if (($entry['emailType'] ?? 'gmail') === 'gmail')
            $gmailCount++;
        else
            $outlookCount++;
    }

    if ($gmailCount > 0 || $outlookCount > 0) {
        $db->prepare("UPDATE users SET gmail_submitted = gmail_submitted + ?, outlook_submitted = outlook_submitted + ? WHERE id = ?")
            ->execute([$gmailCount, $outlookCount, $userId]);
    }

    // Response matches SubmitBatchResponse type
    sendResponse([
        'batchId' => strval(time()),
        'acceptedNew' => $acceptedNew,
        'duplicateRejected' => count($duplicates),
        'invalidRejected' => 0,
        'duplicates' => $duplicates
    ], 201);
}

// =============================================================================
// GET - List submissions
// Returns PaginatedResponse<Gmail>
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $status = isset($_GET['status']) ? strtolower($_GET['status']) : null;

    $where = "WHERE supplier_id = ?";
    $params = [$userId];

    if ($status && in_array($status, ['pending', 'verified', 'rejected'])) {
        $where .= " AND status = ?";
        $params[] = $status;
    }

    // Count
    $countStmt = $db->prepare("SELECT COUNT(*) FROM email_submissions $where");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    // Fetch (DB uses email_address, created_at, reviewed_at, rejection_reason)
    $stmt = $db->prepare("
        SELECT * FROM email_submissions 
        $where
        ORDER BY created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Transform to Gmail type
    $data = array_map(function ($s) use ($user) {
        return [
            'id' => strval($s['id']),
            'email' => $s['email_address'],        // DB: email_address → Frontend: email
            'password' => $s['password'],
            'emailType' => $s['email_type'],
            'status' => strtoupper($s['status']),  // DB: lowercase → Frontend: UPPERCASE
            'remark' => $s['rejection_reason'],    // DB: rejection_reason → Frontend: remark
            'submittedAt' => $s['created_at'],     // DB: created_at → Frontend: submittedAt
            'verifiedAt' => $s['reviewed_at'],     // DB: reviewed_at → Frontend: verifiedAt
            'supplierId' => strval($s['supplier_id']),
            'supplierName' => $user['name'],
            'supplierCode' => 'SUP' . str_pad($user['id'], 4, '0', STR_PAD_LEFT)
        ];
    }, $rows);

    sendPaginatedResponse($data, $total, $page, $limit);
}

sendError('Method not allowed', 405);
