<?php

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

function jwtEncode(array $payload): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + JWT_EXPIRY;
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

// ── Pagination ────────────────────────────────────────────────────────────────

function getPagination(): array {
    $page  = max(1, (int) getParam('page', 1));
    $limit = min(100, max(1, (int) getParam('limit', 20)));
    return [$page, $limit, ($page - 1) * $limit];
}
