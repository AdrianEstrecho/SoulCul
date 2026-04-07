<?php
// GET /api/v1/admin/notifications/unread-count

$auth = requireAuth();
$adminId = (int) ($auth['admin_id'] ?? 0);
if ($adminId <= 0) {
    error('Admin authentication failed', 401);
}

$db = getDB();

try {
    $stmt = $db->prepare(
        "SELECT COUNT(*)
         FROM admin_notifications
         WHERE admin_id = ? AND is_read = 0"
    );
    $stmt->execute([$adminId]);
    $count = (int) $stmt->fetchColumn();

    success(['unread_count' => $count], 'Unread notification count retrieved');
} catch (Throwable $e) {
    error('Notifications are unavailable. Run backend/migration.sql first.', 500);
}
