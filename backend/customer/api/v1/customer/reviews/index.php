<?php
// GET /api/v1/customer/reviews

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();

try {
    $stmt = $db->prepare(
        "SELECT
            cr.id,
            cr.product_id,
            COALESCE(p.name, cr.product_name) AS product_name,
            cr.rating,
            cr.comment,
            cr.created_at,
            cr.updated_at
         FROM customer_reviews cr
         LEFT JOIN products p ON p.id = cr.product_id
         WHERE cr.user_id = ?
         ORDER BY cr.created_at DESC"
    );
    $stmt->execute([$userId]);
    $reviews = $stmt->fetchAll();

    success($reviews, 'Reviews retrieved successfully');
} catch (Throwable $e) {
    error('Reviews are unavailable. Run backend/migration.sql first.', 500);
}
