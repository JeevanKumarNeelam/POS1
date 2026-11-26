<?php
// api/sales.php

require_once '../config/database.php';
require_once '../includes/cors.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}

requireLogin();

// Date ranges
$now = new DateTime();
$today = $now->format('Y-m-d 00:00:00');
$monthStart = (clone $now)->modify('first day of this month')->format('Y-m-d 00:00:00');

// Today's Sales
$stmt = $pdo->prepare("SELECT SUM(total_amount) as total, COUNT(*) as count FROM orders WHERE created_at >= ? AND archived = 0");
$stmt->execute([$today]);
$todayData = $stmt->fetch();

// This Month
$stmt = $pdo->prepare("SELECT SUM(total_amount) as total, COUNT(*) as count FROM orders WHERE created_at >= ? AND archived = 0");
$stmt->execute([$monthStart]);
$monthData = $stmt->fetch();

// Annual (Total Revenue from all orders including archived)
$stmt = $pdo->query("SELECT SUM(total_amount) as total, COUNT(*) as count FROM orders");
$totalData = $stmt->fetch();

sendJsonResponse([
    'success' => true,
    'data' => [
        'today' => [
            'revenue' => floatval($todayData['total'] ?? 0),
            'orders' => intval($todayData['count'] ?? 0)
        ],
        'month' => [
            'revenue' => floatval($monthData['total'] ?? 0),
            'orders' => intval($monthData['count'] ?? 0)
        ],
        'total' => [
            'revenue' => floatval($totalData['total'] ?? 0),
            'orders' => intval($totalData['count'] ?? 0)
        ]
    ]
]);
?>