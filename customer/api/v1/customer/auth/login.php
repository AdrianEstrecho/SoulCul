<?php
// POST /api/v1/customer/auth/login

$body = getBody();
requireFields($body, ['email', 'password']);

$db = getDB();

$email = trim(strtolower($body['email']));
$pass = $body['password'];

$stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($pass, $user['password_hash'])) {
    error('Invalid email or password', 401);
}

$token = jwtEncodeWithExpiry([
    'user_id' => $user['id'],
    'email'   => $user['email'],
], CUSTOMER_INACTIVITY_TIMEOUT_SECONDS);

createCustomerNotification(
    $db,
    (int) $user['id'],
    'Login detected',
    'You logged in to your account successfully.',
    'login'
);

success([
    'token' => $token,
    'user' => [
        'id'        => $user['id'],
        'email'     => $user['email'],
        'first_name' => $user['first_name'],
        'last_name'  => $user['last_name'],
    ]
], 'Login successful');
