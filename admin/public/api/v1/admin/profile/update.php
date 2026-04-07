<?php
// PATCH /api/v1/admin/profile
$me   = requireAuth();
$db   = getDB();
$body = getBody();

$fields = [];
$params = [];

if (isset($body['full_name']) && trim($body['full_name'])) {
    $fields[] = 'full_name = ?';
    $params[] = trim($body['full_name']);
}
if (isset($body['email']) && trim($body['email'])) {
    // check email uniqueness
    $chk = $db->prepare("SELECT id FROM admins WHERE email = ? AND id != ?");
    $chk->execute([trim($body['email']), $me['admin_id']]);
    if ($chk->fetch()) error('Email already in use', 409);
    $fields[] = 'email = ?';
    $params[] = trim($body['email']);
}
if (isset($body['phone'])) {
    $fields[] = 'phone = ?';
    $params[] = trim($body['phone']);
}

if (!$fields) error('No fields provided to update', 422);

$params[] = $me['admin_id'];
$db->prepare("UPDATE admins SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

logAudit($db, $me['admin_id'], 'Update', 'System', 'Profile', 'Admin updated their profile');
success(null, 'Profile updated');
