<?php
// GET /api/v1/customer/products/:id

$productId = $_route['id'] ?? null;

if (!$productId) {
    error('Product ID is required', 400);
}

$db = getDB();

$stmt = $db->prepare("
    SELECT 
        p.*, 
        l.name AS location, 
        c.name AS category
    FROM products p
    LEFT JOIN locations l ON p.location_id = l.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.is_active = 1
");
$stmt->execute([$productId]);
$product = $stmt->fetch();

if (!$product) {
    error('Product not found', 404);
}

success($product, 'Product details retrieved');
