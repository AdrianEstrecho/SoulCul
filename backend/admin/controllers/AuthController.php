<?php

namespace App\Admin\Controllers;

use App\Shared\Config\Database;
use Firebase\JWT\JWT;
use PDO;

class AuthController {
    
    public static function adminLogin(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $email = $input['email'] ?? null;
        $password = $input['password'] ?? null;

        if (!$email || !$password) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Email and password are required',
                'data' => null
            ]);
            return;
        }

        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("
                SELECT id, email, password_hash, full_name, phone, role, is_active 
                FROM admins 
                WHERE email = ? AND is_active = true
            ");
            $stmt->execute([$email]);
            $admin = $stmt->fetch();

            if (!$admin || !password_verify($password, $admin['password_hash'])) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid credentials',
                    'data' => null
                ]);
                return;
            }

            $payload = [
                'id' => $admin['id'],
                'email' => $admin['email'],
                'role' => 'admin',
                'admin_role' => $admin['role'],
                'exp' => time() + (int)$_ENV['JWT_EXPIRATION']
            ];

            $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token' => $token,
                    'admin' => [
                        'id' => $admin['id'],
                        'email' => $admin['email'],
                        'full_name' => $admin['full_name'],
                        'phone' => $admin['phone'],
                        'role' => $admin['role']
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Server error',
                'data' => null
            ]);
        }
    }

    public static function getAdminProfile(array $admin): void {
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("
                SELECT id, email, full_name, phone, role, created_at 
                FROM admins 
                WHERE id = ?
            ");
            $stmt->execute([$admin['id']]);
            $profile = $stmt->fetch();

            if (!$profile) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Admin not found',
                    'data' => null
                ]);
                return;
            }

            echo json_encode([
                'success' => true,
                'message' => 'Profile retrieved',
                'data' => $profile
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Server error',
                'data' => null
            ]);
        }
    }
}
