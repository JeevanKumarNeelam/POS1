<?php
// api/menu.php

require_once '../config/database.php';
require_once '../includes/cors.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch menu items
if ($method === 'GET') {
    $category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : null;
    
    $sql = "SELECT * FROM menu_items WHERE is_active = 1";
    $params = [];
    
    if ($category && $category !== 'All') {
        $sql .= " AND category = ?";
        $params[] = $category;
    }
    $sql .= " ORDER BY category, name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll();
    
    sendJsonResponse(['success' => true, 'data' => $items]);
}

// POST - Add item (Admin only)
if ($method === 'POST') {
    requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['name']) || !isset($input['price']) || !isset($input['category'])) {
        sendJsonResponse(['error' => 'Name, price and category required'], 400);
    }
    
    $name = sanitizeInput($input['name']);
    $price = floatval($input['price']);
    $category = sanitizeInput($input['category']);
    
    $stmt = $pdo->prepare("INSERT INTO menu_items (name, price, category) VALUES (?, ?, ?)");
    $stmt->execute([$name, $price, $category]);
    $id = $pdo->lastInsertId();
    
    sendJsonResponse(['success' => true, 'message' => 'Item added', 'id' => $id]);
}

// PUT - Update item (Admin only)
if ($method === 'PUT') {
    requireAdmin();
    
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        sendJsonResponse(['error' => 'Item ID required'], 400);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        sendJsonResponse(['error' => 'Invalid input'], 400);
    }
    
    $name = isset($input['name']) ? sanitizeInput($input['name']) : null;
    $price = isset($input['price']) ? floatval($input['price']) : null;
    $category = isset($input['category']) ? sanitizeInput($input['category']) : null;
    
    $updates = [];
    $params = [];
    
    if ($name) { $updates[] = "name = ?"; $params[] = $name; }
    if ($price !== null && $price >= 0) { $updates[] = "price = ?"; $params[] = $price; }
    if ($category) { $updates[] = "category = ?"; $params[] = $category; }
    
    if (empty($updates)) {
        sendJsonResponse(['error' => 'No fields to update'], 400);
    }
    
    $params[] = $id;
    $sql = "UPDATE menu_items SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    sendJsonResponse(['success' => true, 'message' => 'Item updated']);
}

// DELETE - Delete item (Admin only)
if ($method === 'DELETE') {
    requireAdmin();
    
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        sendJsonResponse(['error' => 'Item ID required'], 400);
    }
    
    $stmt = $pdo->prepare("UPDATE menu_items SET is_active = 0 WHERE id = ?");
    $stmt->execute([$id]);
    
    sendJsonResponse(['success' => true, 'message' => 'Item deleted']);
}
?>