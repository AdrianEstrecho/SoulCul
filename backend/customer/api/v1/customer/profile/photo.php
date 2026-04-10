<?php
// POST /api/v1/customer/profile/photo

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

if (!isset($_FILES['photo'])) {
    error('Photo file is required', 422);
}

$file = $_FILES['photo'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    error('Failed to upload photo', 422);
}

$maxBytes = 5 * 1024 * 1024;
if (($file['size'] ?? 0) > $maxBytes) {
    error('Photo must be 5MB or smaller', 422);
}

$tmpPath = (string) ($file['tmp_name'] ?? '');
if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
    error('Invalid uploaded file', 422);
}

$imageInfo = @getimagesize($tmpPath);
if ($imageInfo === false) {
    error('Uploaded file is not a valid image', 422);
}

$mime = strtolower((string) ($imageInfo['mime'] ?? ''));
$extMap = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

if (!isset($extMap[$mime])) {
    error('Unsupported image type. Use JPG, PNG, WEBP, or GIF.', 422);
}

$db = getDB();

$fetch = $db->prepare("SELECT profile_image_url FROM users WHERE id = ? AND is_active = 1 LIMIT 1");
$fetch->execute([$userId]);
$user = $fetch->fetch();
if (!$user) {
    error('User not found', 404);
}

$uploadDir = __DIR__ . '/../../../../public/uploads/profiles';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
    error('Failed to prepare upload directory', 500);
}

$fileName = sprintf(
    'customer-%d-%d-%s.%s',
    $userId,
    time(),
    substr(bin2hex(random_bytes(4)), 0, 8),
    $extMap[$mime]
);

$targetPath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;
if (!move_uploaded_file($tmpPath, $targetPath)) {
    error('Failed to save uploaded photo', 500);
}

$newPath = '/uploads/profiles/' . $fileName;
$scheme = (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['SERVER_PORT']) && (string) $_SERVER['SERVER_PORT'] === '443')
) ? 'https' : 'http';
$host = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
$newUrl = $host !== '' ? ($scheme . '://' . $host . $newPath) : $newPath;
$db->prepare("UPDATE users SET profile_image_url = ? WHERE id = ?")->execute([$newUrl, $userId]);

$oldUrl = trim((string) ($user['profile_image_url'] ?? ''));
if ($oldUrl !== '') {
    $oldPathPart = parse_url($oldUrl, PHP_URL_PATH);
    $oldPathNormalized = is_string($oldPathPart) ? $oldPathPart : $oldUrl;
    if (!str_starts_with($oldPathNormalized, '/uploads/profiles/')) {
        $oldPathNormalized = '';
    }

    $oldFile = basename($oldPathNormalized);
    $oldPath = $uploadDir . DIRECTORY_SEPARATOR . $oldFile;
    if ($oldFile !== '' && is_file($oldPath) && $oldPath !== $targetPath) {
        @unlink($oldPath);
    }
}

success([
    'profile_image_url' => $newUrl,
], 'Profile photo updated successfully');
