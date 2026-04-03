<?php

namespace App\Admin\Controllers;

use App\Shared\Config\Database;
use PDO;

class AdminController {
    
    public static function getAllAdmins(): void {
        try {
            $db = Database::getConnection();
            
            $stmt = $db->prepare("
                SELECT 
                    id, email, full_name, phone, role, is_active, created_at,
                    (SELECT COUNT(*) FROM products WHERE admin_id = admins.id) as products_count
                FROM admins
                ORDER BY created_at DESC
            ");
            $stmt->execute();
            $admins = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'message' => 'Admins retrieved',
                'data' => $admins
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
    
    public static function createAdmin(array $currentAdmin): void {
        if ($currentAdmin['admin_role'] !== 'super_admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Only super admins can create new admins',
                'data' => null
            ]);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $required = ['email', 'password', 'full_name', 'role'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'message' => "Field {$field} is required",
                    'data' => null
                ]);
                return;
            }
        }
        
        $validRoles = ['super_admin', 'shop_owner', 'inventory_manager'];
        if (!in_array($input['role'], $validRoles)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid role',
                'data' => null
            ]);
            return;
        }
        
        try {
            $db = Database::getConnection();
            
            $checkStmt = $db->prepare("SELECT id FROM admins WHERE email = ?");
            $checkStmt->execute([$input['email']]);
            if ($checkStmt->fetch()) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email already exists',
                    'data' => null
                ]);
                return;
            }
            
            $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
            
            $stmt = $db->prepare("
                INSERT INTO admins (email, password_hash, full_name, phone, role)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $input['email'],
                $passwordHash,
                $input['full_name'],
                $input['phone'] ?? null,
                $input['role']
            ]);
            
            $adminId = $db->lastInsertId();
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Admin created',
                'data' => ['id' => $adminId]
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
    
    public static function toggleAdminStatus(int $id, array $currentAdmin): void {
        if ($currentAdmin['admin_role'] !== 'super_admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Only super admins can toggle admin status',
                'data' => null
            ]);
            return;
        }
        
        if ($id == $currentAdmin['id']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Cannot deactivate yourself',
                'data' => null
            ]);
            return;
        }
        
        try {
            $db = Database::getConnection();
            
            $stmt = $db->prepare("SELECT is_active FROM admins WHERE id = ?");
            $stmt->execute([$id]);
            $admin = $stmt->fetch();
            
            if (!$admin) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Admin not found',
                    'data' => null
                ]);
                return;
            }
            
            $newStatus = !$admin['is_active'];
            $updateStmt = $db->prepare("UPDATE admins SET is_active = ? WHERE id = ?");
            $updateStmt->execute([$newStatus, $id]);
            
            echo json_encode([
                'success' => true,
                'message' => $newStatus ? 'Admin activated' : 'Admin deactivated',
                'data' => ['is_active' => $newStatus]
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

    public static function getDashboardStats(): void {
        try {
            $db = Database::getConnection();
            
            $stmt = $db->query("
                SELECT 
                    (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
                    (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
                    (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
                    (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered') as total_revenue
            ");
            $stats = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'message' => 'Dashboard stats retrieved',
                'data' => $stats
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
