<?php
// =============================================================================
// SUPPLIER SYSTEM SETTINGS - GET /api/supplier/system-settings
// Returns: SystemSettings type
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

// Get all settings
$stmt = $db->query("SELECT setting_key, setting_value FROM settings");
$settings = [];
while ($row = $stmt->fetch()) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

// Get user's today submission counts
$stmt = $db->prepare("
    SELECT email_type, COUNT(*) as count 
    FROM email_submissions 
    WHERE supplier_id = ? AND DATE(created_at) = CURDATE() 
    GROUP BY email_type
");
$stmt->execute([$userId]);
$gmailSubmitted = 0;
$outlookSubmitted = 0;
while ($row = $stmt->fetch()) {
    if ($row['email_type'] === 'gmail')
        $gmailSubmitted = intval($row['count']);
    if ($row['email_type'] === 'outlook')
        $outlookSubmitted = intval($row['count']);
}

// Parse bonus tiers
$bonusTiers = [];
if (!empty($settings['bonus_tiers'])) {
    $bonusTiers = json_decode($settings['bonus_tiers'], true) ?: [];
}

// Response matches SystemSettings type
sendResponse([
    'gmailQuota' => isset($settings['gmail_quota_default']) && $settings['gmail_quota_default'] !== '-1'
        ? intval($settings['gmail_quota_default']) : null,
    'outlookQuota' => isset($settings['outlook_quota_default']) && $settings['outlook_quota_default'] !== '-1'
        ? intval($settings['outlook_quota_default']) : null,
    'gmailSubmitted' => $gmailSubmitted,
    'outlookSubmitted' => $outlookSubmitted,
    'bonusTiers' => $bonusTiers,
    'telegramChannelUrl' => $settings['telegram_channel_url'] ?? ''
]);
