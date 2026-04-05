<?php
// Get cart items for authenticated user

$auth = requireAuth();
$userId = $auth['user_id'];
$db = getDB();

$stmt = $db->prepare("
    SELECT ci.id, ci.quantity, ci.added_at,
           p.id as product_id, p.name, p.price,
           p.discount_price, p.featured_image_url
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
");
$stmt->execute([$userId]);
$items = $stmt->fetchAll();

success($items, 'Cart retrieved successfully');