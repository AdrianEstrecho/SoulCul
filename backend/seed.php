<?php

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

try {
    $host = $_ENV['DB_HOST'];
    $port = $_ENV['DB_PORT'];
    $dbname = $_ENV['DB_DATABASE'];
    $username = $_ENV['DB_USERNAME'];
    $password = $_ENV['DB_PASSWORD'];

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "Connected to database successfully!\n\n";

    // Seed locations
    echo "Seeding locations...\n";
    $locations = [
        ['Vigan', 'vigan', 'Ilocos Region', 'Ilocos Sur'],
        ['Baguio', 'baguio', 'Cordillera Administrative Region', 'Benguet'],
        ['Boracay', 'boracay', 'Western Visayas', 'Aklan'],
        ['Tagaytay', 'tagaytay', 'Calabarzon', 'Cavite'],
        ['Bohol', 'bohol', 'Central Visayas', 'Bohol']
    ];

    $stmt = $pdo->prepare("
        INSERT INTO locations (name, slug, region, province, is_active, display_order) 
        VALUES (?, ?, ?, ?, true, ?)
        ON DUPLICATE KEY UPDATE name=name
    ");

    foreach ($locations as $index => $location) {
        $stmt->execute([...$location, $index + 1]);
    }
    echo "✓ Seeded " . count($locations) . " locations\n";

    // Seed categories
    echo "Seeding categories...\n";
    $categories = [
        ['Clothes', 'clothes'],
        ['Decorations', 'decorations'],
        ['Delicacies', 'delicacies'],
        ['Handicrafts', 'handicrafts'],
        ['Homeware', 'homeware']
    ];

    $stmt = $pdo->prepare("
        INSERT INTO categories (name, slug, display_order, is_active) 
        VALUES (?, ?, ?, true)
        ON DUPLICATE KEY UPDATE name=name
    ");

    foreach ($categories as $index => $category) {
        $stmt->execute([...$category, $index + 1]);
    }
    echo "✓ Seeded " . count($categories) . " categories\n";

    // Seed default admin
    echo "Seeding default admin...\n";
    $adminEmail = 'admin@soucul.com';
    $adminPassword = 'admin123'; // Change this in production!
    $passwordHash = password_hash($adminPassword, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO admins (email, password_hash, full_name, phone, role, is_active)
        VALUES (?, ?, ?, ?, ?, true)
        ON DUPLICATE KEY UPDATE email=email
    ");
    $stmt->execute([
        $adminEmail,
        $passwordHash,
        'Super Admin',
        '+63-123-456-7890',
        'super_admin'
    ]);
    echo "✓ Seeded default admin\n";
    echo "  Email: {$adminEmail}\n";
    echo "  Password: {$adminPassword}\n";
    echo "  ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!\n\n";

    // Seed sample products
    echo "Seeding sample products...\n";
    
    // Get location and category IDs
    $locationIds = $pdo->query("SELECT id, slug FROM locations")->fetchAll(PDO::FETCH_KEY_PAIR);
    $categoryIds = $pdo->query("SELECT id, slug FROM categories")->fetchAll(PDO::FETCH_KEY_PAIR);
    $adminId = $pdo->query("SELECT id FROM admins WHERE email = '{$adminEmail}'")->fetchColumn();

    $products = [
        // Vigan Handicrafts
        ['Burnay Pottery', 'burnay-pottery', 'Traditional hand-thrown earthenware pot from Vigan', 'vigan', 'handicrafts', 450.00, 30],
        ['Handwoven Baskets', 'handwoven-baskets-vigan', 'Sturdy rattan baskets handwoven by local artisans', 'vigan', 'handicrafts', 280.00, 50],
        
        // Baguio Delicacies
        ['Cream Puffs', 'cream-puffs', 'Fluffy choux pastry filled with fresh cream', 'baguio', 'delicacies', 195.00, 40],
        ['Ube Jam', 'ube-jam', 'Creamy homemade purple yam jam', 'baguio', 'delicacies', 175.00, 60],
        ['Peanut Brittle', 'peanut-brittle', 'Classic crunchy peanut brittle', 'baguio', 'delicacies', 110.00, 85],
        
        // Tagaytay Delicacies
        ['Buko Pie', 'buko-pie', 'Creamy young coconut pie', 'tagaytay', 'delicacies', 195.00, 35],
        ['Rowenas Blueberry Tarts', 'rowenas-blueberry-tarts', 'Famous blueberry-topped cream cheese tarts', 'tagaytay', 'delicacies', 240.00, 30],
        
        // Bohol Handicrafts & Delicacies
        ['Peanut Kisses', 'peanut-kisses', 'Tiny dome-shaped peanut cookies', 'bohol', 'delicacies', 120.00, 100],
        ['Handwoven Rattan Bag', 'handwoven-rattan-bag', 'Stylish woven rattan bag', 'bohol', 'handicrafts', 480.00, 30],
        
        // Boracay Handicrafts
        ['Boracay Keychain', 'boracay-keychain', 'Fun seashell-and-resin keychain souvenir', 'boracay', 'handicrafts', 80.00, 175],
        ['Boracay Tote Bag', 'boracay-tote-bag', 'Canvas tote bag with hand-printed artwork', 'boracay', 'handicrafts', 320.00, 55]
    ];

    $stmt = $pdo->prepare("
        INSERT INTO products (
            name, slug, description, location_id, category_id, admin_id, 
            price, quantity_in_stock, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)
    ");

    foreach ($products as $product) {
        $locationId = $locationIds[$product[3]];
        $categoryId = $categoryIds[$product[4]];
        
        $stmt->execute([
            $product[0], // name
            $product[1], // slug
            $product[2], // description
            $locationId,
            $categoryId,
            $adminId,
            $product[5], // price
            $product[6]  // stock
        ]);
    }
    echo "✓ Seeded " . count($products) . " sample products\n";

    // Seed test users
    echo "Seeding test users...\n";
    $users = [
        ['john.doe@example.com', 'John', 'Doe', '+63-912-345-6789'],
        ['jane.smith@example.com', 'Jane', 'Smith', '+63-923-456-7890'],
        ['bob.wilson@example.com', 'Bob', 'Wilson', '+63-934-567-8901']
    ];

    $stmt = $pdo->prepare("
        INSERT INTO users (email, password_hash, first_name, last_name, phone, is_active)
        VALUES (?, ?, ?, ?, ?, true)
        ON DUPLICATE KEY UPDATE email=email
    ");

    $testPassword = password_hash('password123', PASSWORD_DEFAULT);
    foreach ($users as $user) {
        $stmt->execute([
            $user[0],
            $testPassword,
            $user[1],
            $user[2],
            $user[3]
        ]);
    }
    echo "✓ Seeded " . count($users) . " test users\n";
    echo "  Default password for all test users: password123\n\n";

    echo "✅ Database seeding completed successfully!\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
