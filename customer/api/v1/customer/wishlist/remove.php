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

// DELETE /api/v1/customer/wishlist/:product_id

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
$productId = (int) ($_route['product_id'] ?? 0);

if ($userId <= 0 || $productId <= 0) {
    error('Invalid request', 400);
}

$db = getDB();
$stmt = $db->prepare("DELETE FROM customer_wishlist WHERE user_id = ? AND product_id = ?");
$stmt->execute([$userId, $productId]);

success(['removed' => $stmt->rowCount() > 0], 'Wishlist item removed');
