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

// POST /api/v1/admin/auth/login

$body = getBody();
requireFields($body, ['email', 'password']);

$db    = getDB();
$email = trim(strtolower($body['email']));
$pass  = $body['password'];

$stmt = $db->prepare("SELECT * FROM admins WHERE email = ? AND is_active = 1 LIMIT 1");
$stmt->execute([$email]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($pass, $admin['password_hash'])) {
    error('Invalid email or password', 401);
}

$token = jwtEncode([
    'admin_id' => $admin['id'],
    'email'    => $admin['email'],
    'role'     => $admin['role'],
]);

logAudit($db, $admin['id'], 'Login', 'System', 'Admin Login', "Admin {$admin['full_name']} logged in");

success([
    'token' => $token,
    'admin' => [
        'id'         => $admin['id'],
        'email'      => $admin['email'],
        'full_name'  => $admin['full_name'],
        'role'       => $admin['role'],
        'created_at' => $admin['created_at'],
    ],
], 'Login successful');
