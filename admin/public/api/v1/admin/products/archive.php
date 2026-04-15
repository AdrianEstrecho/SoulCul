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

// DELETE /api/v1/admin/products/:id  (soft archive)
$me = requireAuth();
$db = getDB();
$id = (int) $_route['id'];

$chk = $db->prepare("SELECT name FROM products WHERE id = ? AND is_active = 1");
$chk->execute([$id]);
$product = $chk->fetch();
if (!$product) error('Product not found', 404);

$db->prepare("UPDATE products SET is_active = 0 WHERE id = ?")->execute([$id]);
logAudit($db, $me['admin_id'], 'Archive', 'Product', $product['name'], 'Product archived');
createAdminNotification(
	$db,
	(int) $me['admin_id'],
	'Product archived',
	"Product {$product['name']} was archived.",
	'product_archived',
	[
		'product_id' => (int) $id,
		'product_name' => $product['name'],
	]
);
success(null, 'Product archived');
