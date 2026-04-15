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

// GET /api/v1/customer/security/login-activity

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();

$activityStmt = $db->prepare(
    "SELECT id, title, message, created_at
     FROM customer_notifications
     WHERE user_id = ? AND type = 'login'
     ORDER BY created_at DESC
     LIMIT 20"
);
$activityStmt->execute([$userId]);
$rows = $activityStmt->fetchAll();

success($rows, 'Login activity retrieved successfully');
