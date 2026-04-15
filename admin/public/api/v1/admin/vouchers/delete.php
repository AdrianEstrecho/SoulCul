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
