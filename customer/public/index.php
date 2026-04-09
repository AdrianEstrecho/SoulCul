<?php
// ═══════════════════════════════════════════════════════════
//  SouCul Customer API — Front Controller
//  All requests are routed here via .htaccess
// ═══════════════════════════════════════════════════════════

require_once __DIR__ . '/../../shared/config/Database.php';
require_once __DIR__ . '/../../shared/helpers/functions.php';
require_once __DIR__ . '/../../shared/middleware/auth.php';

// ── CORS ──────────────────────────────────────────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Expose-Headers: X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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

// helper: match pattern like /v1/customer/products/:id
function matchRoute(string $pattern, string $path): array|false {
    $regex = preg_replace('#:([a-zA-Z_]+)#', '(?P<$1>[^/]+)', $pattern);
    $regex = '#^' . $regex . '$#';
    if (preg_match($regex, $path, $m)) {
        return array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
    }
    return false;
}

// ── Health Check ───────────────────────────────────────────
if (($path === '/health' || $path === '/v1/customer/health') && $method === 'GET') {
    success(['status' => 'ok', 'timestamp' => date('c')], 'Customer API is running');
}

// ── PRODUCTS ───────────────────────────────────────────────
if ($path === '/v1/customer/products' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/products/index.php';
}
if ($m = matchRoute('/v1/customer/products/:id', $path)) {
    if ($method === 'GET') { $_route = $m; require __DIR__ . '/../api/v1/customer/products/show.php'; }
}

// ── LOCATIONS ──────────────────────────────────────────────
if ($path === '/v1/customer/locations' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/locations/index.php';
}

// ── ORDERS ─────────────────────────────────────────────────
if ($path === '/v1/customer/orders' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/orders/index.php';
}
if ($m = matchRoute('/v1/customer/orders/:id', $path)) {
    if ($method === 'GET') { $_route = $m; require __DIR__ . '/../api/v1/customer/orders/show.php'; }
}
if ($path === '/v1/customer/orders' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/orders/create.php';
}

// ── WISHLIST ───────────────────────────────────────────────
if ($path === '/v1/customer/wishlist' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/wishlist/index.php';
}
if ($path === '/v1/customer/wishlist' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/wishlist/add.php';
}
if ($m = matchRoute('/v1/customer/wishlist/:product_id', $path)) {
    if ($method === 'DELETE') { $_route = $m; require __DIR__ . '/../api/v1/customer/wishlist/remove.php'; }
}

// ── ADDRESSES ──────────────────────────────────────────────
if ($path === '/v1/customer/addresses' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/addresses/index.php';
}
if ($path === '/v1/customer/addresses' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/addresses/create.php';
}
if ($m = matchRoute('/v1/customer/addresses/:id', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/../api/v1/customer/addresses/update.php'; }
    if ($method === 'DELETE') { $_route = $m; require __DIR__ . '/../api/v1/customer/addresses/delete.php'; }
}

// ── CART ───────────────────────────────────────────────────
if ($path === '/v1/customer/cart' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/cart/get.php';
}
if ($path === '/v1/customer/cart' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/cart/add.php';
}
if ($m = matchRoute('/v1/customer/cart/:item_id', $path)) {
    if ($method === 'DELETE') { $_route = $m; require __DIR__ . '/../api/v1/customer/cart/remove.php'; }
    if ($method === 'PATCH')  { $_route = $m; require __DIR__ . '/../api/v1/customer/cart/update.php'; }
}

// ── PROFILE ────────────────────────────────────────────────
if ($path === '/v1/customer/profile' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/profile/get.php';
}
if ($path === '/v1/customer/profile' && $method === 'PATCH') {
    require __DIR__ . '/../api/v1/customer/profile/update.php';
}

// ── AUTH ───────────────────────────────────────────────────
if ($path === '/v1/customer/auth/register' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/auth/register.php';
}
if ($path === '/v1/customer/auth/login' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/auth/login.php';
}

// ── NOTIFICATIONS ───────────────────────────────────────────
if ($path === '/v1/customer/notifications' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/notifications/index.php';
}
if ($path === '/v1/customer/notifications/unread-count' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/notifications/unread_count.php';
}
if ($path === '/v1/customer/notifications/read-all' && $method === 'PATCH') {
    require __DIR__ . '/../api/v1/customer/notifications/mark_all_read.php';
}
if ($m = matchRoute('/v1/customer/notifications/:id/read', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/../api/v1/customer/notifications/mark_read.php'; }
}

if ($path === '/v1/customer/notification-settings' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/notifications/settings_get.php';
}
if ($path === '/v1/customer/notification-settings' && $method === 'PATCH') {
    require __DIR__ . '/../api/v1/customer/notifications/settings_update.php';
}

// ── 404 ────────────────────────────────────────────────────
error("Route not found: $method $path", 404);
