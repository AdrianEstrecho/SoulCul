<?php
// GET /api/v1/customer/security

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();

try {
    $db->prepare(
        "INSERT IGNORE INTO customer_security_settings (user_id, two_factor_enabled, two_factor_method)
         VALUES (?, 0, 'sms')"
    )->execute([$userId]);

    $settingsStmt = $db->prepare(
        "SELECT two_factor_enabled, two_factor_method, updated_at
         FROM customer_security_settings
         WHERE user_id = ?
         LIMIT 1"
    );
    $settingsStmt->execute([$userId]);
    $settings = $settingsStmt->fetch();

    $linkedStmt = $db->prepare(
        "SELECT id, provider, account_label, created_at
         FROM customer_linked_accounts
         WHERE user_id = ? AND is_active = 1
         ORDER BY created_at DESC"
    );
    $linkedStmt->execute([$userId]);
    $linkedAccounts = $linkedStmt->fetchAll();

    success([
        'two_factor_enabled' => (bool) ($settings['two_factor_enabled'] ?? false),
        'two_factor_method' => $settings['two_factor_method'] ?? 'sms',
        'updated_at' => $settings['updated_at'] ?? null,
        'linked_accounts' => $linkedAccounts,
    ], 'Security settings retrieved');
} catch (Throwable $e) {
    error('Security settings are unavailable. Run backend/migration.sql first.', 500);
}
