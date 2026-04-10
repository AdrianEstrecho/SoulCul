<?php
// GET /api/v1/admin/dashboard/stats
requireAuth();
$db = getDB();

$stats = [];

// Total active products
$stats['total_products'] = (int) $db->query(
    "SELECT COUNT(*) FROM products WHERE is_active = 1"
)->fetchColumn();

// Total stock
$stats['total_stock'] = (int) $db->query(
    "SELECT COALESCE(SUM(quantity_in_stock), 0) FROM products WHERE is_active = 1"
)->fetchColumn();

// Orders
$stats['total_orders'] = (int) $db->query(
    "SELECT COUNT(*) FROM orders"
)->fetchColumn();

$stats['pending_orders'] = (int) $db->query(
        "SELECT COUNT(*)
         FROM orders
         WHERE status IN (
             'cash_on_delivery_approved',
             'online_payment_processed',
             'waiting_for_courier',
             'shipped',
             'to_be_delivered',
             'pending',
             'confirmed',
             'processing'
         )"
)->fetchColumn();

// Revenue (delivered orders)
$stats['total_revenue'] = (float) $db->query(
    "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered'"
)->fetchColumn();

// Users
$stats['total_users'] = (int) $db->query(
    "SELECT COUNT(*) FROM users WHERE is_active = 1"
)->fetchColumn();

// Low stock (< 10)
$stats['low_stock_count'] = (int) $db->query(
    "SELECT COUNT(*) FROM products WHERE quantity_in_stock < 10 AND is_active = 1"
)->fetchColumn();

// Products by category (location)
$catRows = $db->query(
    "SELECT l.name AS category, COUNT(p.id) AS count
     FROM products p
     JOIN locations l ON p.location_id = l.id
     WHERE p.is_active = 1
     GROUP BY l.id, l.name
     ORDER BY count DESC"
)->fetchAll();
$stats['products_by_category'] = $catRows;

// Orders by status
$statusRows = $db->query(
    "SELECT status, COUNT(*) AS count FROM orders GROUP BY status"
)->fetchAll();
$stats['orders_by_status'] = $statusRows;

// Top 5 selling products
$topRows = $db->query(
    "SELECT oi.product_name AS name, SUM(oi.quantity) AS sold
     FROM order_items oi
     GROUP BY oi.product_name
     ORDER BY sold DESC
     LIMIT 5"
)->fetchAll();
$stats['top_selling'] = $topRows;

// Inventory alerts (stock < 10)
$alertRows = $db->query(
    "SELECT p.name, p.quantity_in_stock AS stock
     FROM products p
     WHERE p.quantity_in_stock < 10 AND p.is_active = 1
     ORDER BY p.quantity_in_stock ASC
     LIMIT 10"
)->fetchAll();
$stats['inventory_alerts'] = $alertRows;

success($stats);
