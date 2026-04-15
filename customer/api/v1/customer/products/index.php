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

$db = getDB();


$locationSlug = isset($_GET['location']) ? trim((string) $_GET['location']) : null;
$categorySlug = isset($_GET['category']) ? trim((string) $_GET['category']) : null;
$locationSlug = $locationSlug === '' ? null : $locationSlug;
$categorySlug = $categorySlug === '' ? null : $categorySlug;
$featuredOnly = isset($_GET['featured'])
    && in_array(strtolower((string) $_GET['featured']), ['1', 'true', 'yes'], true);
$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = (int) ($_GET['per_page'] ?? 20);
$perPage = max(1, min(500, $perPage));
$offset = ($page - 1) * $perPage;

$tableCache = [];
$columnCache = [];

$tableExists = static function (string $table) use ($db, &$tableCache): bool {
    if (array_key_exists($table, $tableCache)) {
        return $tableCache[$table];
    }

    try {
        $stmt = $db->prepare(
            "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1"
        );
        $stmt->execute([$table]);
        $tableCache[$table] = (bool) $stmt->fetchColumn();
    } catch (Throwable $e) {
        $tableCache[$table] = false;
    }

    return $tableCache[$table];
};

$columnExists = static function (string $table, string $column) use ($db, &$columnCache, $tableExists): bool {
    $key = $table . '.' . $column;
    if (array_key_exists($key, $columnCache)) {
        return $columnCache[$key];
    }

    if (!$tableExists($table)) {
        $columnCache[$key] = false;
        return false;
    }

    try {
        $stmt = $db->prepare(
            "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1"
        );
        $stmt->execute([$table, $column]);
        $columnCache[$key] = (bool) $stmt->fetchColumn();
    } catch (Throwable $e) {
        $columnCache[$key] = false;
    }

    return $columnCache[$key];
};

$optionalProductField = static function (string $column, string $fallbackSql) use ($columnExists): string {
    if ($columnExists('products', $column)) {
        return "p.{$column} AS {$column}";
    }

    return "{$fallbackSql} AS {$column}";
};

$hasLocationId = $columnExists('products', 'location_id');
$hasCategoryId = $columnExists('products', 'category_id');
$hasAdminId = $columnExists('products', 'admin_id');
$hasIsActive = $columnExists('products', 'is_active');
$hasIsFeatured = $columnExists('products', 'is_featured');
$hasCreatedAt = $columnExists('products', 'created_at');

$canJoinLocations = $hasLocationId && $tableExists('locations');
$canJoinCategories = $hasCategoryId && $tableExists('categories');
$canJoinAdmins = $hasAdminId && $tableExists('admins');

$joins = [];
if ($canJoinLocations) {
    $joins[] = "LEFT JOIN locations l ON p.location_id = l.id";
}
if ($canJoinCategories) {
    $joins[] = "LEFT JOIN categories c ON p.category_id = c.id";
}
if ($canJoinAdmins) {
    $joins[] = "LEFT JOIN admins a ON p.admin_id = a.id";
}

$where = $hasIsActive ? ["p.is_active = 1"] : ["1 = 1"];
$params = [];

if ($locationSlug && $canJoinLocations && $columnExists('locations', 'slug')) {
    $where[] = "l.slug = ?";
    $params[] = $locationSlug;
}

if ($categorySlug && $canJoinCategories && $columnExists('categories', 'slug')) {
    $where[] = "c.slug = ?";
    $params[] = $categorySlug;
}

if ($featuredOnly && $hasIsFeatured) {
    $where[] = "p.is_featured = 1";
}

$whereClause = implode(' AND ', $where);

$locationNameSelect = ($canJoinLocations && $columnExists('locations', 'name'))
    ? "COALESCE(l.name, '') AS location_name"
    : "'' AS location_name";

$categoryNameSelect = ($canJoinCategories && $columnExists('categories', 'name'))
    ? "COALESCE(c.name, '') AS category_name"
    : "'' AS category_name";

$sellerNameSelect = ($canJoinAdmins && $columnExists('admins', 'full_name'))
    ? "COALESCE(a.full_name, '') AS seller_name"
    : "'' AS seller_name";

$orderByParts = [];
if ($hasIsFeatured) {
    $orderByParts[] = 'p.is_featured DESC';
}
if ($hasCreatedAt) {
    $orderByParts[] = 'p.created_at DESC';
}
$orderByParts[] = 'p.id DESC';
$orderByClause = implode(', ', $orderByParts);

$stmt = $db->prepare("
    SELECT
           p.id,
           " . $optionalProductField('name', "''") . ",
           " . $optionalProductField('slug', "''") . ",
           " . $optionalProductField('description', "''") . ",
           " . $optionalProductField('material', "''") . ",
           " . $optionalProductField('price', '0') . ",
           " . $optionalProductField('size_tier', 'NULL') . ",
           " . $optionalProductField('discount_price', 'NULL') . ",
           " . $optionalProductField('featured_image_url', "''") . ",
           " . $optionalProductField('quantity_in_stock', '0') . ",
           " . $optionalProductField('is_featured', '0') . ",
           " . $optionalProductField('rating_average', '0') . ",
           $locationNameSelect,
           $categoryNameSelect,
           $sellerNameSelect
    FROM products p
    " . implode("\n    ", $joins) . "
    WHERE $whereClause
    ORDER BY $orderByClause
    LIMIT ? OFFSET ?
");

$params[] = $perPage;
$params[] = $offset;
$stmt->execute($params);
$products = $stmt->fetchAll();

success($products, 'Products retrieved successfully');