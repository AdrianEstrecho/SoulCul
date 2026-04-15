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

// PATCH /api/v1/admin/notifications/:id/read

$auth = requireAuth();
$adminId = (int) ($auth['admin_id'] ?? 0);
if ($adminId <= 0) {
    error('Admin authentication failed', 401);
}

$notificationId = (int) ($_route['id'] ?? 0);
if ($notificationId <= 0) {
    error('Invalid notification id', 422);
}

$db = getDB();

try {
    $check = $db->prepare(
        "SELECT id
         FROM admin_notifications
         WHERE id = ? AND admin_id = ?"
    );
    $check->execute([$notificationId, $adminId]);

    if (!$check->fetch()) {
        error('Notification not found', 404);
    }

    $update = $db->prepare(
        "UPDATE admin_notifications
         SET is_read = 1,
             read_at = COALESCE(read_at, NOW())
         WHERE id = ? AND admin_id = ?"
    );
    $update->execute([$notificationId, $adminId]);

    success(null, 'Notification marked as read');
} catch (Throwable $e) {
    error('Notifications are unavailable. Run backend/migration.sql first.', 500);
}
