<?php
/*
Estrecho, Adrian M.
Mansilla, Rhangel R.
Romualdo, Jervin Paul C.
Sostea, Joana Marie A.
Torres, Ceazarion Sean Nicholas M.
Tupaen, Arianne Kaye E.

BSIT/IT22S1
*/

// POST /api/v1/customer/orders

$auth = requireAuth();
$userId = $auth['user_id'] ?? null;

if (!$userId) {
    error('User authentication failed', 401);
}

$body = getBody();
requireFields($body, ['shipping_address', 'shipping_city', 'shipping_province', 'payment_method']);

$db = getDB();

$rawDirectItem = is_array($body['direct_item'] ?? null) ? $body['direct_item'] : null;
$checkoutItems = [];
$usesDirectCheckoutItem = false;

if ($rawDirectItem) {
    $directProductId = (int) ($rawDirectItem['product_id'] ?? $rawDirectItem['id'] ?? 0);
    $directQuantity = (int) ($rawDirectItem['quantity'] ?? $rawDirectItem['qty'] ?? 0);

    if ($directProductId <= 0) {
        error('Invalid direct checkout product.', 422);
    }

    if ($directQuantity <= 0) {
        error('Invalid direct checkout quantity.', 422);
    }

    $productStmt = $db->prepare("
        SELECT p.id as product_id, p.name, p.price, p.discount_price, p.quantity_in_stock
        FROM products p
        WHERE p.id = ?
        LIMIT 1
    ");
    $productStmt->execute([$directProductId]);
    $product = $productStmt->fetch();

    if (!$product) {
        error('Direct checkout product not found.', 404);
    }

    $stock = max(0, (int) ($product['quantity_in_stock'] ?? 0));
    if ($stock <= 0) {
        error('Direct checkout product is out of stock.', 422);
    }

    if ($directQuantity > $stock) {
        error('Direct checkout quantity exceeds available stock.', 422);
    }

    $checkoutItems[] = [
        'quantity' => $directQuantity,
        'price' => $product['price'],
        'discount_price' => $product['discount_price'],
        'name' => $product['name'],
        'product_id' => (int) $product['product_id'],
    ];
    $usesDirectCheckoutItem = true;
} else {
    // Get cart items
    $stmt = $db->prepare("
        SELECT ci.quantity, p.price, p.discount_price, p.name, p.id as product_id
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    ");
    $stmt->execute([$userId]);
    $checkoutItems = $stmt->fetchAll();

    if (empty($checkoutItems)) {
        error('Cart is empty', 400);
    }
}

// Calculate total
$subtotal = 0;
foreach ($checkoutItems as $item) {
    $price = $item['discount_price'] ?? $item['price'];
    $subtotal += $price * $item['quantity'];
}

// Generate order number
$orderNumber = 'ORD-' . strtoupper(uniqid());

$paymentMethod = strtolower(trim((string) ($body['payment_method'] ?? '')));
$isCashOnDelivery = in_array($paymentMethod, ['cod', 'cash_on_delivery', 'cash on delivery'], true);
$initialStatus = $isCashOnDelivery ? 'cash_on_delivery_requested' : 'online_payment_requested';

$normalizedPaymentMethod = match ($paymentMethod) {
    'cod', 'cash_on_delivery', 'cash on delivery' => 'cod',
    'gcash' => 'gcash',
    'bank', 'bank_transfer', 'bank transfer' => 'bank_transfer',
    'paypal' => 'paypal',
    'debit_card', 'debit card' => 'debit_card',
    default => 'credit_card',
};

$initialPaymentStatus = 'pending';

// Create order
$stmt = $db->prepare("
    INSERT INTO orders (order_number, user_id, status, subtotal, total_amount,
                       shipping_address, shipping_city, shipping_province, shipping_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    $orderNumber,
    $userId,
    $initialStatus,
    $subtotal,
    $subtotal,
    $body['shipping_address'],
    $body['shipping_city'],
    $body['shipping_province'],
    $body['shipping_phone'] ?? null
]);

$orderId = $db->lastInsertId();

// Create initial payment record so payment status is visible immediately.
try {
    $paymentStmt = $db->prepare("\n        INSERT INTO payments (order_id, payment_method, payment_status, amount)\n        VALUES (?, ?, ?, ?)\n    ");
    $paymentStmt->execute([
        $orderId,
        $normalizedPaymentMethod,
        $initialPaymentStatus,
        $subtotal,
    ]);
} catch (Throwable $e) {
    error_log('Unable to create payment record for order ' . $orderId . ': ' . $e->getMessage());
}

// Create order items
$stmt = $db->prepare("
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
");

foreach ($checkoutItems as $item) {
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

// Clear cart only for cart-based checkout.
if (!$usesDirectCheckoutItem) {
    $stmt = $db->prepare("DELETE FROM cart_items WHERE user_id = ?");
    $stmt->execute([$userId]);
}

createCustomerNotification(
    $db,
    (int) $userId,
    'Order placed',
    "Your order {$orderNumber} has been placed successfully.",
    'order_created',
    [
        'order_id' => (int) $orderId,
        'order_number' => $orderNumber,
    ]
);

try {
    $adminStmt = $db->query("SELECT id FROM admins WHERE is_active = 1");
    $adminRows = $adminStmt->fetchAll();
    foreach ($adminRows as $adminRow) {
        $targetAdminId = (int) ($adminRow['id'] ?? 0);
        if ($targetAdminId <= 0) {
            continue;
        }

        createAdminNotification(
            $db,
            $targetAdminId,
            'New customer order',
            "Order {$orderNumber} was placed and is awaiting processing.",
            'order_created',
            [
                'order_id' => (int) $orderId,
                'order_number' => $orderNumber,
                'user_id' => (int) $userId,
            ]
        );
    }
} catch (Throwable) {
    // Notification fan-out should not block successful checkout.
}

success([
    'order_id' => (int) $orderId,
    'order_number' => $orderNumber,
    'total_amount' => $subtotal,
    'order_status' => $initialStatus,
    'payment_method' => $normalizedPaymentMethod,
    'payment_status' => $initialPaymentStatus,
], 'Order placed successfully');