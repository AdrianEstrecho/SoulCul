<?php
// GET /api/v1/admin/users
requireAuth();
$db = getDB();

[$page, $limit, $offset] = getPagination();

$where  = ["u.is_active = 1"];
$params = [];

if ($q = getParam('search')) {
    $where[]  = "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)";
    $params[] = "%$q%";
    $params[] = "%$q%";
    $params[] = "%$q%";
}

$whereSQL = 'WHERE ' . implode(' AND ', $where);

$countStmt = $db->prepare("SELECT COUNT(*) FROM users u $whereSQL");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT u.id,
            u.first_name,
            u.last_name,
            CONCAT(u.first_name,' ',u.last_name) AS full_name,
            u.email, u.phone, u.is_active, u.created_at,
            COUNT(o.id) AS total_orders,
            COALESCE(SUM(o.total_amount), 0) AS total_spent
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     $whereSQL
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute([...$params, $limit, $offset]);

paginated($stmt->fetchAll(), $total, $page, $limit);
