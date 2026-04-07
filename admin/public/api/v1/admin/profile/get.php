<?php
// GET /api/v1/admin/profile
$me = requireAuth();
$db = getDB();

$stmt = $db->prepare("SELECT id, email, full_name, phone, role, created_at FROM admins WHERE id = ?");
$stmt->execute([$me['admin_id']]);
$admin = $stmt->fetch();
if (!$admin) error('Admin not found', 404);

success($admin);
