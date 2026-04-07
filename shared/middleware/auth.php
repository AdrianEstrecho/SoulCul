<?php
require_once __DIR__ . '/../helpers/functions.php';

function requireAuth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($header, 'Bearer ')) {
        error('Unauthorized — missing token', 401);
    }
    $token   = substr($header, 7);
    $payload = jwtDecode($token);
    if (!$payload) {
        error('Unauthorized — invalid or expired token', 401);
    }
    return $payload; // ['admin_id', 'email', 'role', 'exp', 'iat']
}

function requireSuperAdmin(): array {
    $payload = requireAuth();
    if ($payload['role'] !== 'super_admin') {
        error('Forbidden — super admin access required', 403);
    }
    return $payload;
}
