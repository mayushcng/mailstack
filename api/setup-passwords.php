<?php
// =============================================================================
// PASSWORD SETUP SCRIPT - Run once then DELETE this file!
// =============================================================================
require_once __DIR__ . '/config/database.php';

$db = getDB();

// Generate proper password hashes
$adminHash = password_hash('admin123', PASSWORD_DEFAULT);
$supplierHash = password_hash('password123', PASSWORD_DEFAULT);

// Update admin password
$stmt = $db->prepare("UPDATE users SET password = ? WHERE email = 'admin@mailstack.com'");
$stmt->execute([$adminHash]);
echo "Admin password updated!<br>";

// Update supplier password
$stmt = $db->prepare("UPDATE users SET password = ? WHERE email = 'john.supplier@example.com'");
$stmt->execute([$supplierHash]);
echo "Supplier password updated!<br>";

echo "<br><strong>Done! Now DELETE this file from your server for security!</strong>";
echo "<br><br>Login credentials:";
echo "<br>- Admin: admin@mailstack.com / admin123";
echo "<br>- Supplier: john.supplier@example.com / password123";
