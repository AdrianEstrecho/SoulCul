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

// GET /api/v1/customer/notifications

$auth = requireAuth();
$userId = (int) ($auth['user_id'] ?? 0);
if ($userId <= 0) {
    error('User authentication failed', 401);
}

$db = getDB();
$limit = min(100, max(1, (int) getParam('limit', 20)));

try {
    $stmt = $db->prepare(
        "SELECT id, type, title, message, meta_json, is_read, read_at, created_at
         FROM customer_notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?"
    );
    $stmt->bindValue(1, $userId, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $items = array_map(static function (array $row): array {
        $metaRaw = $row['meta_json'] ?? null;
        $meta = null;

        if (is_string($metaRaw) && $metaRaw !== '') {
            $decoded = json_decode($metaRaw, true);
            if (is_array($decoded)) {
                $meta = $decoded;
            }
        }

        return [
            'id' => (int) $row['id'],
            'type' => (string) $row['type'],
            'title' => (string) $row['title'],
            'message' => (string) $row['message'],
            'meta' => $meta,
            'is_read' => (bool) $row['is_read'],
            'read_at' => $row['read_at'],
            'created_at' => $row['created_at'],
        ];
    }, $rows);

    success($items, 'Notifications retrieved');
} catch (Throwable $e) {
    error('Notifications are unavailable. Run backend/migration.sql first.', 500);
}
