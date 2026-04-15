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

// GET /api/v1/admin/archive/users
requireAuth();
$db = getDB();

[$page, $limit, $offset] = getPagination();

$countStmt = $db->query("SELECT COUNT(*) FROM users WHERE is_active = 0");
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT id, CONCAT(first_name,' ',last_name) AS full_name,
            email, phone, updated_at AS archived_at
     FROM users WHERE is_active = 0
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute([$limit, $offset]);

paginated($stmt->fetchAll(), $total, $page, $limit);
