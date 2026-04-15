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

// GET /api/v1/admin/archive/orders
requireAuth();
$db = getDB();

[$page, $limit, $offset] = getPagination();

// Archived orders are flagged via is_archived column (see migration)
$countStmt = $db->query("SELECT COUNT(*) FROM orders WHERE is_archived = 1");
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT o.id, o.order_number, o.status, o.total_amount, o.updated_at AS archived_at,
            CONCAT(u.first_name,' ',u.last_name) AS customer, u.email
     FROM orders o
     JOIN users u ON o.user_id = u.id
     WHERE o.is_archived = 1
     ORDER BY o.updated_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute([$limit, $offset]);

paginated($stmt->fetchAll(), $total, $page, $limit);
