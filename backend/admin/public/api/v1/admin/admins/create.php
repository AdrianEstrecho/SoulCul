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

$requestedRoleInput = $body['role'] ?? '';
$requestedRole = is_string($requestedRoleInput) ? strtolower(trim($requestedRoleInput)) : '';
if ($requestedRole === 'super_admin') {
    error('Creating super admin accounts via this endpoint is not allowed', 422);
}
$roleMap = [
    'admin' => 'shop_owner',
    'staff' => 'inventory_manager',
    'shop_owner' => 'shop_owner',
    'inventory_manager' => 'inventory_manager',
];
$role = $roleMap[$requestedRole] ?? 'shop_owner';

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
