<?php
// GET /api/v1/admin/archive/products
requireAuth();
$db = getDB();

[$page, $limit, $offset] = getPagination();

$countStmt = $db->query("SELECT COUNT(*) FROM products WHERE is_active = 0");
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT p.id, p.name, p.quantity_in_stock AS stock, p.featured_image_url AS image,
            p.updated_at AS archived_at,
            l.name AS category, c.name AS subcategory
     FROM products p
     JOIN locations l ON p.location_id = l.id
     JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = 0
     ORDER BY p.updated_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute([$limit, $offset]);

paginated($stmt->fetchAll(), $total, $page, $limit);
