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

// GET /api/v1/admin/profile
$me = requireAuth();
$db = getDB();

$stmt = $db->prepare("SELECT id, email, full_name, phone, role, created_at FROM admins WHERE id = ?");
$stmt->execute([$me['admin_id']]);
$admin = $stmt->fetch();
if (!$admin) error('Admin not found', 404);

success($admin);
