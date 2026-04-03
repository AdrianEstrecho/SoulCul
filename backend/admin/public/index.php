<?php

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Shared\Config\Database;
use App\Shared\Middleware\AuthMiddleware;
use App\Admin\Controllers\AuthController;
use App\Admin\Controllers\ProductController;
use App\Admin\Controllers\OrderController;
use App\Admin\Controllers\UserController;
use App\Admin\Controllers\AdminController;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/backend/admin/public/index.php', '', $uri);
$uri = str_replace('/backend/admin', '', $uri);
$uri = rtrim($uri, '/');

// Health check
if ($uri === '/health' && $method === 'GET') {
    echo json_encode(['success' => true, 'message' => 'API is running']);
    exit;
}

// Public routes (no auth required)
if ($uri === '/api/v1/admin/auth/login' && $method === 'POST') {
    AuthController::adminLogin();
    exit;
}

// Protected routes (require authentication)
$admin = AuthMiddleware::verifyAdminToken();
if (!$admin) {
    exit;
}

// Route matching
match (true) {
    // Admin profile
    $uri === '/api/v1/admin/profile' && $method === 'GET' 
        => AuthController::getAdminProfile($admin),
    
    // Dashboard stats
    $uri === '/api/v1/admin/dashboard/stats' && $method === 'GET' 
        => AdminController::getDashboardStats(),
    
    // Products
    $uri === '/api/v1/admin/products' && $method === 'GET' 
        => ProductController::getAllProducts(),
    $uri === '/api/v1/admin/products' && $method === 'POST' 
        => ProductController::createProduct($admin),
    preg_match('#^/api/v1/admin/products/(\d+)$#', $uri, $matches) && $method === 'PATCH' 
        => ProductController::updateProduct((int)$matches[1], $admin),
    preg_match('#^/api/v1/admin/products/(\d+)/inventory$#', $uri, $matches) && $method === 'PATCH' 
        => ProductController::updateInventory((int)$matches[1]),
    
    // Orders
    $uri === '/api/v1/admin/orders' && $method === 'GET' 
        => OrderController::getAllOrders(),
    preg_match('#^/api/v1/admin/orders/(\d+)$#', $uri, $matches) && $method === 'GET' 
        => OrderController::getOrderDetails((int)$matches[1]),
    preg_match('#^/api/v1/admin/orders/(\d+)/status$#', $uri, $matches) && $method === 'PATCH' 
        => OrderController::updateOrderStatus((int)$matches[1]),
    
    // Users
    $uri === '/api/v1/admin/users' && $method === 'GET' 
        => UserController::getAllUsers(),
    preg_match('#^/api/v1/admin/users/(\d+)/toggle$#', $uri, $matches) && $method === 'PATCH' 
        => UserController::toggleUserStatus((int)$matches[1]),
    
    // Admins
    $uri === '/api/v1/admin/admins' && $method === 'GET' 
        => AdminController::getAllAdmins(),
    $uri === '/api/v1/admin/admins' && $method === 'POST' 
        => AdminController::createAdmin($admin),
    preg_match('#^/api/v1/admin/admins/(\d+)/toggle$#', $uri, $matches) && $method === 'PATCH' 
        => AdminController::toggleAdminStatus((int)$matches[1], $admin),
    
    // 404 Not Found
    default => (function() {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint not found',
            'data' => null
        ]);
    })()
};
