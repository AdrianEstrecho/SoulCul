<?php




$db = getDB();


$locationSlug = $_GET['location'] ?? null;
$categorySlug = $_GET['category'] ?? null;
$page = (int)($_GET['page'] ?? 1);
$perPage = (int)($_GET['per_page'] ?? 20);
$offset = ($page - 1) * $perPage;


$where = ["p.is_active = 1"];
$params = [];

if ($locationSlug) {
    $where[] = "l.slug = ?";
    $params[] = $locationSlug;
}

if ($categorySlug) {
    $where[] = "c.slug = ?";
    $params[] = $categorySlug;
}

$whereClause = implode(' AND ', $where);

$stmt = $db->prepare("
    SELECT p.id, p.name, p.slug, p.description, p.price, 
           p.discount_price, p.featured_image_url, p.quantity_in_stock,
           l.name as location_name, c.name as category_name
    FROM products p
    JOIN locations l ON p.location_id = l.id
    JOIN categories c ON p.category_id = c.id
    WHERE $whereClause
    LIMIT ? OFFSET ?
");

$params[] = $perPage;
$params[] = $offset;
$stmt->execute($params);
$products = $stmt->fetchAll();

success($products, 'Products retrieved successfully');