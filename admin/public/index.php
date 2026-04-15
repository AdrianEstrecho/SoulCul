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

// ═══════════════════════════════════════════════════════════
//  SouCul Admin API — Front Controller
//  All requests are routed here via .htaccess
// ═══════════════════════════════════════════════════════════

require_once __DIR__ . '/../../shared/config/Database.php';
require_once __DIR__ . '/../../shared/helpers/functions.php';
require_once __DIR__ . '/../../shared/middleware/auth.php';

// ── CORS ──────────────────────────────────────────────────
header('Content-Type: application/json');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$isAllowedLocalOrigin = false;
if ($origin !== '') {
    $originParts = parse_url($origin);
    $originHost = $originParts['host'] ?? '';
    $originScheme = $originParts['scheme'] ?? '';
    $isAllowedLocalOrigin = $originScheme === 'http' && in_array($originHost, ['localhost', '127.0.0.1'], true);
}

if ($isAllowedLocalOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if ($isAllowedLocalOrigin) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } else {
        header('Access-Control-Allow-Origin: *');
    }
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    http_response_code(204);
    exit;
}

// ── Route Matching ─────────────────────────────────────────
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$apiPos = strpos($path, '/api/');
if ($apiPos !== false) {
    $path = substr($path, $apiPos + 4);
}
$path = rtrim($path, '/');
if ($path === '') {
    $path = '/';
}
$method = $_SERVER['REQUEST_METHOD'];

// ── STATIC UPLOADS (DEV/ROUTER FALLBACK) ────────────────
if ($method === 'GET' && str_starts_with($path, '/uploads/products/')) {
    $uploadsRoot = realpath(__DIR__ . '/uploads/products');
    $fileName = basename($path);

    if ($uploadsRoot === false || $fileName === '' || $fileName === '.' || $fileName === '..') {
        http_response_code(404);
        exit;
    }

    $candidate = $uploadsRoot . DIRECTORY_SEPARATOR . $fileName;
    $real = realpath($candidate);
    $uploadsRootNormalized = rtrim(str_replace('\\', '/', $uploadsRoot), '/');
    $realNormalized = $real !== false ? str_replace('\\', '/', $real) : '';

    if ($real === false || !is_file($real) || !str_starts_with($realNormalized, $uploadsRootNormalized . '/')) {
        http_response_code(404);
        exit;
    }

    $mime = function_exists('mime_content_type')
        ? (mime_content_type($real) ?: 'application/octet-stream')
        : 'application/octet-stream';

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . (string) filesize($real));
    header('Cache-Control: public, max-age=86400');
    readfile($real);
    exit;
}

// helper: match pattern like /v1/admin/products/:id
function matchRoute(string $pattern, string $path): array|false {
    $regex = preg_replace('#:([a-zA-Z_]+)#', '(?P<$1>[^/]+)', $pattern);
    $regex = '#^' . $regex . '$#';
    if (preg_match($regex, $path, $m)) {
        return array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
    }
    return false;
}

// ── Health Check ───────────────────────────────────────────
if ($path === '/health' && $method === 'GET') {
    $dbConnected = true;

    try {
        $healthDb = getDB(false);
        $healthDb->query('SELECT 1');
    } catch (Throwable) {
        $dbConnected = false;
    }

    $status = $dbConnected ? 'ok' : 'degraded';
    $message = $dbConnected
        ? 'API and database are running'
        : 'API is running but database is unavailable';

    success([
        'status' => $status,
        'timestamp' => date('c'),
        'database' => [
            'connected' => $dbConnected,
            'error' => $dbConnected ? null : 'Database unavailable',
        ],
    ], $message, $dbConnected ? 200 : 503);
}

// ── AUTH ───────────────────────────────────────────────────
if ($path === '/v1/admin/auth/login' && $method === 'POST') {
    require __DIR__ . '/api/v1/admin/auth/login.php';
}

// ── PROFILE ────────────────────────────────────────────────
if ($path === '/v1/admin/profile' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/profile/get.php';
}
if ($path === '/v1/admin/profile' && $method === 'PATCH') {
    require __DIR__ . '/api/v1/admin/profile/update.php';
}
if ($path === '/v1/admin/profile/password' && $method === 'POST') {
    require __DIR__ . '/api/v1/admin/profile/password.php';
}
if ($path === '/v1/admin/profile/sessions' && $method === 'DELETE') {
    require __DIR__ . '/api/v1/admin/profile/sessions.php';
}

// ── DASHBOARD ──────────────────────────────────────────────
if ($path === '/v1/admin/dashboard/stats' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/dashboard/stats.php';
}
if ($path === '/v1/admin/dashboard/analytics' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/dashboard/analytics.php';
}

