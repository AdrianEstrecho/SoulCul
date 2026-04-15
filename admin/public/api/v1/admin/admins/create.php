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

// POST /api/v1/admin/admins
$me   = requireSuperAdmin();
$db   = getDB();
$body = getBody();
requireFields($body, ['email', 'password', 'full_name']);

$email = trim(strtolower($body['email']));

// Check duplicate
$chk = $db->prepare("SELECT id FROM admins WHERE email = ?");
$chk->execute([$email]);
if ($chk->fetch()) error('Email already in use', 409);

if (strlen($body['password']) < 6) {
    error('Password must be at least 6 characters', 422);
}

$allowedRoles = ['super_admin', 'shop_owner', 'inventory_manager'];
$role = in_array($body['role'] ?? '', $allowedRoles) ? $body['role'] : 'shop_owner';

// Map frontend "Super Admin" checkbox to role
if (!empty($body['is_super_admin'])) {
    $role = 'super_admin';
}

$stmt = $db->prepare(
    "INSERT INTO admins (email, password_hash, full_name, phone, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)"
);
$stmt->execute([
    $email,
    password_hash($body['password'], PASSWORD_BCRYPT),
    trim($body['full_name']),
    $body['phone'] ?? null,
    $role,
]);

$newId = $db->lastInsertId();
logAudit($db, $me['admin_id'], 'Create', 'Admin', $body['full_name'], 'New admin account created');

success(['id' => $newId], 'Admin created', 201);
