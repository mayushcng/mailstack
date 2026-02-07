<?php
// =============================================================================
// SUPPLIER LEADERBOARD - GET /api/supplier/leaderboard
// Returns: LeaderboardEntry[]
// =============================================================================
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$db = getDB();

// Get top 10 earners (DB uses 'name' column, status is lowercase 'approved')
$stmt = $db->query("
    SELECT id, name, profile_picture, total_earnings
    FROM users 
    WHERE role = 'supplier' AND status = 'approved'
    ORDER BY total_earnings DESC 
    LIMIT 10
");

$leaderboard = [];
$rank = 1;
while ($row = $stmt->fetch()) {
    $leaderboard[] = [
        'rank' => $rank++,
        'supplierId' => strval($row['id']),          // Frontend expects supplierId
        'supplierName' => $row['name'],               // DB: name → Frontend: supplierName
        'profilePicture' => $row['profile_picture'],
        'totalEarnings' => floatval($row['total_earnings'])
    ];
}

// Ensure at least 3 entries for podium display
while (count($leaderboard) < 3) {
    $leaderboard[] = [
        'rank' => count($leaderboard) + 1,
        'supplierId' => 'placeholder-' . count($leaderboard),
        'supplierName' => '---',
        'profilePicture' => null,
        'totalEarnings' => 0
    ];
}

sendResponse($leaderboard);
