<?php
// PATCH /api/v1/admin/orders/:id/status
$me   = requireAuth();
$db   = getDB();
$body = getBody();
$id   = (int) $_route['id'];
requireFields($body, ['status']);

$allowed = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
$status  = strtolower($body['status']);
if (!in_array($status, $allowed)) {
    error('Invalid status. Allowed: ' . implode(', ', $allowed), 422);
}

$chk = $db->prepare("SELECT id, user_id, order_number, status FROM orders WHERE id = ?");
$chk->execute([$id]);
$order = $chk->fetch();
if (!$order) error('Order not found', 404);

$old = $order['status'];
$db->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$status, $id]);

logAudit($db, $me['admin_id'], 'Update', 'Order', $order['order_number'],
    "Status changed from $old → $status");

$statusLabel = ucwords(str_replace('_', ' ', $status));
createAdminNotification(
    $db,
    (int) $me['admin_id'],
    'Order status updated',
    "Order {$order['order_number']} status changed to {$statusLabel}.",
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
        "Your order {$order['order_number']} is now {$statusLabel}.",
        'order_status',
        [
            'order_id' => (int) $id,
            'order_number' => $order['order_number'],
            'status' => $status,
        ]
    );
}

success(['status' => $status], 'Order status updated');
