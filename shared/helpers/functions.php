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

// ── JSON Response Helpers ─────────────────────────────────────────────────────

function respond(mixed $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function success(mixed $data = null, string $message = 'OK', int $code = 200): never {
    respond(['success' => true, 'message' => $message, 'data' => $data], $code);
}

function error(string $message, int $code = 400, mixed $errors = null): never {
    $body = ['success' => false, 'message' => $message];
    if ($errors !== null) $body['errors'] = $errors;
    respond($body, $code);
}

function paginated(array $items, int $total, int $page, int $limit): never {
    respond([
        'success' => true,
        'data'    => $items,
        'meta'    => [
            'total'        => $total,
            'page'         => $page,
            'limit'        => $limit,
            'total_pages'  => (int) ceil($total / max($limit, 1)),
        ],
    ]);
}

// ── Request Helpers ───────────────────────────────────────────────────────────

function getMethod(): string {
    return $_SERVER['REQUEST_METHOD'];
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function getParam(string $key, mixed $default = null): mixed {
    return $_GET[$key] ?? $default;
}

function requireFields(array $body, array $fields): void {
    $missing = [];
    foreach ($fields as $f) {
        if (!isset($body[$f]) || (is_string($body[$f]) && trim($body[$f]) === '')) {
            $missing[] = $f;
        }
    }
    if ($missing) {
        error('Missing required fields: ' . implode(', ', $missing), 422);
    }
}

// ── JWT ───────────────────────────────────────────────────────────────────────

$jwtSecret = getenv('JWT_SECRET');
if (!is_string($jwtSecret) || trim($jwtSecret) === '') {
    $jwtSecret = 'soucul_secret_change_this_in_production';
}

$jwtExpiryRaw = getenv('JWT_EXPIRY_SECONDS');
$jwtExpiry = is_numeric($jwtExpiryRaw) && (int) $jwtExpiryRaw > 0
    ? (int) $jwtExpiryRaw
    : 8 * 3600;

define('JWT_SECRET', $jwtSecret);
define('JWT_EXPIRY', $jwtExpiry); // 8 hours by default
define('CUSTOMER_INACTIVITY_TIMEOUT_SECONDS', 15 * 24 * 60 * 60);

function jwtEncode(array $payload): string {
    return jwtEncodeWithExpiry($payload, JWT_EXPIRY);
}

function jwtEncodeWithExpiry(array $payload, int $expirySeconds): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $ttl = max(60, $expirySeconds);
    $payload['exp'] = time() + $ttl;
    $payload['iat'] = time();
    $claims  = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "$header.$claims", JWT_SECRET, true));
    return "$header.$claims.$sig";
}

function jwtDecode(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $claims, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$claims", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64url_decode($claims), true);
    if (!$payload || $payload['exp'] < time()) return null;
    return $payload;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

// ── Audit Logger ──────────────────────────────────────────────────────────────

function logAudit(PDO $db, int $adminId, string $action, string $entity, string $entityName, string $description): void {
    $stmt = $db->prepare(
        "INSERT INTO audit_logs (admin_id, action, entity, entity_name, description, ip_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())"
    );
    $stmt->execute([$adminId, $action, $entity, $entityName, $description, $_SERVER['REMOTE_ADDR'] ?? null]);
}

function notificationMetaJson(?array $meta): ?string {
    if (!$meta) {
        return null;
    }

    $encoded = json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $encoded === false ? null : $encoded;
}

function createCustomerNotification(
    PDO $db,
    int $userId,
    string $title,
    string $message,
    string $type = 'general',
    ?array $meta = null
): void {
    try {
        $stmt = $db->prepare(
            "INSERT INTO customer_notifications (user_id, type, title, message, meta_json)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $userId,
            substr(trim($type), 0, 50),
            substr(trim($title), 0, 255),
            trim($message),
            notificationMetaJson($meta),
        ]);
    } catch (Throwable $e) {
        error_log('createCustomerNotification failed: ' . $e->getMessage());
    }
}

function createAdminNotification(
    PDO $db,
    int $adminId,
    string $title,
    string $message,
    string $type = 'general',
    ?array $meta = null
): void {
    try {
        $stmt = $db->prepare(
            "INSERT INTO admin_notifications (admin_id, type, title, message, meta_json)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $adminId,
            substr(trim($type), 0, 50),
            substr(trim($title), 0, 255),
            trim($message),
            notificationMetaJson($meta),
        ]);
    } catch (Throwable $e) {
        error_log('createAdminNotification failed: ' . $e->getMessage());
    }
}

