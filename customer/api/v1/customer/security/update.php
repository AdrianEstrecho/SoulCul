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

// PATCH /api/v1/customer/security

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$body = getBody();
$db = getDB();

$updates = [];
$params = [];

if (array_key_exists('two_factor_enabled', $body)) {
    $updates[] = 'two_factor_enabled = ?';
    $params[] = filter_var($body['two_factor_enabled'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
}

if (array_key_exists('two_factor_method', $body)) {
    $method = strtolower(trim((string) $body['two_factor_method']));
    if (!in_array($method, ['sms', 'app'], true)) {
        error('Invalid two-factor method', 422);
    }
    $updates[] = 'two_factor_method = ?';
    $params[] = $method;
}

if (!$updates) {
    error('No security settings provided', 422);
}

try {
    $db->prepare(
        "INSERT IGNORE INTO customer_security_settings (user_id, two_factor_enabled, two_factor_method)
         VALUES (?, 0, 'sms')"
    )->execute([$userId]);

    $params[] = $userId;
    $sql = "UPDATE customer_security_settings SET " . implode(', ', $updates) . " WHERE user_id = ?";
    $db->prepare($sql)->execute($params);

    $settingsStmt = $db->prepare(
        "SELECT two_factor_enabled, two_factor_method, updated_at
         FROM customer_security_settings
         WHERE user_id = ?
         LIMIT 1"
    );
    $settingsStmt->execute([$userId]);
    $settings = $settingsStmt->fetch();

    createCustomerNotification(
        $db,
        $userId,
        'Security settings updated',
        'Your account security settings were updated successfully.',
        'security'
    );

    success([
        'two_factor_enabled' => (bool) ($settings['two_factor_enabled'] ?? false),
        'two_factor_method' => $settings['two_factor_method'] ?? 'sms',
        'updated_at' => $settings['updated_at'] ?? null,
    ], 'Security settings updated successfully');
} catch (Throwable $e) {
    error('Security settings are unavailable. Run backend/migration.sql first.', 500);
}
