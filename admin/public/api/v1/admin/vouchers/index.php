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

// GET /api/v1/admin/vouchers
requireAuth();
$db = getDB();

[$page, $limit, $offset] = getPagination();

$where  = [];
$params = [];

if ($status = getParam('status')) {
    $where[]  = "status = ?";
    $params[] = strtolower($status);
}
if ($q = getParam('search')) {
    $where[]  = "code LIKE ?";
    $params[] = "%$q%";
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$countStmt = $db->prepare("SELECT COUNT(*) FROM vouchers $whereSQL");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT * FROM vouchers $whereSQL ORDER BY created_at DESC LIMIT ? OFFSET ?"
);
$stmt->execute([...$params, $limit, $offset]);

paginated($stmt->fetchAll(), $total, $page, $limit);
