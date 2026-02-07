<?php
// =============================================================================
// AUTH REGISTER - POST /api/auth/register
// Creates a pending supplier account (requires admin approval)
// =============================================================================
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInput();
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$phone = $input['phone'] ?? null;
$dateOfBirth = $input['dateOfBirth'] ?? null;
$profilePicture = $input['profilePicture'] ?? null;

// Validation
if (!$name || !$email || !$password) {
    sendError('Name, email, and password are required', 400);
}

if (strlen($password) < 6) {
    sendError('Password must be at least 6 characters', 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email format', 400);
}

// Profile picture is required
if (!$profilePicture) {
    sendError('Profile picture is required', 400);
}

$db = getDB();

// Check if email exists
$check = $db->prepare("SELECT id FROM users WHERE email = ?");
$check->execute([$email]);
if ($check->fetch()) {
    sendError('Email already registered', 409);
}

// Create user with PENDING status - requires admin approval
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$stmt = $db->prepare("
    INSERT INTO users (email, password, name, phone, date_of_birth, profile_picture, role, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'supplier', 'pending', NOW())
");
$stmt->execute([$email, $hashedPassword, $name, $phone, $dateOfBirth, $profilePicture]);

$userId = $db->lastInsertId();

// Send registration confirmation email
sendRegistrationEmail($email, $name);

// DON'T return token - user needs admin approval first
// Return success message only
sendResponse([
    'success' => true,
    'message' => 'Registration submitted. Your account is pending admin approval.',
    'userId' => strval($userId)
], 201);

