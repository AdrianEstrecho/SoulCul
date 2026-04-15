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

// DELETE /api/v1/customer/addresses/:id

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
$addressId = (int) ($_route['id'] ?? 0);

if ($userId <= 0 || $addressId <= 0) {
    error('Invalid request', 400);
}

$db = getDB();

$find = $db->prepare("SELECT id, is_default FROM customer_addresses WHERE id = ? AND user_id = ? LIMIT 1");
$find->execute([$addressId, $userId]);
$address = $find->fetch();
if (!$address) {
    error('Address not found', 404);
}

$delete = $db->prepare("DELETE FROM customer_addresses WHERE id = ? AND user_id = ?");
$delete->execute([$addressId, $userId]);

if ((int) ($address['is_default'] ?? 0) === 1) {
    $next = $db->prepare("SELECT id FROM customer_addresses WHERE user_id = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1");
    $next->execute([$userId]);
    $row = $next->fetch();

    if ($row) {
      $db->prepare("UPDATE customer_addresses SET is_default = 1 WHERE id = ? AND user_id = ?")->execute([(int) $row['id'], $userId]);
    }
}

success(['removed' => true], 'Address deleted successfully');
