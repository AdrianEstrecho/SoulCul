<?php
// PATCH /api/v1/admin/archive/products/:id/restore
$me = requireAuth();
$db = getDB();
$id = (int) $_route['id'];

$chk = $db->prepare("SELECT name FROM products WHERE id = ? AND is_active = 0");
$chk->execute([$id]);
$product = $chk->fetch();
if (!$product) error('Archived product not found', 404);

$db->prepare("UPDATE products SET is_active = 1 WHERE id = ?")->execute([$id]);
logAudit($db, $me['admin_id'], 'Unarchive', 'Product', $product['name'], 'Product restored');
success(null, 'Product restored');