function ensurePasswordResetsTable(PDO $db): void {
    static $tableReady = false;

    if ($tableReady) {
        return;
    }

    $db->exec(
        "CREATE TABLE IF NOT EXISTS password_resets (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            token_hash CHAR(64) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            used_at DATETIME NULL,
            requested_ip VARCHAR(45) NULL,
            user_agent VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_password_resets_user (user_id),
            INDEX idx_password_resets_expires (expires_at),
            INDEX idx_password_resets_used (used_at)
        )"
    );

    $tableReady = true;
}

function hasStrongPassword(string $password): bool {
    if (strlen($password) < 8) return false;
    if (!preg_match('/[A-Z]/', $password)) return false;
    if (!preg_match('/[a-z]/', $password)) return false;
    if (!preg_match('/[0-9]/', $password)) return false;
    if (!preg_match('/[!@#$%^&*]/', $password)) return false;
    return true;
}

function getCustomerFrontendBaseUrl(): string {
    $explicit = trim((string) (getenv('CUSTOMER_APP_URL') ?: getenv('FRONTEND_URL') ?: ''));
    if ($explicit !== '') {
        return rtrim($explicit, '/');
    }

    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '') {
        return rtrim($origin, '/');
    }

    $allowedOrigins = trim((string) getenv('CORS_ALLOWED_ORIGINS'));
    if ($allowedOrigins !== '') {
        $parts = array_values(array_filter(array_map('trim', explode(',', $allowedOrigins))));
        if ($parts) {
            return rtrim((string) $parts[0], '/');
        }
    }

    return '';
}

function buildPasswordResetUrl(string $token): string {
    $base = getCustomerFrontendBaseUrl();
    $query = '?reset_token=' . urlencode($token);
    if ($base === '') {
        return '/Login' . $query;
    }
    return $base . '/Login' . $query;
}

function sendPasswordResetEmail(string $recipientEmail, string $resetUrl): bool {
    $appName = trim((string) (getenv('APP_NAME') ?: 'SouCul'));
    $subject = $appName . ' Password Reset Request';
    $body = "Hello,\n\n"
        . "We received a request to reset your password for your {$appName} account.\n\n"
        . "Open this link to set a new password:\n"
        . $resetUrl . "\n\n"
        . "This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.\n\n"
        . "- {$appName} Support\n";

    return sendTransactionalEmail($recipientEmail, $subject, $body);
}

function sendTransactionalEmail(string $to, string $subject, string $plainTextBody): bool {
    $fromEmail = trim((string) (
        getenv('MAIL_FROM_EMAIL')
        ?: getenv('SMTP_FROM_EMAIL')
        ?: getenv('SMTP_USER')
        ?: ''
    ));
    $fromName = trim((string) (getenv('MAIL_FROM_NAME') ?: getenv('APP_NAME') ?: 'SouCul'));

    if ($fromEmail === '') {
        error_log('sendTransactionalEmail: MAIL_FROM_EMAIL/SMTP_USER is not configured.');
        return false;
    }

    $sentViaSmtp = sendMailUsingSmtp($to, $subject, $plainTextBody, $fromEmail, $fromName);
    if ($sentViaSmtp) {
        return true;
    }

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . formatMailbox($fromEmail, $fromName),
        'Reply-To: ' . $fromEmail,
        'X-Mailer: PHP/' . phpversion(),
    ];

    $result = @mail($to, $encodedSubject, $plainTextBody, implode("\r\n", $headers));
    if (!$result) {
        error_log('sendTransactionalEmail: mail() fallback failed.');
    }

    return $result;
}

