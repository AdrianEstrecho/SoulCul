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

// PATCH /api/v1/customer/notifications/:id/read

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$notificationId = (int) ($_route['id'] ?? 0);
if ($notificationId <= 0) {
    error('Invalid notification id', 422);
}

$db = getDB();

try {
    $check = $db->prepare(
        "SELECT id
         FROM customer_notifications
         WHERE id = ? AND user_id = ?"
    );
    $check->execute([$notificationId, $userId]);

    if (!$check->fetch()) {
        error('Notification not found', 404);
    }

    $update = $db->prepare(
        "UPDATE customer_notifications
         SET is_read = 1,
             read_at = COALESCE(read_at, NOW())
         WHERE id = ? AND user_id = ?"
    );
    $update->execute([$notificationId, $userId]);

    success(null, 'Notification marked as read');
} catch (Throwable $e) {
    error('Notifications are unavailable. Run backend/migration.sql first.', 500);
}
