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

// GET /api/v1/admin/products
requireAuth();
$db = getDB();

[$page, $limit, $offset] = getPagination();

$where  = ["p.is_active = 1"];
$params = [];

if ($q = getParam('search')) {
    $where[]  = "(p.name LIKE ? OR p.sku LIKE ?)";
    $params[] = "%$q%";
    $params[] = "%$q%";
}
if ($loc = getParam('location')) {
    $where[]  = "l.name = ?";
    $params[] = $loc;
}
if ($cat = getParam('category')) {
    $where[]  = "c.name = ?";
    $params[] = $cat;
}
if ($status = getParam('status')) {
    // map frontend status strings to DB boolean
    if ($status === 'Active')   { $where[] = "p.is_active = 1"; }
    if ($status === 'Inactive') { $where[] = "p.is_active = 0"; }
}

$whereSQL = implode(' AND ', $where);

$countStmt = $db->prepare(
    "SELECT COUNT(*) FROM products p
     JOIN locations l ON p.location_id = l.id
     JOIN categories c ON p.category_id = c.id
     WHERE $whereSQL"
);
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT p.id, p.name, p.slug, p.sku, p.description, p.material, p.price, p.discount_price,
            p.quantity_in_stock AS stock, p.featured_image_url AS image,
            p.is_featured AS featured, p.is_active, p.rating_average, p.created_at,
            l.name AS category, c.name AS subcategory
     FROM products p
     JOIN locations l ON p.location_id = l.id
     JOIN categories c ON p.category_id = c.id
     WHERE $whereSQL
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute([...$params, $limit, $offset]);
$products = $stmt->fetchAll();

paginated($products, $total, $page, $limit);
