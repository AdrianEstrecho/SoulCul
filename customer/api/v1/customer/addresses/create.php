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

// POST /api/v1/customer/addresses

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$body = getBody();
requireFields($body, ['address_line', 'city', 'province']);

$label = trim((string) ($body['label'] ?? 'Home'));
$addressLine = trim((string) $body['address_line']);
$city = trim((string) $body['city']);
$province = trim((string) $body['province']);
$postalCode = isset($body['postal_code']) ? trim((string) $body['postal_code']) : null;
$phone = isset($body['phone']) ? trim((string) $body['phone']) : null;

$db = getDB();

$countStmt = $db->prepare("SELECT COUNT(*) AS total FROM customer_addresses WHERE user_id = ?");
$countStmt->execute([$userId]);
$total = (int) ($countStmt->fetch()['total'] ?? 0);

$requestedDefault = filter_var($body['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN);
$isDefault = $total === 0 ? true : $requestedDefault;

if ($isDefault) {
    $db->prepare("UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
}

$insert = $db->prepare(
    "INSERT INTO customer_addresses
      (user_id, label, address_line, city, province, postal_code, phone, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);
$insert->execute([
    $userId,
    $label !== '' ? $label : 'Home',
    $addressLine,
    $city,
    $province,
    $postalCode !== '' ? $postalCode : null,
    $phone !== '' ? $phone : null,
    $isDefault ? 1 : 0,
]);

$id = (int) $db->lastInsertId();
$fetch = $db->prepare("SELECT id, label, address_line, city, province, postal_code, phone, is_default, created_at, updated_at FROM customer_addresses WHERE id = ? AND user_id = ? LIMIT 1");
$fetch->execute([$id, $userId]);
$address = $fetch->fetch();

success($address, 'Address added successfully');
