<?php
// GET /api/v1/customer/wishlist

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();

$stmt = $db->prepare(
    "SELECT
        cw.id AS wishlist_id,
        cw.product_id,
        cw.created_at,
        p.name,
        COALESCE(p.discount_price, p.price) AS price,
        p.featured_image_url,
        COALESCE(l.name, 'SouCul') AS location
     FROM customer_wishlist cw
     INNER JOIN products p ON p.id = cw.product_id
     LEFT JOIN locations l ON l.id = p.location_id
     WHERE cw.user_id = ? AND p.is_active = 1
     ORDER BY cw.created_at DESC"
);
$stmt->execute([$userId]);
$items = $stmt->fetchAll();

success($items, 'Wishlist retrieved successfully');