function sendMailUsingSmtp(string $to, string $subject, string $body, string $fromEmail, string $fromName): bool {
    $host = trim((string) getenv('SMTP_HOST'));
    if ($host === '') {
        return false;
    }

    $portRaw = getenv('SMTP_PORT');
    $port = is_numeric($portRaw) ? (int) $portRaw : 587;
    $encryption = strtolower(trim((string) getenv('SMTP_ENCRYPTION')));
    if ($encryption === '') {
        $encryption = $port === 465 ? 'ssl' : 'tls';
    }

    $username = trim((string) getenv('SMTP_USER'));
    $password = (string) (getenv('SMTP_PASS') ?: '');
    $timeout = 15;

    $remoteHost = $host;
    if ($encryption === 'ssl') {
        $remoteHost = 'ssl://' . $host;
    }

    $socket = @stream_socket_client(
        $remoteHost . ':' . $port,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT
    );

    if (!$socket) {
        error_log("SMTP connection failed: {$errstr} ({$errno})");
        return false;
    }

    stream_set_timeout($socket, $timeout);

    try {
        if (!smtpExpect($socket, [220])) return false;

        $helloHost = parse_url((string) (getenv('APP_URL') ?: ''), PHP_URL_HOST) ?: 'localhost';
        if (!smtpCommand($socket, 'EHLO ' . $helloHost, [250])) return false;

        if ($encryption === 'tls') {
            if (!smtpCommand($socket, 'STARTTLS', [220])) return false;
            $cryptoMethod = defined('STREAM_CRYPTO_METHOD_TLS_CLIENT') ? STREAM_CRYPTO_METHOD_TLS_CLIENT : null;
            if (!@stream_socket_enable_crypto($socket, true, $cryptoMethod)) {
                error_log('SMTP STARTTLS negotiation failed.');
                return false;
            }
            if (!smtpCommand($socket, 'EHLO ' . $helloHost, [250])) return false;
        }

        if ($username !== '' && $password !== '') {
            if (!smtpCommand($socket, 'AUTH LOGIN', [334])) return false;
            if (!smtpCommand($socket, base64_encode($username), [334])) return false;
            if (!smtpCommand($socket, base64_encode($password), [235])) return false;
        }

        if (!smtpCommand($socket, 'MAIL FROM:<' . $fromEmail . '>', [250])) return false;
        if (!smtpCommand($socket, 'RCPT TO:<' . $to . '>', [250, 251])) return false;
        if (!smtpCommand($socket, 'DATA', [354])) return false;

        $date = gmdate('D, d M Y H:i:s') . ' +0000';
        $headers = [
            'Date: ' . $date,
            'From: ' . formatMailbox($fromEmail, $fromName),
            'To: ' . $to,
            'Subject: ' . smtpEncodeHeader($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
        ];

        $payload = implode("\r\n", $headers) . "\r\n\r\n" . normalizeSmtpBody($body);
        fwrite($socket, $payload . "\r\n.\r\n");

        if (!smtpExpect($socket, [250])) return false;
        smtpCommand($socket, 'QUIT', [221]);
        fclose($socket);

        return true;
    } catch (Throwable $e) {
        error_log('SMTP send failed: ' . $e->getMessage());
        if (is_resource($socket)) {
            fclose($socket);
        }
        return false;
    }
}

function smtpEncodeHeader(string $value): string {
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function formatMailbox(string $email, string $name): string {
    $safeName = trim(preg_replace('/[\r\n]+/', ' ', $name));
    if ($safeName === '') {
        return $email;
    }
    return smtpEncodeHeader($safeName) . ' <' . $email . '>';
}

function normalizeSmtpBody(string $body): string {
    $normalized = str_replace(["\r\n", "\r"], "\n", $body);
    $lines = explode("\n", $normalized);
    foreach ($lines as &$line) {
        if ($line !== '' && $line[0] === '.') {
            $line = '.' . $line;
        }
    }
    unset($line);
    return implode("\r\n", $lines);
}

function smtpCommand($socket, string $command, array $expectedCodes): bool {
    fwrite($socket, $command . "\r\n");
    return smtpExpect($socket, $expectedCodes);
}

function smtpExpect($socket, array $expectedCodes): bool {
    $response = smtpReadResponse($socket);
    if ($response === '') {
        error_log('SMTP server returned an empty response.');
        return false;
    }

    if (!preg_match('/^(\d{3})/m', $response, $matches)) {
        error_log('SMTP response missing status code: ' . trim($response));
        return false;
    }

    $status = (int) $matches[1];
    if (!in_array($status, $expectedCodes, true)) {
        error_log('SMTP unexpected status ' . $status . ': ' . trim($response));
        return false;
    }

    return true;
}

function smtpReadResponse($socket): string {
    $response = '';

    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) {
            break;
        }
        $response .= $line;

        if (preg_match('/^\d{3}\s/', $line)) {
            break;
        }
    }

    return $response;
}

// ── Pagination ────────────────────────────────────────────────────────────────

function getPagination(): array {
    $page  = max(1, (int) getParam('page', 1));
    $limit = min(100, max(1, (int) getParam('limit', 20)));
    return [$page, $limit, ($page - 1) * $limit];
}
