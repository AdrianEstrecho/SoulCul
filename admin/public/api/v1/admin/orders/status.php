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

// PATCH /api/v1/admin/orders/:id/status
$me   = requireAuth();
$db   = getDB();
$body = getBody();
$id   = (int) $_route['id'];
requireFields($body, ['status']);
require_once __DIR__ . '/../../../../../../shared/helpers/order_workflow.php';

$allowed = orderWorkflowAllowedStatuses();
$status  = orderWorkflowNormalizeStatus((string) $body['status']);
if (!in_array($status, $allowed)) {
    error('Invalid status. Allowed: ' . implode(', ', $allowed), 422);
}

$chk = $db->prepare("SELECT o.id, o.user_id, o.order_number, o.status,
                            (
                                SELECT p.payment_method
                                FROM payments p
                                WHERE p.order_id = o.id
                                ORDER BY p.id DESC
                                LIMIT 1
                            ) AS payment_method
                     FROM orders o
                     WHERE o.id = ?");
$chk->execute([$id]);
$order = $chk->fetch();
if (!$order) error('Order not found', 404);

$old = orderWorkflowNormalizeStatus((string) ($order['status'] ?? ''));
$paymentMethod = orderWorkflowResolvePaymentMethod((string) ($order['payment_method'] ?? ''), $old);
$allowedTransitions = orderWorkflowAllowedTransitions($old, $paymentMethod);

if (!in_array($status, $allowedTransitions, true)) {
    $allowedLabels = implode(', ', array_map('orderWorkflowFormatStatusLabel', $allowedTransitions));
    $fromLabel = orderWorkflowFormatStatusLabel($old);
    error("Invalid transition from {$fromLabel}. Allowed transitions: {$allowedLabels}", 422);
}

if ($status === $old) {
    success(['status' => $status], 'Order status unchanged');
}

$db->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$status, $id]);

try {
    if ($paymentMethod !== 'cod') {
        if ($status === 'online_payment_processed') {
            $db->prepare("UPDATE payments SET payment_status = 'completed', processed_at = COALESCE(processed_at, NOW()) WHERE order_id = ?")
                ->execute([$id]);
        } elseif ($status === 'online_payment_requested' || $status === 'pending') {
            $db->prepare("UPDATE payments SET payment_status = 'pending', processed_at = NULL WHERE order_id = ?")
                ->execute([$id]);
        } elseif ($status === 'cancelled') {
            $db->prepare("UPDATE payments SET payment_status = 'refunded' WHERE order_id = ? AND payment_status = 'completed'")
                ->execute([$id]);
        }
    }
} catch (Throwable $e) {
    error_log('Unable to sync payment status for order ' . $id . ': ' . $e->getMessage());
}

$oldLabel = orderWorkflowFormatStatusLabel($old);
$newLabel = orderWorkflowFormatStatusLabel($status);

logAudit($db, $me['admin_id'], 'Update', 'Order', $order['order_number'],
    "Status changed from {$oldLabel} to {$newLabel}");

createAdminNotification(
    $db,
    (int) $me['admin_id'],
    'Order status updated',
    "Order {$order['order_number']} status changed to {$newLabel}.",
    'order_status',
    [
        'order_id' => (int) $id,
        'order_number' => $order['order_number'],
        'status' => $status,
    ]
);

$orderUserId = (int) ($order['user_id'] ?? 0);
if ($orderUserId > 0) {
    createCustomerNotification(
        $db,
        $orderUserId,
        'Order update',
        "Your order {$order['order_number']} is now {$newLabel}.",
        'order_status',
        [
            'order_id' => (int) $id,
            'order_number' => $order['order_number'],
            'status' => $status,
        ]
    );
}

success(['status' => $status], 'Order status updated');
