<?php
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
    success(['status' => 'ok', 'timestamp' => date('c')], 'API is running');
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

// ── 404 ────────────────────────────────────────────────────
error("Route not found: $method $path", 404);
