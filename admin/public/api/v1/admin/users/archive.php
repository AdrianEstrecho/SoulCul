<?php
// DELETE /api/v1/admin/users/:id
$me = requireAuth();
$db = getDB();
$id = (int) $_route['id'];

$stmt = $db->prepare("SELECT email, is_active FROM users WHERE id = ?");
$stmt->execute([$id]);
$user = $stmt->fetch();
if (!$user) error('User not found', 404);

$db->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$id]);
logAudit($db, $me['admin_id'], 'Archive', 'User', $user['email'], 'User archived');
success(null, 'User archived');
