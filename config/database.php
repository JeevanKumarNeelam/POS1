<?php
// config/database.php

// Database credentials (update these with your InfinityFree details)
define('DB_HOST', 'sql102.infinityfree.com');   // Your DB host (from cPanel)
define('DB_NAME', 'if0_42326072_pos');          // Your database name (with prefix)
define('DB_USER', 'if0_42326072');          // Your database username (with prefix)
define('DB_PASS', 'hFF36lOmdlo');             // Your database password

// Create PDO connection
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
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
?>