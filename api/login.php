<?php
// api/login.php

require_once '../config/database.php';
require_once '../includes/cors.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['username']) || !isset($input['password'])) {
    sendJsonResponse(['error' => 'Username and password required'], 400);
}

$username = sanitizeInput($input['username']);
$password = $input['password'];

$stmt = $pdo->prepare("SELECT id, username, password_hash, role, full_name FROM users WHERE username = ? AND is_active = 1");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user) {
    sendJsonResponse(['error' => 'Invalid username or password'], 401);
}

if (!password_verify($password, $user['password_hash'])) {
    sendJsonResponse(['error' => 'Invalid username or password'], 401);
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['role'] = $user['role'];
$_SESSION['full_name'] = $user['full_name'];

sendJsonResponse([
    'success' => true,
    'message' => 'Login successful',
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'full_name' => $user['full_name']
    ]
]);
?>