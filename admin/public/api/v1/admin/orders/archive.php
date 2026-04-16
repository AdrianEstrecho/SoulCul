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

// DELETE /api/v1/admin/orders/:id
$me = requireAuth();
$db = getDB();
$id = (int) $_route['id'];
require_once __DIR__ . '/../../../../../../shared/helpers/order_workflow.php';

$chk = $db->prepare("SELECT order_number, status FROM orders WHERE id = ? AND status != 'archived'");
$chk->execute([$id]);
$order = $chk->fetch();
if (!$order) error('Order not found or already archived', 404);

$currentStatus = orderWorkflowNormalizeStatus((string) ($order['status'] ?? ''));
$allowedTransitions = orderWorkflowAllowedTransitions($currentStatus, '');
if (!in_array('cancelled', $allowedTransitions, true)) {
	error('Order can no longer be cancelled at its current status.', 422);
}

// Use a dedicated archived status — add 'archived' to the ENUM or use a flag column.
// Since the schema uses ENUM, we'll repurpose 'cancelled' and track it via audit,
// OR you can add is_archived BOOLEAN to orders (recommended — see migration at bottom).
// For now we mark it cancelled + log archive action so the frontend can filter it out.
$db->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$id]);

logAudit($db, $me['admin_id'], 'Archive', 'Order', $order['order_number'], 'Order archived');
success(null, 'Order archived');
