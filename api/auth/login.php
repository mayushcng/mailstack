<?php
// =============================================================================
// AUTH LOGIN - POST /api/auth/login
// =============================================================================
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInput();
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (!$email || !$password) {
    sendError('Email and password are required', 400);
}

$db = getDB();
$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    sendError('Invalid email or password', 401);
}

if (!password_verify($password, $user['password'])) {
    sendError('Invalid email or password', 401);
}

// Check if approved (for suppliers)
if ($user['role'] === 'supplier' && $user['status'] !== 'approved') {
    sendError('Your account is pending approval', 403);
}

$token = generateJWT($user['id'], $user['email'], $user['role']);

sendResponse([
    'user' => [
        'id' => strval($user['id']),
        'email' => $user['email'],
        'name' => $user['name'],
        'role' => $user['role'],
        'profilePicture' => $user['profile_picture'],
        'phone' => $user['phone'],
        'createdAt' => $user['created_at']
    ],
    'token' => $token
]);
