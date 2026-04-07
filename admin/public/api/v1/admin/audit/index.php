<?php
// GET /api/v1/admin/audit
requireAuth();
$db = getDB();

[$page, $limit, $offset] = getPagination();

$where  = [];
$params = [];

if ($action = getParam('action')) {
    $where[]  = "al.action = ?";
    $params[] = ucfirst(strtolower($action));
}
if ($entity = getParam('entity')) {
    $where[]  = "al.entity = ?";
    $params[] = $entity;
}
if ($adminId = getParam('admin_id')) {
    $where[]  = "al.admin_id = ?";
    $params[] = (int) $adminId;
}
if ($from = getParam('date_from')) {
    $where[]  = "al.created_at >= ?";
    $params[] = $from . ' 00:00:00';
}
if ($to = getParam('date_to')) {
    $where[]  = "al.created_at <= ?";
    $params[] = $to . ' 23:59:59';
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$countStmt = $db->prepare("SELECT COUNT(*) FROM audit_logs al $whereSQL");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT al.id, al.action, al.entity, al.entity_name,
            al.description, al.ip_address, al.created_at,
            a.full_name AS admin_name, a.email AS admin_email
     FROM audit_logs al
     LEFT JOIN admins a ON al.admin_id = a.id
     $whereSQL
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute([...$params, $limit, $offset]);

paginated($stmt->fetchAll(), $total, $page, $limit);
