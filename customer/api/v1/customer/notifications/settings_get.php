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

// GET /api/v1/customer/notification-settings

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();

try {
    $db->prepare(
        "INSERT IGNORE INTO customer_notification_settings
            (user_id, order_updates, promotions, wishlist_alerts, newsletter, sms_notifications)
         VALUES (?, 1, 1, 0, 0, 1)"
    )->execute([$userId]);

    $stmt = $db->prepare(
        "SELECT order_updates, promotions, wishlist_alerts, newsletter, sms_notifications
         FROM customer_notification_settings
         WHERE user_id = ?
         LIMIT 1"
    );
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    if (!$row) {
        error('Notification settings not found', 404);
    }

    success([
        'orders' => (bool) $row['order_updates'],
        'promos' => (bool) $row['promotions'],
        'wishlist' => (bool) $row['wishlist_alerts'],
        'newsletter' => (bool) $row['newsletter'],
        'sms' => (bool) $row['sms_notifications'],
    ], 'Notification settings retrieved');
} catch (Throwable $e) {
    error('Notification settings are unavailable. Run backend/migration.sql first.', 500);
}
