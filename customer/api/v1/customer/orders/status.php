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

$cancellationReasonRaw = (string) ($body['cancellation_reason'] ?? $body['cancellation_reason_label'] ?? $body['reason'] ?? '');
$normalizeReasonToken = static function (string $value): string {
    $token = strtolower(trim($value));
    $normalized = preg_replace('/[\s-]+/', '_', $token);
    return is_string($normalized) ? $normalized : $token;
};
$cancellationReasonInput = $normalizeReasonToken($cancellationReasonRaw);
$cancellationReasonMap = [
    'changed_mind' => 'Changed my mind',
    'ordered_by_mistake' => 'Ordered by mistake',
    'found_better_price' => 'Found a better price elsewhere',
    'delivery_takes_too_long' => 'Delivery takes too long',
    'payment_issue' => 'Payment issue',
    'other' => 'Other',
];

$cancellationReasonAliases = [
    'changed_my_mind' => 'changed_mind',
    'change_of_mind' => 'changed_mind',
    'ordered_mistake' => 'ordered_by_mistake',
    'mistake' => 'ordered_by_mistake',
    'found_a_better_price_elsewhere' => 'found_better_price',
    'better_price' => 'found_better_price',
    'delivery_too_long' => 'delivery_takes_too_long',
    'takes_too_long' => 'delivery_takes_too_long',
];

$cancellationReasonLabelLookup = [];
foreach ($cancellationReasonMap as $reasonKey => $reasonLabel) {
    $cancellationReasonLabelLookup[$normalizeReasonToken($reasonLabel)] = $reasonKey;
}

if (!array_key_exists($cancellationReasonInput, $cancellationReasonMap)) {
    if (array_key_exists($cancellationReasonInput, $cancellationReasonAliases)) {
        $cancellationReasonInput = $cancellationReasonAliases[$cancellationReasonInput];
    } elseif (array_key_exists($cancellationReasonInput, $cancellationReasonLabelLookup)) {
        $cancellationReasonInput = $cancellationReasonLabelLookup[$cancellationReasonInput];
    }
}

if (!array_key_exists($cancellationReasonInput, $cancellationReasonMap)) {
    error('Please select a valid cancellation reason.', 422);
}

$cancellationReasonLabel = $cancellationReasonMap[$cancellationReasonInput];
$cancellationRemark = trim((string) ($body['cancellation_remark'] ?? ''));
if (strlen($cancellationRemark) > 500) {
    error('Cancellation remark must be 500 characters or less.', 422);
}

$db = getDB();

$stmt = $db->prepare(
    "SELECT o.id, o.order_number, o.user_id, o.status, o.customer_notes,
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

if (in_array($currentStatus, ['waiting_for_courier', 'shipped', 'to_be_delivered', 'delivered'], true)) {
    $fromLabel = orderWorkflowFormatStatusLabel($currentStatus);
    error("Order can no longer be cancelled once it is {$fromLabel}.", 422);
}

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

$cancellationDetails = "Cancellation reason: {$cancellationReasonLabel}";
if ($cancellationRemark !== '') {
    $cancellationDetails .= " | Remark: {$cancellationRemark}";
}

$existingNotes = trim((string) ($order['customer_notes'] ?? ''));
$nextCustomerNotes = $existingNotes === ''
    ? $cancellationDetails
    : $existingNotes . "\n" . $cancellationDetails;

try {
    $db->beginTransaction();

    if ($requestedStatus === 'cancelled') {
        orderWorkflowRestockOrderItems($db, $orderId);
    }

    $db->prepare("UPDATE orders SET status = ?, customer_notes = ? WHERE id = ?")
        ->execute([$requestedStatus, $nextCustomerNotes, $orderId]);

    $db->commit();
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    error('Unable to cancel order: ' . $e->getMessage(), 422);
}

$newStatusLabel = orderWorkflowFormatStatusLabel($requestedStatus);
createCustomerNotification(
    $db,
    $userId,
    'Order cancelled',
    "Your order {$order['order_number']} has been cancelled. Reason: {$cancellationReasonLabel}.",
    'order_status',
    [
        'order_id' => $orderId,
        'order_number' => $order['order_number'],
        'status' => $requestedStatus,
        'cancellation_reason' => $cancellationReasonInput,
        'cancellation_reason_label' => $cancellationReasonLabel,
        'cancellation_remark' => $cancellationRemark !== '' ? $cancellationRemark : null,
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
            "Order {$order['order_number']} was cancelled by the customer. Reason: {$cancellationReasonLabel}" .
                ($cancellationRemark !== '' ? ". Remark: {$cancellationRemark}" : '.'),
            'order_status',
            [
                'order_id' => $orderId,
                'order_number' => $order['order_number'],
                'status' => $requestedStatus,
                'source' => 'customer',
                'cancellation_reason' => $cancellationReasonInput,
                'cancellation_reason_label' => $cancellationReasonLabel,
                'cancellation_remark' => $cancellationRemark !== '' ? $cancellationRemark : null,
            ]
        );
    }
} catch (Throwable $e) {
    error_log('Unable to create admin cancellation notifications: ' . $e->getMessage());
}

success([
    'status' => $requestedStatus,
    'label' => $newStatusLabel,
    'cancellation_reason' => $cancellationReasonInput,
    'cancellation_reason_label' => $cancellationReasonLabel,
    'cancellation_remark' => $cancellationRemark !== '' ? $cancellationRemark : null,
], 'Order status updated');
