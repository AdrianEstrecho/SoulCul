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

// PATCH /api/v1/customer/notifications/read-all

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();

try {
    $stmt = $db->prepare(
        "UPDATE customer_notifications
         SET is_read = 1,
             read_at = COALESCE(read_at, NOW())
         WHERE user_id = ? AND is_read = 0"
    );
    $stmt->execute([$userId]);

    success(['updated' => $stmt->rowCount()], 'All notifications marked as read');
} catch (Throwable $e) {
    error('Notifications are unavailable. Run backend/migration.sql first.', 500);
}
