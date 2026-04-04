<?php
// POST /api/v1/admin/uploads/product-image
$me = requireAuth();

function imageCreateFromMime(string $mime, string $path): ?GdImage {
    return match ($mime) {
        'image/jpeg' => function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($path) : null,
        'image/png'  => function_exists('imagecreatefrompng') ? @imagecreatefrompng($path) : null,
        'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : null,
        'image/gif'  => function_exists('imagecreatefromgif') ? @imagecreatefromgif($path) : null,
        default      => null,
    };
}

function imageWriteByMime(GdImage $image, string $mime, string $targetPath): bool {
    return match ($mime) {
        'image/jpeg' => function_exists('imagejpeg') ? @imagejpeg($image, $targetPath, 82) : false,
        'image/png'  => function_exists('imagepng') ? @imagepng($image, $targetPath, 6) : false,
        'image/webp' => function_exists('imagewebp') ? @imagewebp($image, $targetPath, 80) : false,
        'image/gif'  => function_exists('imagegif') ? @imagegif($image, $targetPath) : false,
        default      => false,
    };
}

function prepareCanvas(string $mime, int $width, int $height): GdImage {
    $canvas = imagecreatetruecolor($width, $height);

    if ($mime === 'image/png' || $mime === 'image/webp') {
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefilledrectangle($canvas, 0, 0, $width, $height, $transparent);
    } elseif ($mime === 'image/gif') {
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefilledrectangle($canvas, 0, 0, $width, $height, $transparent);
        imagecolortransparent($canvas, $transparent);
    }

    return $canvas;
}

function normalizeImageMime(?string $mime): string {
    $value = strtolower(trim((string) $mime));

    return match ($value) {
        'image/jpg', 'image/pjpeg' => 'image/jpeg',
        'image/x-png' => 'image/png',
        default => $value,
    };
}

function toFileSegment(string $value, string $fallback = 'item'): string {
    $normalized = strtolower(trim($value));
    $normalized = preg_replace('/[^a-z0-9]+/i', '-', $normalized) ?? '';
    $normalized = trim($normalized, '-');
    return $normalized !== '' ? $normalized : $fallback;
}

function buildTemplateFileBase(string $productName, string $location, string $originalName = ''): string {
    $namePart = toFileSegment($productName, 'product');
    $locationPart = toFileSegment($location, 'general');

    if (trim($productName) === '' && trim($originalName) !== '') {
        $namePart = toFileSegment($originalName, 'product');
    }

    return $namePart . '-' . $locationPart;
}

function resolveLocationSegment(PDO $db, string $location): string {
    $candidate = trim($location);
    if ($candidate === '') {
        return 'general';
    }

    try {
        $stmt = $db->prepare(
            "SELECT slug
             FROM locations
             WHERE LOWER(name) = LOWER(?) OR LOWER(slug) = LOWER(?)
             LIMIT 1"
        );
        $stmt->execute([$candidate, $candidate]);
        $row = $stmt->fetch();

        if ($row && !empty($row['slug'])) {
            return toFileSegment((string) $row['slug'], 'general');
        }
    } catch (Throwable) {
        // If lookup fails, keep upload flow working with sanitized input.
    }

    return toFileSegment($candidate, 'general');
}

if (!isset($_FILES['image'])) {
    error('Image file is required', 422);
}

$file = $_FILES['image'];

if (!isset($file['error']) || is_array($file['error'])) {
    error('Invalid upload payload', 422);
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    error('Upload failed', 422);
}

$maxBytes = 5 * 1024 * 1024; // 5MB
if ((int) $file['size'] > $maxBytes) {
    error('Image must be under 5MB', 422);
}

$tmpPath = (string) ($file['tmp_name'] ?? '');
if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
    error('Invalid uploaded file', 422);
}

$canOptimizeWithGd = extension_loaded('gd') && class_exists('GdImage');

$finfoMime = '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
        $finfoMime = normalizeImageMime((string) finfo_file($finfo, $tmpPath));
        finfo_close($finfo);
    }
}

$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];

$imageInfo = @getimagesize($tmpPath);
if (!is_array($imageInfo) || !isset($imageInfo[0], $imageInfo[1], $imageInfo['mime'])) {
    error('Invalid image file', 422);
}

$sourceWidth = (int) $imageInfo[0];
$sourceHeight = (int) $imageInfo[1];
$detectedMime = normalizeImageMime((string) $imageInfo['mime']);

