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

// ── STATIC PROFILE UPLOADS (DEV/ROUTER FALLBACK) ────────
if ($method === 'GET' && str_starts_with($path, '/uploads/profiles/')) {
    $uploadsRoot = realpath(__DIR__ . '/uploads/profiles');
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
if ($m = matchRoute('/v1/customer/orders/:id/status', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/../api/v1/customer/orders/status.php'; }
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
if ($path === '/v1/customer/profile/photo' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/profile/photo.php';
}
if ($path === '/v1/customer/profile/password' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/profile/password.php';
}

// ── AUTH ───────────────────────────────────────────────────
if ($path === '/v1/customer/auth/register' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/auth/register.php';
}
if ($path === '/v1/customer/auth/login' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/auth/login.php';
}
if ($path === '/v1/customer/auth/forgot-password' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/auth/forgot_password.php';
}
if ($path === '/v1/customer/auth/reset-password' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/auth/reset_password.php';
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

// ── PAYMENT METHODS ────────────────────────────────────────
if ($path === '/v1/customer/payment-methods' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/payment_methods/index.php';
}
if ($path === '/v1/customer/payment-methods' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/payment_methods/create.php';
}
if ($m = matchRoute('/v1/customer/payment-methods/:id', $path)) {
    if ($method === 'PATCH') { $_route = $m; require __DIR__ . '/../api/v1/customer/payment_methods/update.php'; }
    if ($method === 'DELETE') { $_route = $m; require __DIR__ . '/../api/v1/customer/payment_methods/delete.php'; }
}

// ── SECURITY ───────────────────────────────────────────────
if ($path === '/v1/customer/security' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/security/get.php';
}
if ($path === '/v1/customer/security' && $method === 'PATCH') {
    require __DIR__ . '/../api/v1/customer/security/update.php';
}
if ($path === '/v1/customer/security/login-activity' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/security/login_activity.php';
}
if ($path === '/v1/customer/security/linked-accounts' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/security/linked_accounts.php';
}

// ── REVIEWS ────────────────────────────────────────────────
if ($path === '/v1/customer/reviews' && $method === 'GET') {
    require __DIR__ . '/../api/v1/customer/reviews/index.php';
}
if ($path === '/v1/customer/reviews' && $method === 'POST') {
    require __DIR__ . '/../api/v1/customer/reviews/create.php';
}
if ($m = matchRoute('/v1/customer/reviews/:id', $path)) {
    if ($method === 'DELETE') { $_route = $m; require __DIR__ . '/../api/v1/customer/reviews/delete.php'; }
}

// ── 404 ────────────────────────────────────────────────────
error("Route not found: $method $path", 404);
