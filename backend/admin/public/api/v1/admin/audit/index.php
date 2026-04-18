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

// GET /api/v1/admin/audit
$me = requireAdminOrHigher();
$db = getDB();

$currentRole = normalizeAdminRole((string)($me['role'] ?? ''));
$isSuperAdmin = $currentRole === 'super_admin';
$currentAdminId = (int)($me['admin_id'] ?? 0);

if (!$isSuperAdmin && $currentAdminId <= 0) {
    error('Unauthorized — invalid admin session', 401);
}

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
    if ($isSuperAdmin) {
        $where[]  = "al.admin_id = ?";
        $params[] = (int) $adminId;
    }
}
if ($from = getParam('date_from')) {
    $where[]  = "al.created_at >= ?";
    $params[] = $from . ' 00:00:00';
}
if ($to = getParam('date_to')) {
    $where[]  = "al.created_at <= ?";
    $params[] = $to . ' 23:59:59';
}

// Admins can only view their own audit history; super admins can view all.
if (!$isSuperAdmin) {
    $where[] = "al.admin_id = ?";
    $params[] = $currentAdminId;
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$countStmt = $db->prepare("SELECT COUNT(*) FROM audit_logs al $whereSQL");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT al.id, al.action, al.entity, al.entity_name,
            al.description, al.ip_address, al.created_at,
            a.full_name AS admin_name, a.email AS admin_email,
            a.role AS admin_role
     FROM audit_logs al
     LEFT JOIN admins a ON al.admin_id = a.id
     $whereSQL
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute([...$params, $limit, $offset]);

paginated($stmt->fetchAll(), $total, $page, $limit);
