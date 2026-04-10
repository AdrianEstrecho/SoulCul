<?php
// GET /api/v1/customer/products/:id

$productId = $_route['id'] ?? null;

if (!$productId) {
    error('Product ID is required', 400);
}

$db = getDB();

try {
    $stmt = $db->prepare("
        SELECT 
            p.*, 
            l.name AS location,
            c.name AS category,
            a.full_name AS seller_name,
            COALESCE((
                SELECT COUNT(*)
                FROM customer_reviews cr
                WHERE cr.product_id = p.id
            ), 0) AS review_count,
            COALESCE((
                SELECT ROUND(AVG(cr2.rating), 2)
                FROM customer_reviews cr2
                WHERE cr2.product_id = p.id
            ), p.rating_average, 0) AS rating_average
        FROM products p
        LEFT JOIN locations l ON p.location_id = l.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN admins a ON p.admin_id = a.id
        WHERE p.id = ? AND p.is_active = 1
    ");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
} catch (Throwable $e) {
    // Fallback for environments that haven't applied migration.sql yet.
    $stmt = $db->prepare("
        SELECT
            p.*,
            l.name AS location,
            c.name AS category,
            a.full_name AS seller_name,
            0 AS review_count
        FROM products p
        LEFT JOIN locations l ON p.location_id = l.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN admins a ON p.admin_id = a.id
        WHERE p.id = ? AND p.is_active = 1
    ");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
}

if (!$product) {
    error('Product not found', 404);
}

success($product, 'Product details retrieved');
