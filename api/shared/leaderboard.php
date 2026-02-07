<?php
// =============================================================================
// LEADERBOARD - GET /api/shared/leaderboard.php
// =============================================================================
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respondError('Method not allowed', 405);
}

// No auth required for leaderboard
$db = getDB();

$stmt = $db->prepare("
    SELECT id, name, profile_picture, total_earnings
    FROM users 
    WHERE role = 'supplier' AND status = 'approved'
    ORDER BY total_earnings DESC
    LIMIT 10
");
$stmt->execute();
$leaders = $stmt->fetchAll();

respond([
    'leaderboard' => array_map(function ($l, $index) {
        return [
            'rank' => $index + 1,
            'id' => $l['id'],
            'name' => $l['name'],
            'profilePicture' => $l['profile_picture'],
            'earnings' => floatval($l['total_earnings'])
        ];
    }, $leaders, array_keys($leaders))
]);
