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

// PATCH /api/v1/customer/addresses/:id

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
$addressId = (int) ($_route['id'] ?? 0);

if ($userId <= 0 || $addressId <= 0) {
    error('Invalid request', 400);
}

$body = getBody();
$db = getDB();

$exists = $db->prepare("SELECT id FROM customer_addresses WHERE id = ? AND user_id = ? LIMIT 1");
$exists->execute([$addressId, $userId]);
if (!$exists->fetch()) {
    error('Address not found', 404);
}

$allowed = ['label', 'address_line', 'city', 'province', 'postal_code', 'phone'];
$updates = [];
$params = [];

foreach ($allowed as $field) {
    if (!array_key_exists($field, $body)) {
        continue;
    }

    $value = trim((string) $body[$field]);
    if (in_array($field, ['postal_code', 'phone'], true) && $value === '') {
        $value = null;
    }

    $updates[] = "$field = ?";
    $params[] = $value;
}

$setDefault = null;
if (array_key_exists('is_default', $body)) {
    $setDefault = filter_var($body['is_default'], FILTER_VALIDATE_BOOLEAN);
    $updates[] = 'is_default = ?';
    $params[] = $setDefault ? 1 : 0;
}

if (!$updates) {
    error('No fields to update', 400);
}

if ($setDefault === true) {
    $db->prepare("UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
}

$params[] = $addressId;
$params[] = $userId;

$sql = "UPDATE customer_addresses SET " . implode(', ', $updates) . " WHERE id = ? AND user_id = ?";
$stmt = $db->prepare($sql);
$stmt->execute($params);

$fetch = $db->prepare("SELECT id, label, address_line, city, province, postal_code, phone, is_default, created_at, updated_at FROM customer_addresses WHERE id = ? AND user_id = ? LIMIT 1");
$fetch->execute([$addressId, $userId]);
$address = $fetch->fetch();

success($address, 'Address updated successfully');
