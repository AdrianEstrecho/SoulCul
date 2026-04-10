<?php
// PATCH /api/v1/customer/profile

$auth = requireAuth();
$userId = $auth['user_id'] ?? null;

if (!$userId) {
    error('User authentication failed', 401);
}

$body = getBody();

$db = getDB();

$existingImageUrl = null;
$existingStmt = $db->prepare("SELECT profile_image_url FROM users WHERE id = ? AND is_active = 1 LIMIT 1");
$existingStmt->execute([$userId]);
$existing = $existingStmt->fetch();
if ($existing) {
    $existingImageUrl = trim((string) ($existing['profile_image_url'] ?? ''));
}

$updates = [];
$params = [];

if (array_key_exists('first_name', $body)) {
    $firstName = trim((string) $body['first_name']);
    if ($firstName === '') {
        error('First name cannot be empty', 422);
    }
    $updates[] = 'first_name = ?';
    $params[] = $firstName;
}

if (array_key_exists('last_name', $body)) {
    $lastName = trim((string) $body['last_name']);
    if ($lastName === '') {
        error('Last name cannot be empty', 422);
    }
    $updates[] = 'last_name = ?';
    $params[] = $lastName;
}

if (array_key_exists('phone', $body)) {
    $phone = trim((string) $body['phone']);
    $updates[] = 'phone = ?';
    $params[] = $phone === '' ? null : $phone;
}

if (array_key_exists('birthday', $body)) {
    $birthday = trim((string) $body['birthday']);
    $updates[] = 'birthday = ?';
    $params[] = $birthday === '' ? null : $birthday;
}

if (array_key_exists('gender', $body)) {
    $gender = trim((string) $body['gender']);
    $updates[] = 'gender = ?';
    $params[] = $gender === '' ? null : $gender;
}

if (array_key_exists('profile_image_url', $body)) {
    $imageUrl = trim((string) $body['profile_image_url']);
    $updates[] = 'profile_image_url = ?';
    $params[] = $imageUrl === '' ? null : $imageUrl;
}

if (!$updates) {
    error('No fields to update', 400);
}

$params[] = $userId;
$sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
$stmt = $db->prepare($sql);
$stmt->execute($params);

if (
    array_key_exists('profile_image_url', $body)
    && trim((string) $body['profile_image_url']) === ''
    && $existingImageUrl !== ''
) {
    $existingPathPart = parse_url($existingImageUrl, PHP_URL_PATH);
    $existingPathNormalized = is_string($existingPathPart) ? $existingPathPart : $existingImageUrl;

    if (!str_starts_with($existingPathNormalized, '/uploads/profiles/')) {
        $existingPathNormalized = '';
    }

    $uploadDir = __DIR__ . '/../../../../public/uploads/profiles';
    $oldFile = basename($existingPathNormalized);
    $oldPath = $uploadDir . DIRECTORY_SEPARATOR . $oldFile;
    if ($oldFile !== '' && is_file($oldPath)) {
        @unlink($oldPath);
    }
}

$fresh = $db->prepare("SELECT id, email, first_name, last_name, phone, birthday, gender, profile_image_url, created_at FROM users WHERE id = ? AND is_active = 1 LIMIT 1");
$fresh->execute([$userId]);
$user = $fresh->fetch();

success($user, 'Profile updated successfully');
