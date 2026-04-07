<?php
// GET /api/v1/admin/admins
requireSuperAdmin();
$db = getDB();

$admins = $db->query(
    "SELECT id, email, full_name, phone, role, is_active, created_at
     FROM admins
     ORDER BY created_at ASC"
)->fetchAll();

success($admins);
