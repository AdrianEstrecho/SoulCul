<?php
// POST /api/v1/admin/vouchers
$me   = requireAuth();
$db   = getDB();
$body = getBody();
requireFields($body, ['code', 'discount_type', 'discount_value', 'valid_from', 'valid_until']);

$code = strtoupper(trim($body['code']));

$chk = $db->prepare("SELECT id FROM vouchers WHERE code = ?");
$chk->execute([$code]);
if ($chk->fetch()) error("Voucher code '$code' already exists", 409);

$allowedTypes = ['percentage', 'fixed'];
$type = in_array($body['discount_type'], $allowedTypes) ? $body['discount_type'] : 'percentage';

$stmt = $db->prepare(
    "INSERT INTO vouchers
        (code, discount_type, discount_value, min_purchase_amount,
         max_discount_amount, usage_limit, per_user_limit,
         valid_from, valid_until, status, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
$stmt->execute([
    $code,
    $type,
    (float) $body['discount_value'],
    (float) ($body['min_purchase_amount'] ?? 0),
    isset($body['max_discount_amount']) ? (float) $body['max_discount_amount'] : null,
    isset($body['usage_limit']) ? (int) $body['usage_limit'] : null,
    isset($body['per_user_limit']) ? (int) $body['per_user_limit'] : null,
    $body['valid_from'],
    $body['valid_until'],
    $body['status'] ?? 'active',
    $body['description'] ?? null,
]);

logAudit($db, $me['admin_id'], 'Create', 'Voucher', $code, 'Voucher created');
success(['id' => $db->lastInsertId()], 'Voucher created', 201);
