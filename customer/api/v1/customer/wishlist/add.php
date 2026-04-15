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

// POST /api/v1/customer/wishlist

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$body = getBody();
requireFields($body, ['product_id']);
$productId = (int) $body['product_id'];

if ($productId <= 0) {
    error('Invalid product id', 422);
}

$db = getDB();

$exists = $db->prepare("SELECT id FROM products WHERE id = ? AND is_active = 1 LIMIT 1");
$exists->execute([$productId]);
if (!$exists->fetch()) {
    error('Product not found', 404);
}

$stmt = $db->prepare(
    "INSERT INTO customer_wishlist (user_id, product_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE created_at = created_at"
);
$stmt->execute([$userId, $productId]);

success(['product_id' => $productId], 'Added to wishlist');
