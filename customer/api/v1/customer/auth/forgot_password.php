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

// POST /api/v1/customer/auth/forgot-password

$body = getBody();
requireFields($body, ['email']);

$email = trim(strtolower((string) ($body['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error('Please provide a valid email address.', 422);
}

$db = getDB();

$stmt = $db->prepare('SELECT id, email, is_active FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || (int) ($user['is_active'] ?? 0) !== 1) {
    success(null, 'If this email exists, a reset link will be sent.');
}

try {
    ensurePasswordResetsTable($db);

    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', time() + 3600);

    $db->beginTransaction();

    $db->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([(int) $user['id']]);

    $insert = $db->prepare(
        'INSERT INTO password_resets (user_id, token_hash, expires_at, requested_ip, user_agent)
         VALUES (?, ?, ?, ?, ?)'
    );

    $insert->execute([
        (int) $user['id'],
        $tokenHash,
        $expiresAt,
        $_SERVER['REMOTE_ADDR'] ?? null,
        substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
    ]);

    $db->commit();

    $resetUrl = buildPasswordResetUrl($token);
    $sent = sendPasswordResetEmail((string) $user['email'], $resetUrl);

    if (!$sent) {
        error_log('Password reset email could not be sent for user_id=' . (int) $user['id']);
    }
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Forgot password flow failed: ' . $e->getMessage());
}

success(null, 'If this email exists, a reset link will be sent.');
