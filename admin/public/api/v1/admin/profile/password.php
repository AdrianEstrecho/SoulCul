<?php
// POST /api/v1/admin/profile/password
$me   = requireAuth();
$db   = getDB();
$body = getBody();
requireFields($body, ['current_password', 'new_password', 'confirm_password']);

$stmt = $db->prepare("SELECT password_hash FROM admins WHERE id = ?");
$stmt->execute([$me['admin_id']]);
$admin = $stmt->fetch();

if (!password_verify($body['current_password'], $admin['password_hash'])) {
    error('Current password is incorrect', 401);
}
if ($body['new_password'] !== $body['confirm_password']) {
    error('New passwords do not match', 422);
}
if (strlen($body['new_password']) < 6) {
    error('New password must be at least 6 characters', 422);
}

$hash = password_hash($body['new_password'], PASSWORD_BCRYPT);
$db->prepare("UPDATE admins SET password_hash = ? WHERE id = ?")->execute([$hash, $me['admin_id']]);

logAudit($db, $me['admin_id'], 'Update', 'System', 'Password', 'Admin changed their password');
success(null, 'Password updated');
