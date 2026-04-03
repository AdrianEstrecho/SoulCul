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

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();

// Health check
if ($_SERVER['REQUEST_URI'] === '/health') {
    echo json_encode(['success' => true, 'message' => 'Customer API is running']);
    exit;
}

// Customer API endpoints will be implemented here
http_response_code(501);
echo json_encode([
    'success' => false,
    'message' => 'Customer API endpoints coming soon',
    'data' => null
]);
