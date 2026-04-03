<?php

namespace App\Admin\Controllers;

use App\Shared\Config\Database;
use PDO;

class ProductController {
    
    public static function getAllProducts(): void {
        try {
            $db = Database::getConnection();
            
            $page = (int)($_GET['page'] ?? 1);
            $perPage = min((int)($_GET['per_page'] ?? 20), 100);
            $offset = ($page - 1) * $perPage;
            
            $location = $_GET['location'] ?? null;
            $category = $_GET['category'] ?? null;
            $status = $_GET['status'] ?? null;
            $search = $_GET['search'] ?? null;
            
            $where = [];
            $params = [];
            
            if ($location) {
                $where[] = "l.slug = ?";
                $params[] = $location;
            }
            if ($category) {
                $where[] = "c.slug = ?";
                $params[] = $category;
            }
            if ($status) {
                $where[] = "p.is_active = ?";
                $params[] = $status === 'active' ? 1 : 0;
            }
            if ($search) {
                $where[] = "(p.name LIKE ? OR p.description LIKE ?)";
                $params[] = "%{$search}%";
                $params[] = "%{$search}%";
            }
            
            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            
            $countStmt = $db->prepare("
                SELECT COUNT(*) as total
                FROM products p
                LEFT JOIN locations l ON p.location_id = l.id
                LEFT JOIN categories c ON p.category_id = c.id
                {$whereClause}
            ");
            $countStmt->execute($params);
            $total = $countStmt->fetch()['total'];
            
            $stmt = $db->prepare("
                SELECT 
                    p.id, p.name, p.slug, p.description, p.sku,
                    p.price, p.discount_price, p.quantity_in_stock,
                    p.featured_image_url, p.is_active, p.rating_average,
                    p.created_at, p.updated_at,
                    l.name as location_name, l.slug as location_slug,
                    c.name as category_name, c.slug as category_slug,
                    a.full_name as admin_name
                FROM products p
                LEFT JOIN locations l ON p.location_id = l.id
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN admins a ON p.admin_id = a.id
                {$whereClause}
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $perPage;
            $params[] = $offset;
            $stmt->execute($params);
            $products = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'message' => 'Products retrieved',
                'data' => $products,
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
    
    public static function createProduct(array $admin): void {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $required = ['name', 'description', 'price', 'quantity_in_stock', 'location_id', 'category_id'];
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
        
        try {
            $db = Database::getConnection();
            
            $slug = strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $input['name']));
            
            $stmt = $db->prepare("
                INSERT INTO products (
                    name, slug, description, sku, location_id, category_id, admin_id,
                    price, discount_price, quantity_in_stock, featured_image_url, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $input['name'],
                $slug,
                $input['description'],
                $input['sku'] ?? null,
                $input['location_id'],
                $input['category_id'],
                $admin['id'],
                $input['price'],
                $input['discount_price'] ?? null,
                $input['quantity_in_stock'],
                $input['featured_image_url'] ?? null,
                $input['is_active'] ?? true
            ]);
            
            $productId = $db->lastInsertId();
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Product created',
                'data' => ['id' => $productId]
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
    
    public static function updateProduct(int $id, array $admin): void {
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            $db = Database::getConnection();
            
            $fields = [];
            $params = [];
            
            $allowed = ['name', 'description', 'sku', 'price', 'discount_price', 'quantity_in_stock', 'featured_image_url', 'is_active'];
            foreach ($allowed as $field) {
                if (isset($input[$field])) {
                    $fields[] = "{$field} = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($fields)) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'message' => 'No fields to update',
                    'data' => null
                ]);
                return;
            }
            
            $params[] = $id;
            
            $stmt = $db->prepare("
                UPDATE products 
                SET " . implode(', ', $fields) . "
                WHERE id = ?
            ");
            $stmt->execute($params);
            
            echo json_encode([
                'success' => true,
                'message' => 'Product updated',
                'data' => null
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
    
    public static function updateInventory(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['quantity_in_stock'])) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'quantity_in_stock is required',
                'data' => null
            ]);
            return;
        }
        
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("
                UPDATE products 
                SET quantity_in_stock = ?
                WHERE id = ?
            ");
            $stmt->execute([$input['quantity_in_stock'], $id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Inventory updated',
                'data' => null
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
