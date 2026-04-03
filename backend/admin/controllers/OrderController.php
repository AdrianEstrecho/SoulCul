<?php

namespace App\Admin\Controllers;

use App\Shared\Config\Database;
use PDO;

class OrderController {
    
    public static function getAllOrders(): void {
        try {
            $db = Database::getConnection();
            
            $page = (int)($_GET['page'] ?? 1);
            $perPage = min((int)($_GET['per_page'] ?? 20), 100);
            $offset = ($page - 1) * $perPage;
            
            $status = $_GET['status'] ?? null;
            
            $where = $status ? "WHERE o.status = ?" : "";
            $params = $status ? [$status] : [];
            
            $countStmt = $db->prepare("SELECT COUNT(*) as total FROM orders o {$where}");
            $countStmt->execute($params);
            $total = $countStmt->fetch()['total'];
            
            $stmt = $db->prepare("
                SELECT 
                    o.id, o.order_number, o.user_id, o.status,
                    o.subtotal, o.tax_amount, o.shipping_cost, o.total_amount,
                    o.shipping_address, o.shipping_city, o.shipping_province,
                    o.shipping_phone, o.customer_notes,
                    o.created_at, o.updated_at,
                    u.email as customer_email,
                    u.first_name, u.last_name,
                    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                {$where}
                ORDER BY o.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $perPage;
            $params[] = $offset;
            $stmt->execute($params);
            $orders = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'message' => 'Orders retrieved',
                'data' => $orders,
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
    
    public static function getOrderDetails(int $id): void {
        try {
            $db = Database::getConnection();
            
            $stmt = $db->prepare("
                SELECT 
                    o.*,
                    u.email as customer_email, u.first_name, u.last_name, u.phone as customer_phone
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            ");
            $stmt->execute([$id]);
            $order = $stmt->fetch();
            
            if (!$order) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Order not found',
                    'data' => null
                ]);
                return;
            }
            
            $itemsStmt = $db->prepare("
                SELECT oi.*, p.featured_image_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            ");
            $itemsStmt->execute([$id]);
            $order['items'] = $itemsStmt->fetchAll();
            
            $paymentStmt = $db->prepare("SELECT * FROM payments WHERE order_id = ?");
            $paymentStmt->execute([$id]);
            $order['payment'] = $paymentStmt->fetch();
            
            echo json_encode([
                'success' => true,
                'message' => 'Order details retrieved',
                'data' => $order
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
    
    public static function updateOrderStatus(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!isset($input['status']) || !in_array($input['status'], $validStatuses)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid status',
                'data' => null
            ]);
            return;
        }
        
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$input['status'], $id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Order status updated',
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
