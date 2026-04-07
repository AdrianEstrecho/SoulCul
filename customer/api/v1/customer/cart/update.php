<?php
// Update cart item quantity

$auth = requireAuth();
$userId = $auth['user_id'];
$db = getDB();
$itemId = $_route['item_id'];
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['quantity'])) {
    error('Quantity is required', 400);
}

$stmt = $db->prepare("
    UPDATE cart_items SET quantity = ? 
    WHERE id = ? AND user_id = ?
");
$stmt->execute([$data['quantity'], $itemId, $userId]);

success(null, 'Cart updated successfully');