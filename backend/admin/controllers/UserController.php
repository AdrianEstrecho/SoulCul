<?php

namespace App\Admin\Controllers;

use App\Shared\Config\Database;
use PDO;

class UserController {
    
    public static function getAllUsers(): void {
        try {
            $db = Database::getConnection();
            
            $page = (int)($_GET['page'] ?? 1);
            $perPage = min((int)($_GET['per_page'] ?? 20), 100);
            $offset = ($page - 1) * $perPage;
            
            $search = $_GET['search'] ?? null;
            $isActive = $_GET['is_active'] ?? null;
            
            $where = [];
            $params = [];
            
            if ($search) {
                $where[] = "(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)";
                $params[] = "%{$search}%";
                $params[] = "%{$search}%";
                $params[] = "%{$search}%";
            }
            if ($isActive !== null) {
                $where[] = "is_active = ?";
                $params[] = $isActive === 'true' ? 1 : 0;
            }
            
            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            
            $countStmt = $db->prepare("SELECT COUNT(*) as total FROM users {$whereClause}");
            $countStmt->execute($params);
            $total = $countStmt->fetch()['total'];
            
            $stmt = $db->prepare("
                SELECT 
                    id, email, first_name, last_name, phone,
                    profile_image_url, is_active, created_at,
                    (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as total_orders,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = users.id AND status = 'delivered') as total_spent
                FROM users
                {$whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $perPage;
            $params[] = $offset;
            $stmt->execute($params);
            $users = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'message' => 'Users retrieved',
                'data' => $users,
                'meta' => [
                    'pagination' => [
                        'page' => $page,
                        'per_page' => $perPage,
                        'total' => (int)$total,
                        'total_pages' => ceil($total / $perPage)
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
    
    public static function toggleUserStatus(int $id): void {
        try {
            $db = Database::getConnection();
            
            $stmt = $db->prepare("SELECT is_active FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'User not found',
                    'data' => null
                ]);
                return;
            }
            
            $newStatus = !$user['is_active'];
            $updateStmt = $db->prepare("UPDATE users SET is_active = ? WHERE id = ?");
            $updateStmt->execute([$newStatus, $id]);
            
            echo json_encode([
                'success' => true,
                'message' => $newStatus ? 'User activated' : 'User deactivated',
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
}
