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

// PATCH /api/v1/admin/users/:id/toggle
$me = requireAuth();
$db = getDB();
$id = (int) $_route['id'];

$stmt = $db->prepare("SELECT id, email, is_active FROM users WHERE id = ?");
$stmt->execute([$id]);
$user = $stmt->fetch();
if (!$user) error('User not found', 404);

$newStatus = $user['is_active'] ? 0 : 1;
$db->prepare("UPDATE users SET is_active = ? WHERE id = ?")->execute([$newStatus, $id]);

$action = $newStatus ? 'Activated' : 'Deactivated';
logAudit($db, $me['admin_id'], 'Update', 'User', $user['email'], "User $action");

success(['is_active' => (bool) $newStatus], "User $action");
