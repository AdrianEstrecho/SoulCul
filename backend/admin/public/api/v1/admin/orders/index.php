<?php
// GET /api/v1/admin/orders
requireAuth();
$db = getDB();

[$page, $limit, $offset] = getPagination();

$where  = [];
$params = [];

if ($status = getParam('status')) {
    $where[]  = "o.status = ?";
    $params[] = strtolower($status);
}
if ($q = getParam('search')) {
    $where[]  = "(o.order_number LIKE ? OR CONCAT(u.first_name,' ',u.last_name) LIKE ?)";
    $params[] = "%$q%";
    $params[] = "%$q%";
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$countStmt = $db->prepare("SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id $whereSQL");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT o.id, o.order_number, o.status, o.subtotal, o.total_amount,
            o.shipping_address, o.shipping_city, o.shipping_province,
            o.shipping_phone, o.created_at,
            p.payment_method, p.payment_status,
            CONCAT(u.first_name,' ',u.last_name) AS customer,
            u.email, u.phone
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN (
        SELECT p1.order_id, p1.payment_method, p1.payment_status
        FROM payments p1
        INNER JOIN (
            SELECT order_id, MAX(id) AS latest_id
            FROM payments
            GROUP BY order_id
        ) latest ON latest.latest_id = p1.id
     ) p ON p.order_id = o.id
     $whereSQL
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute([...$params, $limit, $offset]);
$orders = $stmt->fetchAll();

paginated($orders, $total, $page, $limit);
