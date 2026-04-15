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

// PATCH /api/v1/admin/products/:id/inventory
$me   = requireAuth();
$db   = getDB();
$body = getBody();
$id   = (int) $_route['id'];
requireFields($body, ['quantity_in_stock']);

$chk = $db->prepare("SELECT name FROM products WHERE id = ?");
$chk->execute([$id]);
$product = $chk->fetch();
if (!$product) error('Product not found', 404);

$qty = max(0, (int) $body['quantity_in_stock']);
$db->prepare("UPDATE products SET quantity_in_stock = ? WHERE id = ?")->execute([$qty, $id]);

logAudit($db, $me['admin_id'], 'Update', 'Product', $product['name'], "Stock set to $qty");
success(['quantity_in_stock' => $qty], 'Inventory updated');
