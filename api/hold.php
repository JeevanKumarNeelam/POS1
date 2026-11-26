<?php
// api/hold.php - Hold & Recall orders

require_once '../config/database.php';
require_once '../includes/cors.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch held orders
if ($method === 'GET') {
    requireLogin();
    $user_id = $_SESSION['user_id'];
    
    $stmt = $pdo->prepare("SELECT * FROM held_orders WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$user_id]);
    $held = $stmt->fetchAll();
    
    foreach ($held as &$h) {
        $h['items'] = json_decode($h['items'], true);
    }
    
    sendJsonResponse(['success' => true, 'data' => $held]);
}

// POST - Save held order
if ($method === 'POST') {
    requireLogin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['items']) || empty($input['items'])) {
        sendJsonResponse(['error' => 'No items to hold'], 400);
    }
    
    $user_id = $_SESSION['user_id'];
    $items_json = json_encode($input['items']);
    
    $stmt = $pdo->prepare("INSERT INTO held_orders (user_id, items) VALUES (?, ?)");
    $stmt->execute([$user_id, $items_json]);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Order held successfully',
        'id' => $pdo->lastInsertId()
    ]);
}

// DELETE - Remove held order
if ($method === 'DELETE') {
    requireLogin();
    
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        sendJsonResponse(['error' => 'Held order ID required'], 400);
    }
    
    $user_id = $_SESSION['user_id'];
    $stmt = $pdo->prepare("DELETE FROM held_orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user_id]);
    
    sendJsonResponse(['success' => true, 'message' => 'Held order removed']);
}
?>