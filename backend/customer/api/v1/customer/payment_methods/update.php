<?php
// PATCH /api/v1/customer/payment-methods/:id

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
$methodId = (int) ($_route['id'] ?? 0);

if ($userId <= 0 || $methodId <= 0) {
    error('Invalid request', 400);
}

$body = getBody();
$db = getDB();

try {
    $exists = $db->prepare(
        "SELECT id FROM customer_payment_methods
         WHERE id = ? AND user_id = ? AND is_active = 1
         LIMIT 1"
    );
    $exists->execute([$methodId, $userId]);
    if (!$exists->fetch()) {
        error('Payment method not found', 404);
    }

    $updates = [];
    $params = [];

    if (array_key_exists('label', $body)) {
        $label = trim((string) $body['label']);
        if ($label === '') {
            error('Label cannot be empty', 422);
        }
        $updates[] = 'label = ?';
        $params[] = $label;
    }

    if (array_key_exists('details_masked', $body)) {
        $detailsMasked = trim((string) $body['details_masked']);
        if ($detailsMasked === '') {
            error('Payment details cannot be empty', 422);
        }
        $updates[] = 'details_masked = ?';
        $params[] = $detailsMasked;
    }

    if (array_key_exists('is_default', $body)) {
        $setDefault = filter_var($body['is_default'], FILTER_VALIDATE_BOOLEAN);
        $updates[] = 'is_default = ?';
        $params[] = $setDefault ? 1 : 0;

        if ($setDefault) {
            $db->prepare("UPDATE customer_payment_methods SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
        }
    }

    if (!$updates) {
        error('No fields to update', 400);
    }

    $params[] = $methodId;
    $params[] = $userId;

    $sql = "UPDATE customer_payment_methods SET " . implode(', ', $updates) . " WHERE id = ? AND user_id = ?";
    $db->prepare($sql)->execute($params);

    $fetch = $db->prepare(
        "SELECT id, type, label, details_masked, is_default, created_at, updated_at
         FROM customer_payment_methods
         WHERE id = ? AND user_id = ?
         LIMIT 1"
    );
    $fetch->execute([$methodId, $userId]);
    $method = $fetch->fetch();

    success($method, 'Payment method updated successfully');
} catch (Throwable $e) {
    error('Payment methods are unavailable. Run backend/migration.sql first.', 500);
}
