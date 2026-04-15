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

// POST /api/v1/customer/auth/reset-password

$body = getBody();
requireFields($body, ['token', 'password', 'confirm_password']);

$token = trim((string) ($body['token'] ?? ''));
$password = (string) ($body['password'] ?? '');
$confirmPassword = (string) ($body['confirm_password'] ?? '');

if ($token === '' || strlen($token) < 32) {
    error('Invalid or expired reset token.', 422);
}

if ($password !== $confirmPassword) {
    error('Passwords do not match.', 422);
}

if (!hasStrongPassword($password)) {
    error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character (!@#$%^&*).', 422);
}

$db = getDB();

try {
    ensurePasswordResetsTable($db);

    $tokenHash = hash('sha256', $token);

    $stmt = $db->prepare(
        'SELECT pr.id, pr.user_id
         FROM password_resets pr
         INNER JOIN users u ON u.id = pr.user_id
         WHERE pr.token_hash = ?
           AND pr.used_at IS NULL
           AND pr.expires_at > NOW()
           AND u.is_active = 1
         LIMIT 1'
    );
    $stmt->execute([$tokenHash]);
    $resetRow = $stmt->fetch();

    if (!$resetRow) {
        error('Invalid or expired reset token.', 422);
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    $db->beginTransaction();

    $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([$passwordHash, (int) $resetRow['user_id']]);

    $db->prepare('UPDATE password_resets SET used_at = NOW() WHERE id = ?')
        ->execute([(int) $resetRow['id']]);

    $db->prepare('DELETE FROM password_resets WHERE user_id = ? AND id <> ?')
        ->execute([(int) $resetRow['user_id'], (int) $resetRow['id']]);

    $db->commit();

    createCustomerNotification(
        $db,
        (int) $resetRow['user_id'],
        'Password reset successful',
        'Your account password was reset successfully.',
        'security'
    );

    success(null, 'Password has been reset successfully. You can now log in.');
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Reset password flow failed: ' . $e->getMessage());
    error('Unable to reset password at the moment. Please try again.', 500);
}
