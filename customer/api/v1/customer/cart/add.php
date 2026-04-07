<?php 

$auth = requireAuth();
$userId = $auth['user_id'];
$db = getDB();
$data = json_decode(file_get_contents('php://input'), true);


if (empty($data['product_id']) || empty($data['quantity'])) {
    error('Product ID and quantity are required', 400);
}


$stmt = $db -> prepare("SELECT id FROM products WHERE id = ? AND is_active = 1");
$stmt->execute([$data['product_id']]);
if (!$stmt->fetch()) {
    error('Product not found', 404);
}

$stmt = $db->prepare("
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + ?
");
$stmt->execute([
    $userId,
    $data['product_id'],
    $data['quantity'],
    $data['quantity']
]);

success(null, 'Item added to cart successfully');