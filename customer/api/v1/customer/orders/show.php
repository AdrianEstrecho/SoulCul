<?php
/*
Estrecho, Adrian M.
Mansilla, Rhangel R.
Romualdo, Jervin Paul C.
Sostea, Joana Marie A.
Torres, Ceazarion Sean Nicholas M.
Tupaen, Arianne Kaye E.

BSIT/IT22S1
*/

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

$items = [];
try {
    $itemsStmt = $db->prepare("\n        SELECT\n            oi.id,\n            oi.product_id,\n            oi.product_name,\n            oi.quantity,\n            oi.unit_price,\n            oi.total_price,\n            p.featured_image_url AS product_image_url\n        FROM order_items oi\n        LEFT JOIN products p ON p.id = oi.product_id\n        WHERE oi.order_id = ?\n        ORDER BY oi.id ASC\n    ");
    $itemsStmt->execute([$orderId]);
    $items = $itemsStmt->fetchAll();
} catch (Throwable) {
    $items = [];
}

$payment = null;
try {
    $paymentStmt = $db->prepare("\n        SELECT payment_method, payment_status, transaction_id, amount, processed_at\n        FROM payments\n        WHERE order_id = ?\n        ORDER BY id DESC\n        LIMIT 1\n    ");
    $paymentStmt->execute([$orderId]);
    $payment = $paymentStmt->fetch() ?: null;
} catch (Throwable) {
    $payment = null;
}

$order['items'] = $items;
$order['payment'] = $payment;

success($order, 'Order details retrieved');
