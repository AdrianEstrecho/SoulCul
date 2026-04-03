<?php

namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AuthMiddleware {
    
    public static function verifyAdminToken(): ?array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader) {
            self::sendUnauthorized('Authorization header missing');
            return null;
        }

        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            self::sendUnauthorized('Invalid authorization format');
            return null;
        }

        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
            
            if ($decoded->role !== 'admin') {
                self::sendForbidden();
                return null;
            }

            return (array) $decoded;
        } catch (Exception $e) {
            self::sendUnauthorized('Invalid or expired token');
            return null;
        }
    }

    private static function sendUnauthorized(string $message = 'Unauthorized'): void {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'data' => null
        ]);
        exit;
    }

    private static function sendForbidden(): void {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Access forbidden',
            'data' => null
        ]);
        exit;
    }
}
