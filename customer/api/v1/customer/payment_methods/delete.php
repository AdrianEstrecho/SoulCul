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

// DELETE /api/v1/customer/payment-methods/:id

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
$methodId = (int) ($_route['id'] ?? 0);

if ($userId <= 0 || $methodId <= 0) {
    error('Invalid request', 400);
}

$db = getDB();

try {
    $fetch = $db->prepare(
        "SELECT id, is_default
         FROM customer_payment_methods
         WHERE id = ? AND user_id = ? AND is_active = 1
         LIMIT 1"
    );
    $fetch->execute([$methodId, $userId]);
    $method = $fetch->fetch();

    if (!$method) {
        error('Payment method not found', 404);
    }

    $db->prepare(
        "UPDATE customer_payment_methods
         SET is_active = 0, is_default = 0
         WHERE id = ? AND user_id = ?"
    )->execute([$methodId, $userId]);

    if ((int) $method['is_default'] === 1) {
        $fallback = $db->prepare(
            "SELECT id FROM customer_payment_methods
             WHERE user_id = ? AND is_active = 1
             ORDER BY updated_at DESC, created_at DESC
             LIMIT 1"
        );
        $fallback->execute([$userId]);
        $next = $fallback->fetch();

        if ($next) {
            $db->prepare("UPDATE customer_payment_methods SET is_default = 1 WHERE id = ?")->execute([(int) $next['id']]);
        }
    }

    success(['removed' => true], 'Payment method removed successfully');
} catch (Throwable $e) {
    error('Payment methods are unavailable. Run backend/migration.sql first.', 500);
}
