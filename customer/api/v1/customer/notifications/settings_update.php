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

// PATCH /api/v1/customer/notification-settings

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$body = getBody();
$db = getDB();

$map = [
    'orders' => 'order_updates',
    'promos' => 'promotions',
    'wishlist' => 'wishlist_alerts',
    'newsletter' => 'newsletter',
    'sms' => 'sms_notifications',
];

$fields = [];
$params = [];

foreach ($map as $key => $column) {
    if (array_key_exists($key, $body)) {
        $fields[] = "$column = ?";
        $params[] = filter_var($body[$key], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    }
}

if (!$fields) {
    error('No notification settings provided', 422);
}

try {
    $db->prepare(
        "INSERT IGNORE INTO customer_notification_settings
            (user_id, order_updates, promotions, wishlist_alerts, newsletter, sms_notifications)
         VALUES (?, 1, 1, 0, 0, 1)"
    )->execute([$userId]);

    $params[] = $userId;
    $sql = "UPDATE customer_notification_settings SET " . implode(', ', $fields) . " WHERE user_id = ?";
    $db->prepare($sql)->execute($params);

    createCustomerNotification(
        $db,
        $userId,
        'Notification preferences updated',
        'Your notification settings were updated successfully.',
        'settings'
    );

    $stmt = $db->prepare(
        "SELECT order_updates, promotions, wishlist_alerts, newsletter, sms_notifications
         FROM customer_notification_settings
         WHERE user_id = ?
         LIMIT 1"
    );
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    success([
        'orders' => (bool) $row['order_updates'],
        'promos' => (bool) $row['promotions'],
        'wishlist' => (bool) $row['wishlist_alerts'],
        'newsletter' => (bool) $row['newsletter'],
        'sms' => (bool) $row['sms_notifications'],
    ], 'Notification settings updated');
} catch (Throwable $e) {
    error('Notification settings are unavailable. Run backend/migration.sql first.', 500);
}