// ── PRODUCTS ───────────────────────────────────────────────
if ($path === '/v1/admin/products' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/products/index.php';
}
if ($path === '/v1/admin/products' && $method === 'POST') {
    require __DIR__ . '/api/v1/admin/products/create.php';
}

// ── UPLOADS ────────────────────────────────────────────────
if ($path === '/v1/admin/uploads/product-image' && $method === 'POST') {
    require __DIR__ . '/api/v1/admin/uploads/product_image.php';
}

if ($m = matchRoute('/v1/admin/products/:id', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/api/v1/admin/products/update.php'; }
    if ($method === 'DELETE') { $_route = $m; require __DIR__ . '/api/v1/admin/products/archive.php'; }
}
if ($m = matchRoute('/v1/admin/products/:id/inventory', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/api/v1/admin/products/inventory.php'; }
}

// ── ORDERS ─────────────────────────────────────────────────
if ($path === '/v1/admin/orders' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/orders/index.php';
}
if ($m = matchRoute('/v1/admin/orders/:id', $path)) {
    if ($method === 'GET')   { $_route = $m; require __DIR__ . '/api/v1/admin/orders/show.php'; }
    if ($method === 'DELETE') { $_route = $m; require __DIR__ . '/api/v1/admin/orders/archive.php'; }
}
if ($m = matchRoute('/v1/admin/orders/:id/status', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/api/v1/admin/orders/status.php'; }
}

// ── USERS ──────────────────────────────────────────────────
if ($path === '/v1/admin/users' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/users/index.php';
}
if ($m = matchRoute('/v1/admin/users/:id', $path)) {
    if ($method === 'GET')   { $_route = $m; require __DIR__ . '/api/v1/admin/users/show.php'; }
    if ($method === 'DELETE') { $_route = $m; require __DIR__ . '/api/v1/admin/users/archive.php'; }
}
if ($m = matchRoute('/v1/admin/users/:id/toggle', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/api/v1/admin/users/toggle.php'; }
}

// ── ADMINS ─────────────────────────────────────────────────
if ($path === '/v1/admin/admins' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/admins/index.php';
}
if ($path === '/v1/admin/admins' && $method === 'POST') {
    require __DIR__ . '/api/v1/admin/admins/create.php';
}
if ($m = matchRoute('/v1/admin/admins/:id/toggle', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/api/v1/admin/admins/toggle.php'; }
}

// ── VOUCHERS ───────────────────────────────────────────────
if ($path === '/v1/admin/vouchers' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/vouchers/index.php';
}
if ($path === '/v1/admin/vouchers' && $method === 'POST') {
    require __DIR__ . '/api/v1/admin/vouchers/create.php';
}
if ($m = matchRoute('/v1/admin/vouchers/:id', $path)) {
    if ($method === 'PATCH')  { $_route = $m; require __DIR__ . '/api/v1/admin/vouchers/update.php'; }
    if ($method === 'DELETE') { $_route = $m; require __DIR__ . '/api/v1/admin/vouchers/delete.php'; }
}

// ── ARCHIVE ────────────────────────────────────────────────
if ($path === '/v1/admin/archive/products' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/archive/products.php';
}
if ($m = matchRoute('/v1/admin/archive/products/:id/restore', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/api/v1/admin/archive/restore_product.php'; }
}
if ($path === '/v1/admin/archive/users' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/archive/users.php';
}
if ($m = matchRoute('/v1/admin/archive/users/:id/restore', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/api/v1/admin/archive/restore_user.php'; }
}
if ($path === '/v1/admin/archive/orders' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/archive/orders.php';
}
if ($m = matchRoute('/v1/admin/archive/orders/:id/restore', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/api/v1/admin/archive/restore_order.php'; }
}

// ── AUDIT ──────────────────────────────────────────────────
if ($path === '/v1/admin/audit' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/audit/index.php';
}

// ── NOTIFICATIONS ───────────────────────────────────────────
if ($path === '/v1/admin/notifications' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/notifications/index.php';
}
if ($path === '/v1/admin/notifications/unread-count' && $method === 'GET') {
    require __DIR__ . '/api/v1/admin/notifications/unread_count.php';
}
if ($path === '/v1/admin/notifications/read-all' && $method === 'PATCH') {
    require __DIR__ . '/api/v1/admin/notifications/mark_all_read.php';
}
if ($m = matchRoute('/v1/admin/notifications/:id/read', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/api/v1/admin/notifications/mark_read.php'; }
}

// ── 404 ────────────────────────────────────────────────────
error("Route not found: $method $path", 404);
