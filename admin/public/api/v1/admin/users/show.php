<?php
// GET /api/v1/admin/users/:id
requireAuth();
$db = getDB();
$id = (int) $_route['id'];

$stmt = $db->prepare(
    "SELECT id, CONCAT(first_name,' ',last_name) AS full_name,
            email, phone, is_active, created_at
     FROM users WHERE id = ?"
);
$stmt->execute([$id]);
$user = $stmt->fetch();
if (!$user) error('User not found', 404);

$orders = $db->prepare(
    "SELECT id, order_number, status, total_amount, created_at
     FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
);
$orders->execute([$id]);
$user['orders'] = $orders->fetchAll();

success($user);
