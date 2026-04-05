<?php
// POST /api/v1/customer/orders

$auth = requireAuth();
$userId = $auth['user_id'] ?? null;

if (!$userId) {
    error('User authentication failed', 401);
}

$body = getBody();
requireFields($body, ['shipping_address', 'shipping_city', 'shipping_province', 'payment_method']);

$db = getDB();

// Get cart items
$stmt = $db->prepare("
    SELECT ci.quantity, p.price, p.discount_price, p.name, p.id as product_id
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
");
$stmt->execute([$userId]);
$cartItems = $stmt->fetchAll();

if (empty($cartItems)) {
    error('Cart is empty', 400);
}

// Calculate total
$subtotal = 0;
foreach ($cartItems as $item) {
    $price = $item['discount_price'] ?? $item['price'];
    $subtotal += $price * $item['quantity'];
}

// Generate order number
$orderNumber = 'ORD-' . strtoupper(uniqid());

// Create order
$stmt = $db->prepare("
    INSERT INTO orders (order_number, user_id, status, subtotal, total_amount,
                       shipping_address, shipping_city, shipping_province, shipping_phone)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    $orderNumber,
    $userId,
    $subtotal,
    $subtotal,
    $body['shipping_address'],
    $body['shipping_city'],
    $body['shipping_province'],
    $body['shipping_phone'] ?? null
]);

$orderId = $db->lastInsertId();

// Create order items
$stmt = $db->prepare("
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
");

foreach ($cartItems as $item) {
    $price = $item['discount_price'] ?? $item['price'];
    $stmt->execute([
        $orderId,
        $item['product_id'],
        $item['name'],
        $item['quantity'],
        $price,
        $price * $item['quantity']
    ]);
}

// Clear cart
$stmt = $db->prepare("DELETE FROM cart_items WHERE user_id = ?");
$stmt->execute([$userId]);

success([
    'order_number' => $orderNumber,
    'total_amount' => $subtotal
], 'Order placed successfully');