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
            CONCAT(u.first_name,' ',u.last_name) AS customer,
            u.email, u.phone
     FROM orders o
     JOIN users u ON o.user_id = u.id
     $whereSQL
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute([...$params, $limit, $offset]);
$orders = $stmt->fetchAll();

paginated($orders, $total, $page, $limit);
