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

// Remove item from cart

$auth = requireAuth();
$userId = $auth['user_id'];
$db = getDB();
$itemId = $_route['item_id'];

$stmt = $db->prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?");
$stmt->execute([$itemId, $userId]);

success(null, 'Item removed from cart successfully');