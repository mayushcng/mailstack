<?php
// =============================================================================
// AUTH ME - GET /api/auth/me
// Returns current authenticated user
// =============================================================================
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$user = authenticateRequest();
if (!$user) {
    sendError('Unauthorized', 401);
}

sendResponse([
    'user' => [
        'id' => strval($user['id']),
        'email' => $user['email'],
        'name' => $user['name'],
        'role' => $user['role'],
        'profilePicture' => $user['profile_picture'],
        'phone' => $user['phone'],
        'createdAt' => $user['created_at']
    ]
]);
