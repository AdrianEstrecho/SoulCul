<?php
// GET /api/v1/customer/profile

$auth = requireAuth();
$userId = $auth['user_id'] ?? null;

if (!$userId) {
    error('User authentication failed', 401);
}

$db = getDB();

$stmt = $db->prepare("SELECT id, email, first_name, last_name, phone, birthday, gender, profile_image_url, created_at FROM users WHERE id = ? AND is_active = 1");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    error('User not found', 404);
}

success($user, 'Profile retrieved successfully');
