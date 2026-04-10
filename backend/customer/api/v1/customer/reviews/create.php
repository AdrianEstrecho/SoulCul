<?php
// POST /api/v1/customer/reviews

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$body = getBody();
$db = getDB();

$rating = (int) ($body['rating'] ?? 0);
if ($rating < 1 || $rating > 5) {
    error('Rating must be between 1 and 5', 422);
}

$comment = trim((string) ($body['comment'] ?? ''));
if ($comment === '') {
    error('Review comment is required', 422);
}

$productIdRaw = $body['product_id'] ?? null;
$productId = is_numeric($productIdRaw) ? (int) $productIdRaw : null;
$productName = trim((string) ($body['product_name'] ?? ''));

if ($productId !== null && $productId > 0) {
    $productStmt = $db->prepare("SELECT id, name FROM products WHERE id = ? LIMIT 1");
    $productStmt->execute([$productId]);
    $product = $productStmt->fetch();

    if (!$product) {
        error('Product not found', 404);
    }

    if ($productName === '') {
        $productName = (string) $product['name'];
    }
} else {
    $productId = null;
}

if ($productName === '') {
    error('Product name is required when product is not selected', 422);
}

try {
    $insert = $db->prepare(
        "INSERT INTO customer_reviews (user_id, product_id, product_name, rating, comment)
         VALUES (?, ?, ?, ?, ?)"
    );
    $insert->execute([$userId, $productId, $productName, $rating, $comment]);

    $id = (int) $db->lastInsertId();
    $fetch = $db->prepare(
        "SELECT id, product_id, product_name, rating, comment, created_at, updated_at
         FROM customer_reviews
         WHERE id = ? AND user_id = ?
         LIMIT 1"
    );
    $fetch->execute([$id, $userId]);
    $review = $fetch->fetch();

    success($review, 'Review added successfully');
} catch (Throwable $e) {
    error('Reviews are unavailable. Run backend/migration.sql first.', 500);
}
