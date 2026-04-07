<?php
// GET /api/v1/customer/orders/:id

$auth = requireAuth();
$userId = $auth['user_id'] ?? null;
$orderId = $_route['id'] ?? null;

if (!$userId || !$orderId) {
    error('Invalid request', 400);
}

$db = getDB();

$stmt = $db->prepare("
    SELECT 
        o.*,
        CONCAT(u.first_name,' ',u.last_name) AS customer
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ? AND o.user_id = ?
");
$stmt->execute([$orderId, $userId]);
$order = $stmt->fetch();

if (!$order) {
    error('Order not found', 404);
}

success($order, 'Order details retrieved');
