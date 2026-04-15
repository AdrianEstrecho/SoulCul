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

// PATCH /api/v1/admin/vouchers/:id
$me   = requireAuth();
$db   = getDB();
$body = getBody();
$id   = (int) $_route['id'];

$chk = $db->prepare("SELECT id, code FROM vouchers WHERE id = ?");
$chk->execute([$id]);
$voucher = $chk->fetch();
if (!$voucher) error('Voucher not found', 404);

$fields = [];
$params = [];

$map = [
    'discount_type'        => 'discount_type',
    'discount_value'       => 'discount_value',
    'min_purchase_amount'  => 'min_purchase_amount',
    'max_discount_amount'  => 'max_discount_amount',
    'usage_limit'          => 'usage_limit',
    'per_user_limit'       => 'per_user_limit',
    'valid_from'           => 'valid_from',
    'valid_until'          => 'valid_until',
    'status'               => 'status',
    'description'          => 'description',
];

foreach ($map as $key => $col) {
    if (array_key_exists($key, $body)) {
        $fields[] = "$col = ?";
        $params[] = $body[$key];
    }
}

if (!$fields) error('No fields to update', 422);

$params[] = $id;
$db->prepare("UPDATE vouchers SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

logAudit($db, $me['admin_id'], 'Update', 'Voucher', $voucher['code'], 'Voucher updated');
success(null, 'Voucher updated');
