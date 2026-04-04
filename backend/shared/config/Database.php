<?php

define('DB_CHARSET', 'utf8mb4');

function envValue(string $key, ?string $fallback = null): ?string {
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $fallback;
    }
    return $value;
}

function getDB(bool $haltOnError = true): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $host = envValue('DB_HOST', '127.0.0.1');
    $port = envValue('DB_PORT', '3306');
    $name = envValue('DB_NAME', envValue('DB_DATABASE', 'soucul'));
    $user = envValue('DB_USER', envValue('DB_USERNAME', 'root'));
    $pass = envValue('DB_PASS', envValue('DB_PASSWORD', ''));

    $credentials = [
        [$user, $pass],
        ['soucul_dev', 'SouCul@Dev2026'],
        ['root', ''],
        ['root', 'root'],
    ];

    $ports = [$port, '3307', '3306'];

    // Remove duplicate credential pairs while preserving order.
    $credentials = array_values(array_map('unserialize', array_unique(array_map('serialize', $credentials))));
    $ports = array_values(array_unique($ports));
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $lastError = null;
    foreach ($ports as $dbPort) {
        $dsn = "mysql:host={$host};port={$dbPort};dbname={$name};charset=" . DB_CHARSET;
        foreach ($credentials as [$dbUser, $dbPass]) {
            try {
                $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
                return $pdo;
            } catch (PDOException $e) {
                $lastError = $e;
            }
        }
    }

    $message = $lastError ? $lastError->getMessage() : 'No connection attempts succeeded';

    if ($haltOnError) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed',
            'detail' => $message,
        ]);
        exit;
    }

    throw new PDOException($message);
}
