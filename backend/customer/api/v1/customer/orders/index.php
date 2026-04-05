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
        o.id, o.user_id, o.total_amount, o.status,
        o.shipping_address, o.created_at,
        CONCAT(u.first_name,' ',u.last_name) AS customer
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.user_id = ? AND o.is_archived = 0
    ORDER BY o.created_at DESC
");
$stmt->execute([$userId]);
$orders = $stmt->fetchAll();

success($orders, 'Customer orders retrieved');
