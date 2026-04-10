<?php
// POST /api/v1/customer/payment-methods

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$body = getBody();
requireFields($body, ['type', 'label', 'details_masked']);

$type = strtolower(trim((string) $body['type']));
$label = trim((string) $body['label']);
$detailsMasked = trim((string) $body['details_masked']);
$allowedTypes = ['visa', 'gcash', 'maya', 'paypal'];

if (!in_array($type, $allowedTypes, true)) {
    error('Unsupported payment method type', 422);
}

if ($label === '' || $detailsMasked === '') {
    error('Payment method details are required', 422);
}

$db = getDB();

try {
    $countStmt = $db->prepare("SELECT COUNT(*) AS total FROM customer_payment_methods WHERE user_id = ? AND is_active = 1");
    $countStmt->execute([$userId]);
    $total = (int) ($countStmt->fetch()['total'] ?? 0);

    $requestedDefault = filter_var($body['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $isDefault = $total === 0 ? true : $requestedDefault;

    if ($isDefault) {
        $db->prepare("UPDATE customer_payment_methods SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
    }

    $insert = $db->prepare(
        "INSERT INTO customer_payment_methods
            (user_id, type, label, details_masked, is_default, is_active)
         VALUES (?, ?, ?, ?, ?, 1)"
    );
    $insert->execute([$userId, $type, $label, $detailsMasked, $isDefault ? 1 : 0]);

    $id = (int) $db->lastInsertId();
    $fetch = $db->prepare(
        "SELECT id, type, label, details_masked, is_default, created_at, updated_at
         FROM customer_payment_methods
         WHERE id = ? AND user_id = ?
         LIMIT 1"
    );
    $fetch->execute([$id, $userId]);
    $method = $fetch->fetch();

    success($method, 'Payment method added successfully');
} catch (Throwable $e) {
    error('Payment methods are unavailable. Run backend/migration.sql first.', 500);
}
