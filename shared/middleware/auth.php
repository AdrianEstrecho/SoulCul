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

    if (isset($payload['user_id'])) {
        $refreshedPayload = $payload;
        unset($refreshedPayload['exp'], $refreshedPayload['iat']);
        $refreshedToken = jwtEncodeWithExpiry($refreshedPayload, CUSTOMER_INACTIVITY_TIMEOUT_SECONDS);
        header('X-Auth-Token: ' . $refreshedToken);
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
