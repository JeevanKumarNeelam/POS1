<?php
// api/orders.php

require_once '../config/database.php';
require_once '../includes/cors.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch orders
if ($method === 'GET') {
    requireLogin();
    
    $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : 'all';
    $payment = isset($_GET['payment']) ? sanitizeInput($_GET['payment']) : 'all';
    $archived = isset($_GET['archived']) ? intval($_GET['archived']) : 0;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    
    $sql = "SELECT o.*, u.full_name as cashier_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.archived = ?";
    $params = [$archived];
    
    if ($status !== 'all') {
        $sql .= " AND o.status = ?";
        $params[] = $status;
    }
    if ($payment !== 'all') {
        $sql .= " AND o.payment_method = ?";
        $params[] = $payment;
    }
    
    $sql .= " ORDER BY o.id DESC LIMIT ?";
    $params[] = $limit;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    
    // Get items for each order
    foreach ($orders as &$order) {
        $stmt2 = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt2->execute([$order['id']]);
        $order['items'] = $stmt2->fetchAll();
    }
    
    sendJsonResponse(['success' => true, 'data' => $orders]);
}

// POST - Place new order
if ($method === 'POST') {
    requireLogin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['items']) || empty($input['items'])) {
        sendJsonResponse(['error' => 'Order must have at least one item'], 400);
    }
    
    if (!isset($input['payment_method']) || !in_array($input['payment_method'], ['cash', 'card', 'upi'])) {
        sendJsonResponse(['error' => 'Invalid payment method'], 400);
    }
    
    $user_id = $_SESSION['user_id'];
    $payment_method = $input['payment_method'];
    $items = $input['items'];
    
    $total = 0;
    foreach ($items as $item) {
        $total += floatval($item['price']) * intval($item['quantity']);
    }
    
    $order_number = generateOrderNumber();
    
    $pdo->beginTransaction();
    
    try {
        $stmt = $pdo->prepare("INSERT INTO orders (order_number, user_id, total_amount, payment_method) VALUES (?, ?, ?, ?)");
        $stmt->execute([$order_number, $user_id, $total, $payment_method]);
        $order_id = $pdo->lastInsertId();
        
        foreach ($items as $item) {
            $stmt = $pdo->prepare("INSERT INTO order_items (order_id, menu_item_name, quantity, price) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $order_id,
                sanitizeInput($item['name']),
                intval($item['quantity']),
                floatval($item['price'])
            ]);
        }
        
        $pdo->commit();
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Order placed successfully',
            'order_id' => $order_id,
            'order_number' => $order_number
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        sendJsonResponse(['error' => 'Failed to place order: ' . $e->getMessage()], 500);
    }
}

// PUT - Update order status
if ($method === 'PUT') {
    requireLogin();
    
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        sendJsonResponse(['error' => 'Order ID required'], 400);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['status'])) {
        sendJsonResponse(['error' => 'Status required'], 400);
    }
    
    $status = $input['status'];
    $allowed = ['pending', 'preparing', 'ready', 'completed'];
    if (!in_array($status, $allowed)) {
        sendJsonResponse(['error' => 'Invalid status'], 400);
    }
    
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    
    sendJsonResponse(['success' => true, 'message' => 'Order status updated']);
}
?>