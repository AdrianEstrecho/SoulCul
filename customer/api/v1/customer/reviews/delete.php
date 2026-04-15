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

// DELETE /api/v1/customer/reviews/:id

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
$reviewId = (int) ($_route['id'] ?? 0);

if ($userId <= 0 || $reviewId <= 0) {
    error('Invalid request', 400);
}

$db = getDB();

try {
    $stmt = $db->prepare("DELETE FROM customer_reviews WHERE id = ? AND user_id = ?");
    $stmt->execute([$reviewId, $userId]);

    if ($stmt->rowCount() === 0) {
        error('Review not found', 404);
    }

    success(['removed' => true], 'Review removed successfully');
} catch (Throwable $e) {
    error('Reviews are unavailable. Run backend/migration.sql first.', 500);
}
