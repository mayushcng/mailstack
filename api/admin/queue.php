<?php
// =============================================================================
// ADMIN REVIEW QUEUE - GET/PUT /api/admin/queue.php
// =============================================================================
require_once __DIR__ . '/../config/database.php';

$authUser = requireAuth('admin');
$db = getDB();

// GET - Get pending submissions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 20);
    $offset = ($page - 1) * $limit;

    // Get total count
    $stmt = $db->prepare("SELECT COUNT(*) FROM email_submissions WHERE status = 'pending'");
    $stmt->execute();
    $total = $stmt->fetchColumn();

    // Get submissions with supplier info
    $stmt = $db->prepare("
        SELECT s.*, u.name as supplier_name, u.email as supplier_email
        FROM email_submissions s
        JOIN users u ON s.supplier_id = u.id
        WHERE s.status = 'pending'
        ORDER BY s.created_at ASC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute();
    $submissions = $stmt->fetchAll();

    respond([
        'submissions' => array_map(function ($s) {
            return [
                'id' => $s['id'],
                'supplierId' => $s['supplier_id'],
                'supplierName' => $s['supplier_name'],
                'supplierEmail' => $s['supplier_email'],
                'emailType' => $s['email_type'],
                'emailAddress' => $s['email_address'],
                'password' => $s['password'],
                'recoveryEmail' => $s['recovery_email'],
                'recoveryPhone' => $s['recovery_phone'],
                'createdAt' => $s['created_at']
            ];
        }, $submissions),
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => intval($total),
            'pages' => ceil($total / $limit)
        ]
    ]);
}

// PUT - Verify or reject submission
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = getInput();
    $id = intval($input['id'] ?? 0);
    $action = $input['action'] ?? '';
    $reason = $input['reason'] ?? null;

    if (!$id || !in_array($action, ['verify', 'reject'])) {
        respondError('Invalid request');
    }

    // Get submission
    $stmt = $db->prepare("SELECT * FROM email_submissions WHERE id = ?");
    $stmt->execute([$id]);
    $submission = $stmt->fetch();

    if (!$submission) {
        respondError('Submission not found', 404);
    }

    if ($submission['status'] !== 'pending') {
        respondError('Submission already processed');
    }

    $newStatus = $action === 'verify' ? 'verified' : 'rejected';

    // Update submission
    $stmt = $db->prepare("
        UPDATE email_submissions 
        SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$newStatus, $reason, $authUser['user_id'], $id]);

    // If verified, add earnings
    if ($action === 'verify') {
        // Get rate
        $rateKey = $submission['email_type'] . '_rate';
        $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
        $stmt->execute([$rateKey]);
        $rate = floatval($stmt->fetchColumn() ?: 5);

        // Add earnings
        $stmt = $db->prepare("
            UPDATE users 
            SET total_earnings = total_earnings + ?,
                available_balance = available_balance + ?
            WHERE id = ?
        ");
        $stmt->execute([$rate, $rate, $submission['supplier_id']]);

        // Create payment record
        $stmt = $db->prepare("
            INSERT INTO payments (supplier_id, submission_id, amount, type, status, description)
            VALUES (?, ?, ?, 'earning', 'completed', ?)
        ");
        $stmt->execute([
            $submission['supplier_id'],
            $id,
            $rate,
            ucfirst($submission['email_type']) . ' account verified'
        ]);
    }

    respond(['message' => 'Submission ' . ($action === 'verify' ? 'verified' : 'rejected')]);
}

respondError('Method not allowed', 405);
