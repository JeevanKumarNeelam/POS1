<?php
// includes/functions.php

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function generateOrderNumber() {
    global $pdo;
    $date = date('Ymd');
    $prefix = $date . '-';
    
    $stmt = $pdo->prepare("SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$prefix . '%']);
    $last = $stmt->fetch();
    
    if ($last) {
        $num = intval(substr($last['order_number'], -3)) + 1;
        return $prefix . str_pad($num, 3, '0', STR_PAD_LEFT);
    }
    return $prefix . '001';
}

function getNextOrderNumber() {
    global $pdo;
    $date = date('Ymd');
    $prefix = $date . '-';
    
    $stmt = $pdo->prepare("SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$prefix . '%']);
    $last = $stmt->fetch();
    
    if ($last) {
        $num = intval(substr($last['order_number'], -3)) + 1;
        return $num;
    }
    return 1;
}

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}
?>