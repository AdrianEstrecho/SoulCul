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

// GET /api/v1/admin/admins
requireSuperAdmin();
$db = getDB();

$admins = $db->query(
    "SELECT id, email, full_name, phone, role, is_active, created_at
     FROM admins
     ORDER BY created_at ASC"
)->fetchAll();

success($admins);
