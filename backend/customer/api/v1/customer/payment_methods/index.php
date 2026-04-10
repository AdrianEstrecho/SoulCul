<?php
// GET /api/v1/customer/payment-methods

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();

try {
    $stmt = $db->prepare(
        "SELECT id, type, label, details_masked, is_default, created_at, updated_at
         FROM customer_payment_methods
         WHERE user_id = ? AND is_active = 1
         ORDER BY is_default DESC, created_at DESC"
    );
    $stmt->execute([$userId]);
    $methods = $stmt->fetchAll();

    success($methods, 'Payment methods retrieved successfully');
} catch (Throwable $e) {
    error('Payment methods are unavailable. Run backend/migration.sql first.', 500);
}
