<?php
// POST /api/v1/admin/products
$me   = requireAuth();
$db   = getDB();
$body = getBody();
requireFields($body, ['name', 'description', 'category', 'subcategory', 'price']);

// Resolve location and category IDs
$locStmt = $db->prepare("SELECT id FROM locations WHERE name = ? AND is_active = 1");
$locStmt->execute([$body['category']]);
$location = $locStmt->fetch();
if (!$location) error("Location '{$body['category']}' not found", 422);

$catStmt = $db->prepare("SELECT id FROM categories WHERE name = ? AND is_active = 1");
$catStmt->execute([$body['subcategory']]);
$category = $catStmt->fetch();
if (!$category) error("Category '{$body['subcategory']}' not found", 422);

// Generate slug
$slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $body['name'])) . '-' . time();

// Map frontend status
$isActive = !isset($body['status']) || $body['status'] === 'Active' ? 1 : 0;
$isFeatured = filter_var($body['featured'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
$material = trim((string) ($body['material'] ?? $body['brand'] ?? ''));
if ($material === '') {
    $material = 'Locally sourced';
}

$stmt = $db->prepare(
    "INSERT INTO products
        (name, slug, description, material, sku, location_id, category_id, admin_id,
         price, discount_price, quantity_in_stock, featured_image_url, is_featured, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
$stmt->execute([
    trim($body['name']),
    $slug,
    trim($body['description']),
    $material,
    $body['sku'] ?? null,
    $location['id'],
    $category['id'],
    $me['admin_id'],
    (float) $body['price'],
    isset($body['discount']) && $body['discount'] > 0
        ? round($body['price'] * (1 - $body['discount'] / 100), 2)
        : null,
    (int) ($body['stock'] ?? 0),
    $body['image'] ?? null,
    $isFeatured,
    $isActive,
]);

$newId = $db->lastInsertId();
logAudit($db, $me['admin_id'], 'Create', 'Product', $body['name'], 'Product created');

success(['id' => $newId], 'Product created', 201);
