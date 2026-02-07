<?php
// =============================================================================
// DATABASE CONFIGURATION
// Update the password below with your cPanel MySQL password
// =============================================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'ottsathi1_mailstack');
define('DB_USER', 'ottsathi1_mailstack');
define('DB_PASS', 'mayush@9852');

// =============================================================================
// JWT SECRET KEY
// =============================================================================
define('JWT_SECRET', 'mailstack_secret_key_change_this_in_production_2024');
define('JWT_EXPIRY', 86400 * 7); // 7 days

// =============================================================================
// CORS HEADERS
// =============================================================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// =============================================================================
// DATABASE CONNECTION
// =============================================================================
function getDB()
{
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit();
        }
    }
    return $pdo;
}

// =============================================================================
// JWT FUNCTIONS
// =============================================================================
function generateJWT($userId, $email, $role)
{
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'email' => $email,
        'role' => $role,
        'exp' => time() + JWT_EXPIRY
    ]));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$signature";
}

function verifyJWT($token)
{
    $parts = explode('.', $token);
    if (count($parts) !== 3)
        return null;

    [$header, $payload, $signature] = $parts;
    $validSignature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));

    if ($signature !== $validSignature)
        return null;

    $data = json_decode(base64_decode($payload), true);
    if ($data['exp'] < time())
        return null;

    return $data;
}

// =============================================================================
// AUTHENTICATION - Returns full user object from database
// =============================================================================
function authenticateRequest()
{
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $data = verifyJWT($matches[1]);
        if ($data) {
            $db = getDB();
            $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$data['user_id']]);
            return $stmt->fetch();
        }
    }
    return null;
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================
function sendResponse($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function sendError($message, $status = 400)
{
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit();
}

// Paginated response helper - matches frontend PaginatedResponse<T> type
function sendPaginatedResponse($data, $total, $page, $limit)
{
    sendResponse([
        'data' => $data,
        'total' => intval($total),
        'page' => intval($page),
        'limit' => intval($limit),
        'totalPages' => max(1, ceil($total / $limit))
    ]);
}

// =============================================================================
// LEGACY FUNCTION ALIASES (for backward compatibility)
// =============================================================================
function requireAuth($requiredRole = null)
{
    $user = authenticateRequest();
    if (!$user) {
        sendError('Unauthorized', 401);
    }
    if ($requiredRole && $user['role'] !== $requiredRole) {
        sendError('Forbidden', 403);
    }
    // Return in format expected by old code
    return ['user_id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']];
}

function getInput()
{
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function respond($data, $status = 200)
{
    sendResponse($data, $status);
}

function respondError($message, $status = 400)
{
    sendError($message, $status);
}
