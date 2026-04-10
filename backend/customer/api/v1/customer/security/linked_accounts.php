<?php
// GET /api/v1/customer/security/linked-accounts

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();

try {
    $stmt = $db->prepare(
        "SELECT id, provider, account_label, created_at
         FROM customer_linked_accounts
         WHERE user_id = ? AND is_active = 1
         ORDER BY created_at DESC"
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    success($rows, 'Linked accounts retrieved successfully');
} catch (Throwable $e) {
    error('Linked accounts are unavailable. Run backend/migration.sql first.', 500);
}
