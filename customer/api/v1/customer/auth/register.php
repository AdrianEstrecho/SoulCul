<?php
// POST /api/v1/customer/auth/register

$body = getBody();
requireFields($body, ['email', 'password', 'first_name', 'last_name']);

$db = getDB();

$email = trim(strtolower($body['email']));
$password = $body['password'];
$firstName = $body['first_name'];
$lastName = $body['last_name'];

// Check if user exists
$stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    error('Email already registered', 409);
}

// Hash password
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

// Create user
$stmt = $db->prepare("
    INSERT INTO users (email, password_hash, first_name, last_name, is_active)
    VALUES (?, ?, ?, ?, 1)
");

$stmt->execute([$email, $passwordHash, $firstName, $lastName]);
$userId = $db->lastInsertId();

// Generate token
$token = jwtEncodeWithExpiry([
    'user_id' => $userId,
    'email'   => $email,
], CUSTOMER_INACTIVITY_TIMEOUT_SECONDS);

createCustomerNotification(
    $db,
    (int) $userId,
    'Welcome to SouCul',
    'Your account was created successfully. Start exploring regional products!',
    'account_created'
);

success([
    'token' => $token,
    'user' => [
        'id'    => $userId,
        'email' => $email,
        'first_name' => $firstName,
        'last_name'  => $lastName,
    ]
], 'Registration successful');
