<?php
// GET /api/v1/customer/orders

$auth = requireAuth();
$userId = $auth['user_id'] ?? null;

if (!$userId) {
    error('User authentication failed', 401);
}

$db = getDB();

$stmt = $db->prepare("
    SELECT 
    o.id, o.order_number, o.user_id,
    o.subtotal, o.tax_amount, o.shipping_cost, o.total_amount,
    o.status, o.shipping_address, o.shipping_city, o.shipping_province, o.shipping_phone,
    o.created_at,
           p.payment_method, p.payment_status,
           CONCAT(u.first_name,' ',u.last_name) AS customer
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN (
            SELECT p1.order_id, p1.payment_method, p1.payment_status
            FROM payments p1
            INNER JOIN (
                SELECT order_id, MAX(id) AS latest_id
                FROM payments
                GROUP BY order_id
            ) latest ON latest.latest_id = p1.id
        ) p ON p.order_id = o.id
    WHERE o.user_id = ? AND o.is_archived = 0
    ORDER BY o.created_at DESC
");
$stmt->execute([$userId]);
$orders = $stmt->fetchAll();

success($orders, 'Customer orders retrieved');
