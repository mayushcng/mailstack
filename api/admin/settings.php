<?php
// =============================================================================
// ADMIN SETTINGS - GET/PUT /api/admin/settings
// Returns: SystemSettings type
// =============================================================================
require_once __DIR__ . '/../config/database.php';

$user = authenticateRequest();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 401);
}

$db = getDB();

// =============================================================================
// GET - Get all settings
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query("SELECT setting_key, setting_value FROM settings");
    $settings = [];
    while ($row = $stmt->fetch()) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    // Parse bonus tiers
    $bonusTiers = [];
    if (!empty($settings['bonus_tiers'])) {
        $bonusTiers = json_decode($settings['bonus_tiers'], true) ?: [];
    }

    // Get global submitted counts
    $gmailSubmitted = $db->query("SELECT COUNT(*) FROM email_submissions WHERE email_type = 'gmail'")->fetchColumn() ?: 0;
    $outlookSubmitted = $db->query("SELECT COUNT(*) FROM email_submissions WHERE email_type = 'outlook'")->fetchColumn() ?: 0;

    sendResponse([
        'gmailQuota' => isset($settings['gmail_quota_default']) && $settings['gmail_quota_default'] !== '-1'
            ? intval($settings['gmail_quota_default']) : null,
        'outlookQuota' => isset($settings['outlook_quota_default']) && $settings['outlook_quota_default'] !== '-1'
            ? intval($settings['outlook_quota_default']) : null,
        'gmailSubmitted' => intval($gmailSubmitted),
        'outlookSubmitted' => intval($outlookSubmitted),
        'bonusTiers' => $bonusTiers,
        'telegramChannelUrl' => $settings['telegram_channel_url'] ?? '',
        'gmailRate' => floatval($settings['gmail_rate'] ?? 5),
        'outlookRate' => floatval($settings['outlook_rate'] ?? 7),
        'minPayout' => floatval($settings['min_payout'] ?? 300)
    ]);
}

// =============================================================================
// PUT - Update settings
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = getInput();

    $mapping = [
        'gmailQuota' => 'gmail_quota_default',
        'outlookQuota' => 'outlook_quota_default',
        'bonusTiers' => 'bonus_tiers',
        'telegramChannelUrl' => 'telegram_channel_url',
        'gmailRate' => 'gmail_rate',
        'outlookRate' => 'outlook_rate',
        'minPayout' => 'min_payout'
    ];

    $stmt = $db->prepare("
        INSERT INTO settings (setting_key, setting_value) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    ");

    foreach ($input as $key => $value) {
        if (isset($mapping[$key])) {
            $dbValue = is_array($value) ? json_encode($value) : ($value ?? '');
            $stmt->execute([$mapping[$key], $dbValue]);
        }
    }

    sendResponse(['success' => true, 'message' => 'Settings updated']);
}

sendError('Method not allowed', 405);
