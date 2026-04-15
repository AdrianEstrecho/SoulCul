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