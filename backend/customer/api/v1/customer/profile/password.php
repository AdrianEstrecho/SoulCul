<?php
// POST /api/v1/customer/profile/password

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$body = getBody();
requireFields($body, ['current_password', 'new_password', 'confirm_password']);

$db = getDB();

$stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ? AND is_active = 1 LIMIT 1");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    error('User not found', 404);
}

if (!password_verify((string) $body['current_password'], (string) $user['password_hash'])) {
    error('Current password is incorrect', 401);
}

if ((string) $body['new_password'] !== (string) $body['confirm_password']) {
    error('New passwords do not match', 422);
}

if (strlen((string) $body['new_password']) < 8) {
    error('New password must be at least 8 characters', 422);
}

$hash = password_hash((string) $body['new_password'], PASSWORD_BCRYPT);
$db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $userId]);

createCustomerNotification(
    $db,
    $userId,
    'Password updated',
    'Your account password was changed successfully.',
    'security'
);

success(null, 'Password updated successfully');
