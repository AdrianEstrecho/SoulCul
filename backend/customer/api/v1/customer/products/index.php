<?php




$db = getDB();


$locationSlug = $_GET['location'] ?? null;
$categorySlug = $_GET['category'] ?? null;
$featuredOnly = isset($_GET['featured'])
    && in_array(strtolower((string) $_GET['featured']), ['1', 'true', 'yes'], true);
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

if ($featuredOnly) {
    $where[] = "p.is_featured = 1";
}

$whereClause = implode(' AND ', $where);

$stmt = $db->prepare("
    SELECT p.id, p.name, p.slug, p.description, p.material, p.price,
           p.discount_price, p.featured_image_url, p.quantity_in_stock, p.is_featured,
           p.rating_average,
           l.name as location_name, c.name as category_name,
           a.full_name as seller_name
    FROM products p
    JOIN locations l ON p.location_id = l.id
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN admins a ON p.admin_id = a.id
    WHERE $whereClause
    ORDER BY p.is_featured DESC, p.created_at DESC, p.id DESC
    LIMIT ? OFFSET ?
");

$params[] = $perPage;
$params[] = $offset;
$stmt->execute($params);
$products = $stmt->fetchAll();

success($products, 'Products retrieved successfully');