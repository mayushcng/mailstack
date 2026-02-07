<?php
// =============================================================================
// SUPPLIER PROFILE UPDATE - PUT /api/supplier/profile.php
// =============================================================================
require_once __DIR__ . '/../config/database.php';

$authUser = requireAuth('supplier');
$db = getDB();

// GET - Get profile
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$authUser['user_id']]);
    $user = $stmt->fetch();

    respond([
        'id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'phone' => $user['phone'],
        'dateOfBirth' => $user['date_of_birth'],
        'profilePicture' => $user['profile_picture']
    ]);
}

// PUT - Update profile
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = getInput();

    $updates = [];
    $params = [];

    if (isset($input['name'])) {
        $updates[] = "name = ?";
        $params[] = $input['name'];
    }

    if (isset($input['phone'])) {
        $updates[] = "phone = ?";
        $params[] = $input['phone'];
    }

    if (isset($input['profilePicture'])) {
        $updates[] = "profile_picture = ?";
        $params[] = $input['profilePicture'];
    }

    if (isset($input['currentPassword']) && isset($input['newPassword'])) {
        // Verify current password
        $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$authUser['user_id']]);
        $user = $stmt->fetch();

        if (!password_verify($input['currentPassword'], $user['password'])) {
            respondError('Current password is incorrect');
        }

        $updates[] = "password = ?";
        $params[] = password_hash($input['newPassword'], PASSWORD_DEFAULT);
    }

    if (empty($updates)) {
        respondError('No updates provided');
    }

    $params[] = $authUser['user_id'];
    $stmt = $db->prepare("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?");
    $stmt->execute($params);

    respond(['message' => 'Profile updated']);
}

respondError('Method not allowed', 405);
