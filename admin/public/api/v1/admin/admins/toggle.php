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

// PATCH /api/v1/admin/admins/:id/toggle
$me = requireSuperAdmin();
$db = getDB();
$id = (int) $_route['id'];

if ($id === $me['admin_id']) {
    error('You cannot deactivate your own account', 403);
}

$stmt = $db->prepare("SELECT id, full_name, is_active FROM admins WHERE id = ?");
$stmt->execute([$id]);
$admin = $stmt->fetch();
if (!$admin) error('Admin not found', 404);

$newStatus = $admin['is_active'] ? 0 : 1;
$db->prepare("UPDATE admins SET is_active = ? WHERE id = ?")->execute([$newStatus, $id]);

$action = $newStatus ? 'Activated' : 'Deactivated';
logAudit($db, $me['admin_id'], 'Update', 'Admin', $admin['full_name'], "Admin $action");

success(['is_active' => (bool) $newStatus], "Admin $action");
