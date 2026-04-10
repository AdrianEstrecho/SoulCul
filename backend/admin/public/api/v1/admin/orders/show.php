<?php
// GET /api/v1/admin/orders/:id
requireAuth();
$db = getDB();
$id = (int) $_route['id'];

$stmt = $db->prepare(
    "SELECT o.*, CONCAT(u.first_name,' ',u.last_name) AS customer,
            u.email, u.phone AS user_phone
     FROM orders o JOIN users u ON o.user_id = u.id
     WHERE o.id = ?"
);
$stmt->execute([$id]);
$order = $stmt->fetch();
if (!$order) error('Order not found', 404);

$items = $db->prepare(
    "SELECT product_name, quantity, unit_price, total_price FROM order_items WHERE order_id = ?"
);
$items->execute([$id]);
$order['items'] = $items->fetchAll();

$pay = $db->prepare("SELECT payment_method, payment_status, transaction_id, amount FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1");
$pay->execute([$id]);
$order['payment'] = $pay->fetch() ?: null;

success($order);
