<?php
// DELETE /api/v1/admin/vouchers/:id
$me = requireAuth();
$db = getDB();
$id = (int) $_route['id'];

$chk = $db->prepare("SELECT code FROM vouchers WHERE id = ?");
$chk->execute([$id]);
$voucher = $chk->fetch();
if (!$voucher) error('Voucher not found', 404);

$db->prepare("DELETE FROM vouchers WHERE id = ?")->execute([$id]);
logAudit($db, $me['admin_id'], 'Delete', 'Voucher', $voucher['code'], 'Voucher deleted');
success(null, 'Voucher deleted');
