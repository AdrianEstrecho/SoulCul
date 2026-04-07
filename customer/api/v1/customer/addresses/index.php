<?php
// GET /api/v1/customer/addresses

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();
$stmt = $db->prepare(
    "SELECT id, label, address_line, city, province, postal_code, phone, is_default, created_at, updated_at
     FROM customer_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, updated_at DESC, created_at DESC"
);
$stmt->execute([$userId]);
$addresses = $stmt->fetchAll();

success($addresses, 'Addresses retrieved successfully');
