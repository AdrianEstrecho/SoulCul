<?php
// PATCH /api/v1/customer/orders/:id/status

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
$orderId = (int) ($_route['id'] ?? 0);
$body = getBody();
requireFields($body, ['status']);

if ($userId <= 0 || $orderId <= 0) {
    error('Invalid request', 400);
}

require_once __DIR__ . '/../../../../../shared/helpers/order_workflow.php';

$requestedStatus = orderWorkflowNormalizeStatus((string) ($body['status'] ?? ''));
if ($requestedStatus !== 'cancelled') {
    error('Customers can only update order status to Cancelled.', 403);
}

$db = getDB();

$stmt = $db->prepare(
    "SELECT o.id, o.order_number, o.user_id, o.status,
            (
                SELECT p.payment_method
                FROM payments p
                WHERE p.order_id = o.id
                ORDER BY p.id DESC
                LIMIT 1
            ) AS payment_method
     FROM orders o
     WHERE o.id = ? AND o.user_id = ? AND o.is_archived = 0"
);
$stmt->execute([$orderId, $userId]);
$order = $stmt->fetch();
if (!$order) {
    error('Order not found', 404);
}

$currentStatus = orderWorkflowNormalizeStatus((string) ($order['status'] ?? ''));
$paymentMethod = orderWorkflowResolvePaymentMethod((string) ($order['payment_method'] ?? ''), $currentStatus);
$allowedTransitions = orderWorkflowAllowedTransitions($currentStatus, $paymentMethod);

if (!in_array($requestedStatus, $allowedTransitions, true)) {
    $allowedLabels = implode(', ', array_map('orderWorkflowFormatStatusLabel', $allowedTransitions));
    $fromLabel = orderWorkflowFormatStatusLabel($currentStatus);
    error("Order cannot be cancelled from {$fromLabel}. Allowed transitions: {$allowedLabels}", 422);
}

if ($requestedStatus === $currentStatus) {
    success(['status' => $requestedStatus], 'Order status unchanged');
}

$db->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$requestedStatus, $orderId]);

$newStatusLabel = orderWorkflowFormatStatusLabel($requestedStatus);
createCustomerNotification(
    $db,
    $userId,
    'Order cancelled',
    "Your order {$order['order_number']} has been cancelled.",
    'order_status',
    [
        'order_id' => $orderId,
        'order_number' => $order['order_number'],
        'status' => $requestedStatus,
    ]
);

try {
    $adminStmt = $db->query("SELECT id FROM admins WHERE is_active = 1");
    $admins = $adminStmt->fetchAll();

    foreach ($admins as $adminRow) {
        $adminId = (int) ($adminRow['id'] ?? 0);
        if ($adminId <= 0) {
            continue;
        }

        createAdminNotification(
            $db,
            $adminId,
            'Order cancelled by customer',
            "Order {$order['order_number']} was cancelled by the customer.",
            'order_status',
            [
                'order_id' => $orderId,
                'order_number' => $order['order_number'],
                'status' => $requestedStatus,
                'source' => 'customer',
            ]
        );
    }
} catch (Throwable $e) {
    error_log('Unable to create admin cancellation notifications: ' . $e->getMessage());
}

success(['status' => $requestedStatus, 'label' => $newStatusLabel], 'Order status updated');
