<?php
// PATCH /api/v1/admin/archive/users/:id/restore
$me = requireAuth();
$db = getDB();
$id = (int) $_route['id'];

$chk = $db->prepare("SELECT email FROM users WHERE id = ? AND is_active = 0");
$chk->execute([$id]);
$user = $chk->fetch();
if (!$user) error('Archived user not found', 404);

$db->prepare("UPDATE users SET is_active = 1 WHERE id = ?")->execute([$id]);
logAudit($db, $me['admin_id'], 'Unarchive', 'User', $user['email'], 'User restored');
success(null, 'User restored');
