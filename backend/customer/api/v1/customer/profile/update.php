<?php
// PATCH /api/v1/customer/profile

$auth = requireAuth();
$userId = $auth['user_id'] ?? null;

if (!$userId) {
    error('User authentication failed', 401);
}

$body = getBody();
$firstName = $body['first_name'] ?? null;
$lastName = $body['last_name'] ?? null;

$db = getDB();

if ($firstName || $lastName) {
    $updates = [];
    $params = [];

    if ($firstName) {
        $updates[] = "first_name = ?";
        $params[] = $firstName;
    }
    if ($lastName) {
        $updates[] = "last_name = ?";
        $params[] = $lastName;
    }

    $params[] = $userId;

    $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    success([], 'Profile updated successfully');
} else {
    error('No fields to update', 400);
}
