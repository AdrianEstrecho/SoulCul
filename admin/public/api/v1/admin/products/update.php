<?php
// PATCH /api/v1/admin/products/:id

function resolveManagedProductImagePath(?string $imageUrl, string $publicRoot): ?string {
    if (!$imageUrl) {
        return null;
    }

    $path = parse_url($imageUrl, PHP_URL_PATH);
    if (!is_string($path) || $path === '') {
        return null;
    }

    $normalizedPath = str_replace('\\', '/', $path);
    if (!str_starts_with($normalizedPath, '/uploads/products/')) {
        return null;
    }

    $uploadsRoot = realpath($publicRoot . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'products');
    if ($uploadsRoot === false) {
        return null;
    }

    $fileName = basename($normalizedPath);
    if ($fileName === '' || $fileName === '.' || $fileName === '..') {
        return null;
    }

    $fullPath = $uploadsRoot . DIRECTORY_SEPARATOR . $fileName;
    $real = realpath($fullPath);
    if ($real === false || !is_file($real)) {
        return null;
    }

    $uploadsRootNormalized = rtrim(str_replace('\\', '/', $uploadsRoot), '/');
    $realNormalized = str_replace('\\', '/', $real);
    if (!str_starts_with($realNormalized, $uploadsRootNormalized . '/')) {
        return null;
    }

    return $real;
}

$me   = requireAuth();
$db   = getDB();
$body = getBody();
$id   = (int) $_route['id'];

$chk = $db->prepare("SELECT id, name, featured_image_url FROM products WHERE id = ? AND is_active = 1");
$chk->execute([$id]);
$product = $chk->fetch();
if (!$product) error('Product not found', 404);

$incomingImage = null;
if (array_key_exists('image', $body)) {
    $incomingImage = $body['image'];
    if (is_string($incomingImage)) {
        $incomingImage = trim($incomingImage);
    }
    if ($incomingImage === '') {
        $incomingImage = null;
    }
}

$fields = [];
$params = [];

if (array_key_exists('material', $body) || array_key_exists('brand', $body)) {
    $fields[] = 'material = ?';
    $material = trim((string) ($body['material'] ?? $body['brand'] ?? ''));
    $params[] = $material !== '' ? $material : 'Locally sourced';
}

$map = [
    'name'        => 'name',
    'description' => 'description',
    'sku'         => 'sku',
    'price'       => 'price',
    'stock'       => 'quantity_in_stock',
    'image'       => 'featured_image_url',
    'featured'    => 'is_featured',
];

foreach ($map as $key => $col) {
    if (array_key_exists($key, $body)) {
        $fields[] = "$col = ?";
        if ($key === 'image') {
            $params[] = $incomingImage;
        } elseif ($key === 'featured') {
            $params[] = filter_var($body[$key], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        } else {
            $params[] = $body[$key];
        }
    }
}

if (array_key_exists('status', $body)) {
    $fields[] = 'is_active = ?';
    $params[] = $body['status'] === 'Active' ? 1 : 0;
}

if (array_key_exists('discount', $body) && array_key_exists('price', $body)) {
    $fields[] = 'discount_price = ?';
    $params[] = $body['discount'] > 0
        ? round($body['price'] * (1 - $body['discount'] / 100), 2)
        : null;
}

if (array_key_exists('category', $body)) {
    $locStmt = $db->prepare("SELECT id FROM locations WHERE name = ?");
    $locStmt->execute([$body['category']]);
    $loc = $locStmt->fetch();
    if (!$loc) error("Location not found", 422);
    $fields[] = 'location_id = ?';
    $params[] = $loc['id'];
}

if (array_key_exists('subcategory', $body)) {
    $catStmt = $db->prepare("SELECT id FROM categories WHERE name = ?");
    $catStmt->execute([$body['subcategory']]);
    $cat = $catStmt->fetch();
    if (!$cat) error("Category not found", 422);
    $fields[] = 'category_id = ?';
    $params[] = $cat['id'];
}

if (!$fields) error('No fields to update', 422);

$params[] = $id;
$db->prepare("UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

if (array_key_exists('image', $body)) {
    $oldImage = trim((string) ($product['featured_image_url'] ?? ''));
    $newImage = trim((string) ($incomingImage ?? ''));

    if ($oldImage !== '' && $oldImage !== $newImage) {
        $publicRoot = realpath(__DIR__ . '/../../../..');
        if ($publicRoot !== false) {
            $oldPath = resolveManagedProductImagePath($oldImage, $publicRoot);
            if ($oldPath !== null) {
                @unlink($oldPath);
            }
        }
    }
}

$auditEntityName = isset($body['name']) && trim((string) $body['name']) !== ''
    ? trim((string) $body['name'])
    : (string) ($product['name'] ?? $id);

logAudit($db, $me['admin_id'], 'Update', 'Product', $auditEntityName, 'Product updated');
success(null, 'Product updated');
