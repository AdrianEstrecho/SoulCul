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

// GET /api/v1/customer/products/:id/reviews

$productId = $_route['id'] ?? null;

if (!$productId) {
    error('Product ID is required', 400);
}

$db = getDB();

try {
    $stmt = $db->prepare("
        SELECT
            cr.id,
            cr.rating,
            cr.comment,
            cr.created_at,
            u.first_name,
            u.last_name,
            u.profile_image_url
        FROM customer_reviews cr
        LEFT JOIN users u ON u.id = cr.user_id
        WHERE cr.product_id = ?
        ORDER BY cr.created_at DESC
    ");
    $stmt->execute([$productId]);
    $reviews = $stmt->fetchAll();

    success($reviews, 'Product reviews retrieved');
} catch (Throwable $e) {
    success([], 'No reviews available');
}
