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
        ['Handicrafts', 'handicrafts'],
        ['Delicacies', 'delicacies'],
        ['Decorations', 'decorations'],
        ['Homeware', 'homeware'],
        ['Clothes', 'clothes']
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

    // Seed all products
    echo "Seeding all products...\n";
    
    // Get location and category IDs (slug => id mapping)
    $locationIds = $pdo->query("SELECT slug, id FROM locations")->fetchAll(PDO::FETCH_KEY_PAIR);
    $categoryIds = $pdo->query("SELECT slug, id FROM categories")->fetchAll(PDO::FETCH_KEY_PAIR);
    $adminId = $pdo->query("SELECT id FROM admins WHERE email = '{$adminEmail}'")->fetchColumn();
    
    // Debug: Print available slugs
    echo "Available location slugs: " . implode(', ', array_keys($locationIds)) . "\n";
    echo "Available category slugs: " . implode(', ', array_keys($categoryIds)) . "\n";

    $products = [
        // ── VIGAN · HANDICRAFTS ──
        ['Burnay Pottery', 'burnay-pottery', 'Traditional hand-thrown earthenware pot from Vigan, fired using the centuries-old Burnay technique.', 'vigan', 'handicrafts', 450.00, 30],
        ['Handwoven Baskets', 'handwoven-baskets-vigan', 'Sturdy rattan baskets handwoven by local Ilocano artisans in Vigan.', 'vigan', 'handicrafts', 280.00, 50],
        ['Damili Pottery', 'damili-pottery', 'Elegant Damili-style clay pottery unique to Vigan\'s heritage craft tradition.', 'vigan', 'handicrafts', 520.00, 25],
        ['Vigan Wallets', 'vigan-wallets', 'Hand-stitched leather wallets crafted by Vigan artisans with Ilocano motifs.', 'vigan', 'handicrafts', 350.00, 60],
        ['Buri Bags', 'buri-bags', 'Lightweight and eco-friendly bags woven from Buri palm leaves, a Vigan staple.', 'vigan', 'handicrafts', 320.00, 45],
        ['Wood Coasters', 'wood-coasters', 'Set of 4 hand-carved wooden coasters with traditional Ilocano patterns.', 'vigan', 'handicrafts', 150.00, 80],
        ['Labba', 'labba', 'Traditional Ilocano woven blanket, the Labba, made with colorful thread patterns.', 'vigan', 'handicrafts', 680.00, 20],
        ['Bulatlat Pottery', 'bulatlat-pottery', 'Round-bellied Bulatlat clay jar, a signature form of Vigan\'s Burnay pottery craft.', 'vigan', 'handicrafts', 490.00, 18],
        
        // ── BAGUIO · HANDICRAFTS ──
        ['Baguio Keychains', 'baguio-keychains', 'Colorful handcrafted keychains featuring Baguio landmarks and tribal motifs.', 'baguio', 'handicrafts', 85.00, 120],
        ['Handwoven Tela', 'handwoven-tela', 'Beautiful handwoven fabric by Cordillera weavers using traditional backstrap looms.', 'baguio', 'handicrafts', 750.00, 35],
        ['Baguio Handfan', 'baguio-handfan', 'Handwoven rattan fan with tribal geometric patterns, perfect for warm days.', 'baguio', 'handicrafts', 120.00, 55],
        ['Refrigerator Magnet', 'refrigerator-magnet', 'Cute resin fridge magnet featuring iconic Baguio sceneries and attractions.', 'baguio', 'handicrafts', 75.00, 200],
        ['Rattan Baskets', 'rattan-baskets-baguio', 'Handwoven rattan storage baskets crafted by Cordillera artisans in Baguio.', 'baguio', 'handicrafts', 350.00, 40],
        ['Sinalapid Slippers', 'sinalapid-slippers', 'Handmade braided slippers using traditional Cordillera weaving techniques.', 'baguio', 'handicrafts', 290.00, 30],
        ['Basahan Tela', 'basahan-tela', 'Traditional recycled cloth fabric woven into colorful rugs and mats.', 'baguio', 'handicrafts', 420.00, 25],
        ['Baguio Bracelets', 'baguio-bracelets', 'Beaded bracelets inspired by Igorot tribal jewelry, handmade in Baguio.', 'baguio', 'handicrafts', 110.00, 90],
        
        // ── TAGAYTAY · HANDICRAFTS ──
        ['Dream Catchers', 'dream-catchers', 'Handmade dream catchers with natural feathers and beads, crafted in Tagaytay.', 'tagaytay', 'handicrafts', 220.00, 45],
        ['I Love Tagaytay Keychain', 'i-love-tagaytay-keychain', 'Charming souvenir keychain with Tagaytay landmark illustrations.', 'tagaytay', 'handicrafts', 80.00, 150],
        ['I Love Tagaytay Coin Purse', 'i-love-tagaytay-coin-purse', 'Handstitched coin purse with a Tagaytay-themed print.', 'tagaytay', 'handicrafts', 145.00, 60],
        ['Tagaytay Ref Magnet', 'tagaytay-ref-magnet', 'Scenic Taal Volcano souvenir refrigerator magnet from Tagaytay.', 'tagaytay', 'handicrafts', 75.00, 180],
        ['Tagaytay Bags', 'tagaytay-bags', 'Woven abaca tote bags featuring Tagaytay scenery prints.', 'tagaytay', 'handicrafts', 380.00, 35],
        ['Handwoven Baskets', 'handwoven-baskets-tagaytay', 'Natural fiber baskets woven by local craftspeople in the Tagaytay region.', 'tagaytay', 'handicrafts', 260.00, 40],
        ['Wooden Kitchenware', 'wooden-kitchenware-tagaytay', 'Handcrafted wooden spoons, spatulas and ladles made from local hardwood.', 'tagaytay', 'handicrafts', 195.00, 55],
        ['Coconut Shell Placemat', 'coconut-shell-placemat', 'Eco-friendly placemats made from woven coconut shell strips.', 'tagaytay', 'handicrafts', 170.00, 70],
        
        // ── BOHOL · HANDICRAFTS ──
        ['Handwoven Rattan Bag', 'handwoven-rattan-bag', 'Stylish woven rattan bag handcrafted by Boholano artisans.', 'bohol', 'handicrafts', 480.00, 30],
        ['Bamboo Coin Bank', 'bamboo-coin-bank', 'Handmade bamboo coin bank shaped like a traditional Bohol hut.', 'bohol', 'handicrafts', 130.00, 65],
        ['Wooden Carved Ashtray', 'wooden-carved-ashtray', 'Hand-carved wooden ashtray with Bohol tarsier motif.', 'bohol', 'handicrafts', 210.00, 40],
        ['Round Woven Box', 'round-woven-box', 'Round buri-woven storage box with lid, perfect as a jewelry or keepsake box.', 'bohol', 'handicrafts', 295.00, 50],
        ['Bohol Coin Purse', 'bohol-coin-purse', 'Handwoven coin purse with Bohol-inspired patterns and tarsier embroidery.', 'bohol', 'handicrafts', 120.00, 75],
        ['Handwoven Slippers', 'handwoven-slippers-bohol', 'Comfortable handwoven abaca slippers from local Bohol craftspeople.', 'bohol', 'handicrafts', 310.00, 28],
        ['Wooden Ref Magnet', 'wooden-ref-magnet', 'Wooden fridge magnet with laser-engraved Bohol landmarks and tarsier design.', 'bohol', 'handicrafts', 90.00, 160],
        ['Bohol Wooden Keychain', 'bohol-wooden-keychain', 'Hand-carved wooden keychain with Bohol Chocolate Hills silhouette.', 'bohol', 'handicrafts', 80.00, 130],
        
        // ── BORACAY · HANDICRAFTS ──
        ['Boracay Wooden Ref Magnet', 'boracay-wooden-ref-magnet', 'Handpainted wooden fridge magnet featuring Boracay\'s White Beach.', 'boracay', 'handicrafts', 85.00, 200],
        ['Boracay Keychain', 'boracay-keychain', 'Fun seashell-and-resin keychain souvenir from Boracay island.', 'boracay', 'handicrafts', 80.00, 175],
        ['Boracay Bracelet', 'boracay-bracelet', 'Handmade shell and bead bracelet crafted by local Boracay artisans.', 'boracay', 'handicrafts', 115.00, 95],
        ['Handmade Pearl Necklace', 'handmade-pearl-necklace', 'Elegant freshwater pearl necklace handcrafted by island jewelers in Boracay.', 'boracay', 'handicrafts', 980.00, 20],
        ['Boracay Pin', 'boracay-pin', 'Enamel pin featuring Boracay\'s iconic sailboats and sunset scenery.', 'boracay', 'handicrafts', 95.00, 110],
        ['Boracay Tote Bag', 'boracay-tote-bag', 'Canvas tote bag with hand-printed Boracay beach artwork.', 'boracay', 'handicrafts', 320.00, 55],
        ['Boracay Coin Purse', 'boracay-coin-purse', 'Seashell-embellished handmade coin purse, a cute Boracay keepsake.', 'boracay', 'handicrafts', 130.00, 80],
        ['Boracay Bottle Opener', 'boracay-bottle-opener', 'Novelty wooden bottle opener shaped like a surfboard with Boracay branding.', 'boracay', 'handicrafts', 145.00, 65],
        
        // ── VIGAN · DELICACIES ──
        ['Royal Bibingka', 'royal-bibingka', 'Traditional Ilocano bibingka made with glutinous rice, sugar, and coconut milk.', 'vigan', 'delicacies', 180.00, 40],
        ['Chicacorn', 'chicacorn', 'Savory and crunchy corn snack, a popular pasalubong from Vigan.', 'vigan', 'delicacies', 95.00, 100],
        ['Turones De Mani', 'turones-de-mani', 'Crispy fried peanut turrones wrapped in a sweet caramel casing.', 'vigan', 'delicacies', 120.00, 80],
        ['Bolero', 'bolero', 'Sweet Ilocano candy made from caramelized sugar and peanuts.', 'vigan', 'delicacies', 85.00, 90],
        ['Empanadita', 'empanadita', 'Miniature Vigan empanadas filled with longganisa, egg, and vegetables.', 'vigan', 'delicacies', 150.00, 30],
        ['Calamay', 'calamay-vigan', 'Sticky sweet rice delicacy cooked with coconut milk and sugar.', 'vigan', 'delicacies', 165.00, 50],
        ['Vigan Longganisa', 'vigan-longganisa', 'Famous garlic-rich Vigan sausage, a beloved Ilocano breakfast staple.', 'vigan', 'delicacies', 220.00, 35],
        ['Bagnet Vigan', 'bagnet-vigan', 'Crispy double-fried pork belly, the Ilocano version of chicharon.', 'vigan', 'delicacies', 280.00, 25],
        
        // ── BAGUIO · DELICACIES ──
        ['Cream Puffs', 'cream-puffs', 'Fluffy choux pastry filled with fresh cream, Baguio\'s most iconic pasalubong.', 'baguio', 'delicacies', 195.00, 40],
        ['Ube Jam', 'ube-jam', 'Creamy homemade purple yam jam from the highlands of Baguio.', 'baguio', 'delicacies', 175.00, 60],
        ['Lengua De Gato', 'lengua-de-gato', 'Delicate butter cookies shaped like cat tongues, a Baguio baking tradition.', 'baguio', 'delicacies', 155.00, 70],
        ['Peanut Brittle', 'peanut-brittle', 'Classic crunchy peanut brittle made with fresh Benguet peanuts.', 'baguio', 'delicacies', 110.00, 85],
        ['Choc\'O Flakes', 'choco-flakes', 'Crispy chocolate-coated corn flake clusters, a sweet Baguio treat.', 'baguio', 'delicacies', 130.00, 95],
        ['Baguio Strawberry', 'baguio-strawberry', 'Fresh highland strawberries from La Trinidad Valley, Benguet.', 'baguio', 'delicacies', 120.00, 20],
        ['Baguio Meringue', 'baguio-meringue', 'Light and crispy meringue cookies with a melt-in-your-mouth texture.', 'baguio', 'delicacies', 145.00, 65],
        ['Ube Crinkles', 'ube-crinkles', 'Soft and chewy purple yam crinkle cookies dusted with powdered sugar.', 'baguio', 'delicacies', 160.00, 55],
        
        // ── TAGAYTAY · DELICACIES ──
        ['Rowena\'s Blueberry Cheese Tarts', 'rowenas-blueberry-cheese-tarts', 'Famous blueberry-topped cream cheese tarts from Rowena\'s in Tagaytay.', 'tagaytay', 'delicacies', 240.00, 30],
        ['Balay Dako Piaya', 'balay-dako-piaya', 'Flat sugarcane-filled unleavened bread, inspired by Balay Dako\'s local flavors.', 'tagaytay', 'delicacies', 160.00, 45],
        ['Bag of Beans\' Raisin Bread', 'bag-of-beans-raisin-bread', 'Hearty homemade raisin bread from the beloved Bag of Beans café in Tagaytay.', 'tagaytay', 'delicacies', 210.00, 25],
        ['Buko Pie', 'buko-pie', 'Creamy young coconut pie, Tagaytay\'s most famous pasalubong.', 'tagaytay', 'delicacies', 195.00, 35],
        ['Banana Cake', 'banana-cake', 'Moist and flavorful banana loaf cake baked fresh in Tagaytay.', 'tagaytay', 'delicacies', 220.00, 30],
        ['Rodilla\'s Yema Cake', 'rodillas-yema-cake', 'Indulgent yema frosted chiffon cake from Rodilla\'s Bakeshop in Tagaytay.', 'tagaytay', 'delicacies', 350.00, 20],
        ['Espasol', 'espasol', 'Soft cylindrical rice flour delicacy rolled in toasted coconut, a Tagaytay classic.', 'tagaytay', 'delicacies', 130.00, 60],
        ['Sylvannas', 'sylvannas', 'Cashew meringue wafers sandwiched with French buttercream, Tagaytay\'s sweet pride.', 'tagaytay', 'delicacies', 185.00, 50],
        
        // ── BOHOL · DELICACIES ──
        ['Peanut Kisses', 'peanut-kisses', 'Tiny dome-shaped peanut cookies, Bohol\'s most iconic and beloved pasalubong.', 'bohol', 'delicacies', 120.00, 100],
        ['Broas', 'broas', 'Light and airy ladyfinger sponge biscuits, a traditional Bohol delicacy.', 'bohol', 'delicacies', 110.00, 75],
        ['Bohol\'s Calamay', 'bohols-calamay', 'Sweet sticky rice delicacy cooked in coconut milk, served in a coconut shell.', 'bohol', 'delicacies', 165.00, 40],
        ['Ube Kinampay Polvoron', 'ube-kinampay-polvoron', 'Melt-in-your-mouth polvoron made with Bohol\'s prized Kinampay purple yam.', 'bohol', 'delicacies', 140.00, 65],
        ['Tinapay Crisp', 'tinapay-crisp', 'Twice-baked crunchy bread crisps, a satisfying snack from Bohol.', 'bohol', 'delicacies', 95.00, 80],
        ['Dalareich Chocolates', 'dalareich-chocolates', 'Artisanal Philippine cacao chocolates crafted by Dalareich in Bohol.', 'bohol', 'delicacies', 220.00, 45],
        ['Calamay Bun', 'calamay-bun', 'Soft bread rolls filled with sweet calamay coconut-rice filling.', 'bohol', 'delicacies', 130.00, 35],
        ['Hillcolate', 'hillcolate', 'Rich tablea-based chocolate drink mix made from locally sourced Bohol cacao.', 'bohol', 'delicacies', 185.00, 55],
        
        // ── BORACAY · DELICACIES ──
        ['Biscocho', 'biscocho', 'Crispy twice-baked bread slices brushed with butter and sugar, a Visayan classic.', 'boracay', 'delicacies', 105.00, 90],
        ['Calamansi Muffin', 'calamansi-muffin', 'Zesty calamansi-infused muffins baked fresh, a Boracay resort favorite.', 'boracay', 'delicacies', 150.00, 40],
        ['Butterscotch', 'butterscotch', 'Sweet and buttery butterscotch candy squares, a popular island treat.', 'boracay', 'delicacies', 115.00, 80],
        ['Banana Chips', 'banana-chips', 'Thin crispy banana chips fried to golden perfection, lightly salted or sweetened.', 'boracay', 'delicacies', 90.00, 110],
        ['Otap', 'otap', 'Flaky oval-shaped puff pastry dusted with sugar, a beloved Visayan biscuit.', 'boracay', 'delicacies', 100.00, 85],
        ['Barquillos', 'barquillos', 'Thin rolled wafer tubes with a crispy texture, a light and addictive snack.', 'boracay', 'delicacies', 95.00, 75],
        ['Kalamansi Marmalade', 'kalamansi-marmalade', 'Tangy and sweet kalamansi marmalade made from local citrus.', 'boracay', 'delicacies', 165.00, 50],
        ['Fish Cracker', 'fish-cracker', 'Crispy fish crackers made from fresh island catch.', 'boracay', 'delicacies', 85.00, 95],
        
        // ── VIGAN · DECORATIONS ──
        ['Burnay Art Prints', 'burnay-art-prints', 'Artistic prints featuring traditional Vigan Burnay pottery designs.', 'vigan', 'decorations', 380.00, 20],
        ['Vigan Streetscape Art', 'vigan-streetscape-art', 'Beautiful artwork depicting historic Vigan street scenes.', 'vigan', 'decorations', 450.00, 15],
        ['Inabel Placemats', 'inabel-placemats', 'Traditional Ilocano woven placemats with colorful patterns.', 'vigan', 'decorations', 320.00, 35],
        ['Miniature Kalesa Model', 'miniature-kalesa-model', 'Detailed miniature model of the traditional horse-drawn carriage.', 'vigan', 'decorations', 580.00, 22],
        ['Decorative Vases', 'decorative-vases', 'Hand-painted decorative vases in traditional Vigan style.', 'vigan', 'decorations', 620.00, 18],
        ['Ancestral House Figurine', 'ancestral-house-figurine', 'Miniature figurine of traditional Vigan ancestral house.', 'vigan', 'decorations', 490.00, 25],
        ['Clay Sculpture', 'clay-sculpture', 'Handcrafted clay sculpture by Vigan artisans.', 'vigan', 'decorations', 750.00, 10],
        ['Milling Stone Decor', 'milling-stone-decor', 'Decorative replica of traditional stone mill.', 'vigan', 'decorations', 520.00, 12],
        
        // ── BAGUIO · DECORATIONS ──
        ['Ifugao Rice Guardian', 'ifugao-rice-guardian', 'Traditional Ifugao carved rice guardian figure.', 'baguio', 'decorations', 890.00, 15],
        ['Igorot Tribal Wood Carving', 'igorot-tribal-wood-carving', 'Authentic tribal wood carving by Igorot artisans.', 'baguio', 'decorations', 1200.00, 12],
        ['Woven Textile Wall Art', 'woven-textile-wall-art', 'Colorful woven textile art piece for wall display.', 'baguio', 'decorations', 780.00, 18],
        ['Giant Wooden Spoon and Fork Wall Decor', 'giant-wooden-spoon-and-fork-wall-decor', 'Oversized wooden utensils for rustic wall decoration.', 'baguio', 'decorations', 650.00, 20],
        ['Ifugao Tribal Mask', 'ifugao-tribal-mask', 'Hand-carved traditional Ifugao tribal mask.', 'baguio', 'decorations', 1450.00, 8],
        ['Barrel Man', 'barrel-man', 'Iconic Baguio novelty wooden barrel man figurine.', 'baguio', 'decorations', 185.00, 60],
        ['Tribal Bust', 'tribal-bust', 'Carved wooden bust depicting traditional tribal figure.', 'baguio', 'decorations', 980.00, 10],
        ['Animal Wood Carving', 'animal-wood-carving', 'Hand-carved wooden animal figurines.', 'baguio', 'decorations', 320.00, 35],
        
        // ── TAGAYTAY · DECORATIONS ──
        ['Ilog Maria Beeswax Candle', 'ilog-maria-beeswax-candle', 'Natural beeswax candles from Ilog Maria monastery.', 'tagaytay', 'decorations', 280.00, 40],
        ['Taal Lake Wall Painting', 'taal-lake-wall-painting', 'Beautiful painting featuring scenic Taal Lake views.', 'tagaytay', 'decorations', 1800.00, 10],
        ['Small Potted Plants', 'small-potted-plants', 'Assorted small potted plants perfect for home decor.', 'tagaytay', 'decorations', 145.00, 50],
        ['Tagaytay Postcard', 'tagaytay-postcard', 'Collectible postcards featuring Tagaytay landmarks.', 'tagaytay', 'decorations', 75.00, 120],
        ['Tagaytay Mini Figurines', 'tagaytay-mini-figurines', 'Miniature figurines of Tagaytay attractions.', 'tagaytay', 'decorations', 190.00, 45],
        ['Dreamcatcher Wall Display', 'dreamcatcher-wall-display', 'Large decorative dreamcatcher for wall mounting.', 'tagaytay', 'decorations', 480.00, 20],
        ['Cellphone Holder', 'cellphone-holder', 'Handcrafted wooden cellphone holder.', 'tagaytay', 'decorations', 165.00, 55],
        ['Pen Holder', 'pen-holder', 'Decorative wooden pen and pencil holder.', 'tagaytay', 'decorations', 140.00, 60],
        
        // ── BOHOL · DECORATIONS ──
        ['Antequera Baskets', 'antequera-baskets-decor', 'Decorative woven baskets from Antequera, Bohol.', 'bohol', 'decorations', 350.00, 35],
        ['Table Runners', 'table-runners', 'Hand-woven table runners with traditional patterns.', 'bohol', 'decorations', 280.00, 28],
        ['Bohol Shell Decor', 'bohol-shell-decor', 'Decorative shell arrangements from Bohol shores.', 'bohol', 'decorations', 195.00, 45],
        ['Coconut Bowls with Mother of Pearl', 'coconut-bowls-with-mother-of-pearl', 'Polished coconut bowls inlaid with mother of pearl.', 'bohol', 'decorations', 420.00, 30],
        ['Tarsier Wood Carving', 'tarsier-wood-carving', 'Hand-carved wooden tarsier figurine.', 'bohol', 'decorations', 380.00, 40],
        ['Asin Tibuok', 'asin-tibuok', 'Traditional Bohol sea salt formed in coconut husks.', 'bohol', 'decorations', 650.00, 15],
        ['Buri Lampshade', 'buri-lampshade', 'Handwoven buri palm lampshade.', 'bohol', 'decorations', 780.00, 18],
        ['Capiz Shell Window', 'capiz-shell-window', 'Traditional window panel made from capiz shells.', 'bohol', 'decorations', 1200.00, 8],
        
        // ── BORACAY · DECORATIONS ──
        ['Boracay Sand Bottles', 'boracay-sand-bottles', 'Decorative bottles filled with layered Boracay sand.', 'boracay', 'decorations', 125.00, 80],
        ['Abaca Placemats', 'abaca-placemats', 'Natural abaca fiber placemats.', 'boracay', 'decorations', 220.00, 50],
        ['Boracay Painting', 'boracay-painting', 'Artistic painting of Boracay beach scenes.', 'boracay', 'decorations', 1500.00, 12],
        ['Miniature Boat Models', 'miniature-boat-models', 'Detailed miniature models of traditional boats.', 'boracay', 'decorations', 560.00, 25],
        ['Boracay Lanterns', 'boracay-lanterns', 'Decorative lanterns with beach-themed designs.', 'boracay', 'decorations', 390.00, 30],
        ['Shell Chimes', 'shell-chimes', 'Wind chimes made from natural seashells.', 'boracay', 'decorations', 185.00, 55],
        ['Stone Figurines', 'stone-figurines', 'Hand-carved stone figurines.', 'boracay', 'decorations', 260.00, 40],
        ['Wooden Plate Decor', 'wooden-plate-decor', 'Decorative wooden plates with painted designs.', 'boracay', 'decorations', 340.00, 22],
        
        // ── VIGAN · HOMEWARE ──
        ['Burnay Pottery Set', 'burnay-pottery-set', 'Complete set of traditional Burnay pottery for home use.', 'vigan', 'homeware', 850.00, 15],
        ['Wooden Furnitures', 'wooden-furnitures', 'Handcrafted wooden furniture pieces in traditional Ilocano style.', 'vigan', 'homeware', 2500.00, 8],
        ['Buri Baskets and Storage', 'buri-baskets-and-storage', 'Versatile storage baskets woven from buri palm.', 'vigan', 'homeware', 380.00, 40],
        ['Inabel Cloth', 'inabel-cloth', 'Traditional handwoven Inabel fabric.', 'vigan', 'homeware', 550.00, 25],
        ['Shell Lamp', 'shell-lamp', 'Decorative lamp adorned with natural shells.', 'vigan', 'homeware', 980.00, 12],
        ['Wood Carved Wall Decor', 'wood-carved-wall-decor', 'Intricate hand-carved wooden wall decoration.', 'vigan', 'homeware', 1200.00, 10],
        ['Bamboo Rattan Furnitures', 'bamboo-rattan-furnitures', 'Sturdy furniture made from bamboo and rattan.', 'vigan', 'homeware', 3200.00, 6],
        ['Bulatlat Pottery Set', 'bulatlat-pottery-set', 'Set of traditional Bulatlat pottery jars.', 'vigan', 'homeware', 720.00, 14],
        
        // ── BAGUIO · HOMEWARE ──
        ['Ifugao Wooden Statue', 'ifugao-wooden-statue', 'Large carved wooden statue in Ifugao tradition.', 'baguio', 'homeware', 1500.00, 10],
        ['Wooden Tableware', 'wooden-tableware', 'Handcrafted wooden plates, bowls, and utensils.', 'baguio', 'homeware', 680.00, 22],
        ['Terracotta Planters', 'terracotta-planters', 'Traditional terracotta plant pots.', 'baguio', 'homeware', 290.00, 35],
        ['Igorot Handwoven Blankets', 'igorot-handwoven-blankets', 'Warm handwoven blankets with tribal patterns.', 'baguio', 'homeware', 1100.00, 15],
        ['Handwoven Foot Rugs', 'handwoven-foot-rugs', 'Durable handwoven rugs for home use.', 'baguio', 'homeware', 450.00, 20],
        ['Bamboo Lantern', 'bamboo-lantern', 'Traditional bamboo lantern for ambient lighting.', 'baguio', 'homeware', 380.00, 28],
        ['Mug', 'mug-baguio', 'Ceramic mug with Baguio designs.', 'baguio', 'homeware', 195.00, 60],
        ['Wall Photo', 'wall-photo', 'Framed photographs of Baguio scenery.', 'baguio', 'homeware', 420.00, 18],
        
        // ── TAGAYTAY · HOMEWARE ──
        ['Mahogany Bowl', 'mahogany-bowl', 'Hand-turned mahogany wood serving bowl.', 'tagaytay', 'homeware', 580.00, 18],
        ['Abaca Basket', 'abaca-basket', 'Large storage basket woven from abaca fiber.', 'tagaytay', 'homeware', 320.00, 32],
        ['Tagaytay Terracotta Planters', 'tagaytay-terracotta-planters', 'Rustic terracotta planters for indoor plants.', 'tagaytay', 'homeware', 265.00, 28],
        ['Tagaytay Candle', 'tagaytay-candle', 'Scented candles with natural local fragrances.', 'tagaytay', 'homeware', 245.00, 50],
        ['Wood Clock', 'wood-clock', 'Wall clock made from polished wood.', 'tagaytay', 'homeware', 680.00, 15],
        ['Embroidered Linens', 'embroidered-linens', 'Hand-embroidered table linens and napkins.', 'tagaytay', 'homeware', 490.00, 22],
        ['Wood Chimes', 'wood-chimes', 'Melodious wind chimes made from bamboo.', 'tagaytay', 'homeware', 220.00, 38],
        ['Concrete Planters', 'concrete-planters', 'Modern concrete planters for succulents.', 'tagaytay', 'homeware', 350.00, 25],
        
        // ── BOHOL · HOMEWARE ──
        ['Bohol Coconut Bowl', 'bohol-coconut-bowl', 'Polished coconut shell bowl for serving.', 'bohol', 'homeware', 195.00, 55],
        ['Seashell Chime', 'seashell-chime', 'Musical wind chime made from seashells.', 'bohol', 'homeware', 185.00, 45],
        ['Tubigon Weave', 'tubigon-weave', 'Traditional woven textile from Tubigon.', 'bohol', 'homeware', 420.00, 20],
        ['Wooden Kitchenware', 'wooden-kitchenware-bohol', 'Set of wooden spoons and cooking utensils.', 'bohol', 'homeware', 280.00, 38],
        ['Antequera Baskets', 'antequera-baskets-homeware', 'Functional storage baskets from Antequera.', 'bohol', 'homeware', 450.00, 22],
        ['Woven Nito Vine Accessories', 'woven-nito-vine-accessories', 'Home accessories woven from nito vine.', 'bohol', 'homeware', 380.00, 18],
        ['Bohol Bamboo Furniture', 'bohol-bamboo-furniture', 'Sustainable bamboo furniture pieces.', 'bohol', 'homeware', 3500.00, 5],
        ['Woven Buri Window Blinds', 'woven-buri-window-blinds', 'Natural window blinds woven from buri.', 'bohol', 'homeware', 1100.00, 10],
        
        // ── BORACAY · HOMEWARE ──
        ['Shell Decor', 'shell-decor', 'Decorative shell arrangements for home.', 'boracay', 'homeware', 180.00, 60],
        ['Puka Shell Chandeliers', 'puka-shell-chandeliers', 'Elegant chandelier made from puka shells.', 'boracay', 'homeware', 2800.00, 8],
        ['Driftwood Centerpiece Bowls', 'driftwood-centerpiece-bowls', 'Unique bowls carved from driftwood.', 'boracay', 'homeware', 650.00, 15],
        ['Pandanus (Bariw) Floor Mats', 'pandanus-bariw-floor-mats', 'Natural floor mats woven from pandanus.', 'boracay', 'homeware', 480.00, 20],
        ['Aqua de Boracay Home Fragrance', 'aqua-de-boracay-home-fragrance', 'Ocean-inspired home fragrance spray.', 'boracay', 'homeware', 320.00, 40],
        ['Coconut Shell Soy Candles', 'coconut-shell-soy-candles', 'Eco-friendly soy candles in coconut shells.', 'boracay', 'homeware', 285.00, 50],
        ['Kamagong Utensils', 'kamagong-utensils', 'Premium utensils carved from kamagong wood.', 'boracay', 'homeware', 850.00, 12],
        ['Tsokolatera & Batirol', 'tsokolatera-batirol', 'Traditional chocolate making set with wooden whisk.', 'boracay', 'homeware', 620.00, 18],
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
    echo "✓ Seeded " . count($products) . " products\n";

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
