<?php
// api/settings.php

require_once '../config/database.php';
require_once '../includes/cors.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

$method = $_SERVER['REQUEST_METHOD'];

requireAdmin();

// GET - Get next order number
if ($method === 'GET') {
    $nextNumber = getNextOrderNumber();
    sendJsonResponse([
        'success' => true,
        'data' => [
            'next_order_number' => date('Ymd') . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT)
        ]
    ]);
}

// POST - Reset order counter
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['action']) || $input['action'] !== 'reset_order_id') {
        sendJsonResponse(['error' => 'Invalid action'], 400);
    }
    
    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('order_counter', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->execute(['order_counter', '0', '0']);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Order ID reset successfully. Next order will start from 001.'
    ]);
}

// DELETE - Archive all orders
if ($method === 'DELETE') {
    $confirm = isset($_GET['confirm']) ? $_GET['confirm'] : '';
    if ($confirm !== 'yes') {
        sendJsonResponse(['error' => 'Please confirm with ?confirm=yes'], 400);
    }
    
    $stmt = $pdo->query("UPDATE orders SET archived = 1 WHERE archived = 0");
    
    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('order_counter', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->execute(['order_counter', '0', '0']);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'All orders archived successfully.'
    ]);
}
?>