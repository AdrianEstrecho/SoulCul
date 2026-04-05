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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Route Matching ─────────────────────────────────────────
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = rtrim(preg_replace('#^/soucul/api#', '', $path), '/');
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
if ($path === '/health' && $method === 'GET') {
    success(['status' => 'ok', 'timestamp' => date('c')], 'Customer API is running');
}

// ── PRODUCTS ───────────────────────────────────────────────
if ($path === '/v1/customer/products' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/products/index.php';
}
if ($m = matchRoute('/v1/customer/products/:id', $path)) {
    if ($method === 'GET') { $_route = $m; require __DIR__ . '/../api/v1/customer/products/show.php'; }
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

// ── 404 ────────────────────────────────────────────────────
error("Route not found: $method $path", 404);