if ($sourceWidth <= 0 || $sourceHeight <= 0) {
    error('Invalid image dimensions', 422);
}

if (!isset($allowedMimes[$detectedMime])) {
    error('Unsupported image type. Use JPG, PNG, WEBP, or GIF', 422);
}

$mime = $detectedMime;

if ($finfoMime !== '' && $finfoMime !== $detectedMime) {
    // Prefer image header detection from getimagesize() to avoid false negatives.
    $finfoMime = $detectedMime;
}

$minDimension = 120;
$maxSourceDimension = 10000;
if ($sourceWidth < $minDimension || $sourceHeight < $minDimension) {
    error('Image dimensions must be at least 120x120 pixels', 422);
}
if ($sourceWidth > $maxSourceDimension || $sourceHeight > $maxSourceDimension) {
    error('Image dimensions are too large', 422);
}

$targetWidth = $sourceWidth;
$targetHeight = $sourceHeight;
$outputImage = null;
$uploadMode = $canOptimizeWithGd ? 'optimized' : 'passthrough';

if ($canOptimizeWithGd) {
    $maxOutputWidth = 1600;
    $maxOutputHeight = 1600;
    $scale = min(
        1,
        $maxOutputWidth / $sourceWidth,
        $maxOutputHeight / $sourceHeight
    );

    $targetWidth = max(1, (int) round($sourceWidth * $scale));
    $targetHeight = max(1, (int) round($sourceHeight * $scale));

    $sourceImage = imageCreateFromMime($mime, $tmpPath);
    if (!$sourceImage) {
        error('Could not read uploaded image', 422);
    }

    $outputImage = $sourceImage;
    if ($targetWidth !== $sourceWidth || $targetHeight !== $sourceHeight) {
        $outputImage = prepareCanvas($mime, $targetWidth, $targetHeight);
        imagecopyresampled(
            $outputImage,
            $sourceImage,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $sourceWidth,
            $sourceHeight
        );
        imagedestroy($sourceImage);
    }
}

$publicRoot = realpath(__DIR__ . '/../../../../');
if ($publicRoot === false) {
    if ($outputImage instanceof GdImage) {
        imagedestroy($outputImage);
    }
    error('Upload destination is not available', 500);
}

$uploadDir = $publicRoot . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'products';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
    error('Could not create upload directory', 500);
}

$productName = trim((string) ($_POST['product_name'] ?? ''));
$location = trim((string) ($_POST['location'] ?? ''));
$originalName = pathinfo((string) ($file['name'] ?? ''), PATHINFO_FILENAME);

$db = getDB();
$locationSegment = resolveLocationSegment($db, $location);

$ext = $allowedMimes[$mime];
$templateBase = buildTemplateFileBase($productName, $locationSegment, $originalName);
$uniqueSuffix = date('YmdHis') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
$fileName = $templateBase . '-' . $uniqueSuffix . '.' . $ext;
$targetPath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

$saved = false;
if ($canOptimizeWithGd) {
    $saved = $outputImage instanceof GdImage
        ? imageWriteByMime($outputImage, $mime, $targetPath)
        : false;

    if ($outputImage instanceof GdImage) {
        imagedestroy($outputImage);
    }
} else {
    $saved = @move_uploaded_file($tmpPath, $targetPath);
}

if (!$saved || !is_file($targetPath)) {
    error('Could not save processed image', 500);
}

$savedSize = (int) filesize($targetPath);
if ($savedSize > $maxBytes) {
    @unlink($targetPath);
    error('Processed image is too large. Use a smaller image.', 422);
}

$relativePath = '/uploads/products/' . $fileName;
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? '';
$imageUrl = $host !== '' ? ($scheme . '://' . $host . $relativePath) : $relativePath;

logAudit(
    $db,
    (int) $me['admin_id'],
    'Update',
    'Product',
    'Image Upload',
    "Uploaded product image {$fileName} ({$targetWidth}x{$targetHeight}, {$uploadMode})"
);

success([
    'url' => $imageUrl,
    'path' => $relativePath,
    'mime' => $mime,
    'size' => $savedSize,
    'width' => $targetWidth,
    'height' => $targetHeight,
    'original_width' => $sourceWidth,
    'original_height' => $sourceHeight,
    'upload_mode' => $uploadMode,
], 'Image uploaded');
