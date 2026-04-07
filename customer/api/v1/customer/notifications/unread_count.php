<?php
// GET /api/v1/customer/notifications/unread-count

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();

try {
    $stmt = $db->prepare(
        "SELECT COUNT(*)
         FROM customer_notifications
         WHERE user_id = ? AND is_read = 0"
    );
    $stmt->execute([$userId]);
    $count = (int) $stmt->fetchColumn();

    success(['unread_count' => $count], 'Unread notification count retrieved');
} catch (Throwable $e) {
    error('Notifications are unavailable. Run backend/migration.sql first.', 500);
}
