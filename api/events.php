<?php
// api/events.php - Server-Sent Events for real-time updates

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

// Increase execution time for long-running connections
set_time_limit(0);

// Include database for polling
require_once '../config/database.php';

// Helper to get new orders
function getNewOrdersSince($lastId) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id > ? AND archived = 0 ORDER BY id DESC");
    $stmt->execute([$lastId]);
    $orders = $stmt->fetchAll();
    
    foreach ($orders as &$order) {
        $stmt2 = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt2->execute([$order['id']]);
        $order['items'] = $stmt2->fetchAll();
    }
    return $orders;
}

$lastEventId = isset($_GET['lastEventId']) ? intval($_GET['lastEventId']) : 0;

while (true) {
    $orders = getNewOrdersSince($lastEventId);
    if (!empty($orders)) {
        foreach ($orders as $order) {
            echo "event: order\n";
            echo "data: " . json_encode($order) . "\n\n";
            ob_flush();
            flush();
            $lastEventId = $order['id'];
        }
    }
    sleep(2);
}
?>