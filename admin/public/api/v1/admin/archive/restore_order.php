<?php
// PATCH /api/v1/admin/archive/orders/:id/restore
$me = requireAuth();
$db = getDB();
$id = (int) $_route['id'];

$chk = $db->prepare("SELECT order_number FROM orders WHERE id = ? AND is_archived = 1");
$chk->execute([$id]);
$order = $chk->fetch();
if (!$order) error('Archived order not found', 404);

$db->prepare("UPDATE orders SET is_archived = 0 WHERE id = ?")->execute([$id]);
logAudit($db, $me['admin_id'], 'Unarchive', 'Order', $order['order_number'], 'Order restored');
success(null, 'Order restored');
