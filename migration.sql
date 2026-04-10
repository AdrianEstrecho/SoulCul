-- ═══════════════════════════════════════════════════════════
--  SouCul — Migration: Missing Tables & Columns
--  Run this in phpMyAdmin or MySQL CLI on the 'soucul' database
--  Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS)
-- ═══════════════════════════════════════════════════════════

-- ── 1. VOUCHERS ──────────────────────────────────────────────────────────────
-- Referenced by /api/v1/admin/vouchers/*

CREATE TABLE IF NOT EXISTS vouchers (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  code                 VARCHAR(50)  NOT NULL UNIQUE,
  discount_type        ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  discount_value       DECIMAL(10,2) NOT NULL,
  min_purchase_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount_amount  DECIMAL(10,2) DEFAULT NULL,   -- NULL = no cap
  usage_limit          INT DEFAULT NULL,              -- NULL = unlimited
  usage_count          INT NOT NULL DEFAULT 0,
  per_user_limit       INT DEFAULT NULL,
  valid_from           DATE NOT NULL,
  valid_until          DATE NOT NULL,
  status               ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  description          TEXT DEFAULT NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code   (code),
  INDEX idx_status (status)
);

-- ── 2. AUDIT LOGS ────────────────────────────────────────────────────────────
-- Referenced by logAudit() in every endpoint and /api/v1/admin/audit

CREATE TABLE IF NOT EXISTS audit_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  admin_id     INT NOT NULL,
  action       VARCHAR(50)  NOT NULL,   -- Create | Update | Delete | Archive | Login | Logout
  entity       VARCHAR(50)  NOT NULL,   -- Product | Order | User | Voucher | Admin | System
  entity_name  VARCHAR(255) NOT NULL,   -- human-readable name of the affected record
  description  TEXT         NOT NULL,
  ip_address   VARCHAR(45)  DEFAULT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_admin_id  (admin_id),
  INDEX idx_action    (action),
  INDEX idx_entity    (entity),
  INDEX idx_created   (created_at)
);

-- ── 3. ORDERS — add is_archived flag ─────────────────────────────────────────
-- The archive endpoints use is_archived instead of repurposing 'cancelled'

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_archived TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE orders
  ADD INDEX IF NOT EXISTS idx_archived (is_archived);

-- ── 3.1 PRODUCTS — add featured flag for homepage highlights ───────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0
  AFTER featured_image_url;

ALTER TABLE products
  ADD INDEX IF NOT EXISTS idx_products_featured_active (is_featured, is_active);

-- Seed a starter featured set only when none is currently marked featured.
UPDATE products p
JOIN (
  SELECT id
  FROM products
  WHERE is_active = 1
  ORDER BY created_at DESC, id DESC
  LIMIT 7
) picks ON p.id = picks.id
JOIN (
  SELECT COUNT(*) AS featured_count
  FROM products
  WHERE is_featured = 1
) summary ON 1 = 1
SET p.is_featured = 1
WHERE summary.featured_count = 0;

-- ── 4.1 CUSTOMER PROFILE TABS — payment/security/reviews ───────────────────

CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(30) NOT NULL,
  label VARCHAR(120) NOT NULL,
  details_masked VARCHAR(255) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_customer_payment_methods_user (user_id),
  INDEX idx_customer_payment_methods_default (user_id, is_default, is_active)
);

CREATE TABLE IF NOT EXISTS customer_security_settings (
  user_id INT PRIMARY KEY,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_method ENUM('sms', 'app') NOT NULL DEFAULT 'sms',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_linked_accounts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider VARCHAR(40) NOT NULL,
  account_label VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_customer_linked_provider (user_id, provider),
  INDEX idx_customer_linked_accounts_user (user_id, is_active)
);

CREATE TABLE IF NOT EXISTS customer_reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(255) NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_customer_reviews_user_created (user_id, created_at),
  INDEX idx_customer_reviews_product (product_id)
);

-- ── 4. ADMINS — add username column (frontend uses username) ─────────────────
-- Your schema only has full_name; the frontend separately tracks username

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS username VARCHAR(100) DEFAULT NULL AFTER id;

ALTER TABLE admins
  ADD UNIQUE INDEX IF NOT EXISTS idx_username (username);

-- Backfill username from full_name for existing rows (lowercase, no spaces)
UPDATE admins
SET username = LOWER(REPLACE(full_name, ' ', '_'))
WHERE username IS NULL;

-- ── 5. SEED — default super admin ────────────────────────────────────────────
-- Password is: admin123
-- Change immediately after first login via Security & Settings

INSERT IGNORE INTO admins (username, email, password_hash, full_name, phone, role, is_active)
VALUES (
  'superadmin',
  'admin@soucul.com',
  '$2y$12$G3kjFSLa3bMwAEEsfpy/aeeqiON5HwUxBeW8cSr.3ZiTM8x8.XhnG', -- admin123 (bcrypt)
  'Super Admin',
  '+63-123-456-7890',
  'super_admin',
  1
);

-- ── 6. SEED — locations (provinces) ─────────────────────────────────────────

INSERT IGNORE INTO locations (name, slug, region, province, is_active, display_order) VALUES
  ('Vigan',    'vigan',    'Ilocos Region',     'Ilocos Sur',    1, 1),
  ('Baguio',   'baguio',   'Cordillera Administrative Region', 'Benguet', 1, 2),
  ('Boracay',  'boracay',  'Western Visayas',   'Aklan',         1, 3),
  ('Tagaytay', 'tagaytay', 'Calabarzon',        'Cavite',        1, 4),
  ('Bohol',    'bohol',    'Central Visayas',   'Bohol',         1, 5);

-- ── 7. SEED — categories (subcategories) ────────────────────────────────────

INSERT IGNORE INTO categories (name, slug, is_active, display_order) VALUES
  ('Handicrafts',  'handicrafts',  1, 1),
  ('Delicacies',   'delicacies',   1, 2),
  ('Decorations',  'decorations',  1, 3),
  ('Homeware',     'homeware',     1, 4),
  ('Clothes',      'clothes',      1, 5);

-- ── 8. SEED: FULL PRODUCT CATALOG ────────────────────────────────────────
-- Converted from backend/seed.php products array
INSERT IGNORE INTO products (
  name, slug, description, location_id, category_id, admin_id, price, quantity_in_stock, is_active
)
SELECT
  p.name,
  p.slug,
  p.description,
  l.id AS location_id,
  c.id AS category_id,
  a.id AS admin_id,
  p.price,
  p.quantity_in_stock,
  1 AS is_active
FROM (

  SELECT 'Burnay Pottery' AS name, 'burnay-pottery' AS slug, 'Traditional hand-thrown earthenware pot from Vigan, fired using the centuries-old Burnay technique.' AS description, 'vigan' AS location_slug, 'handicrafts' AS category_slug, 450.00 AS price, 30 AS quantity_in_stock
  UNION ALL
  SELECT 'Handwoven Baskets' AS name, 'handwoven-baskets-vigan' AS slug, 'Sturdy rattan baskets handwoven by local Ilocano artisans in Vigan.' AS description, 'vigan' AS location_slug, 'handicrafts' AS category_slug, 280.00 AS price, 50 AS quantity_in_stock
  UNION ALL
  SELECT 'Damili Pottery' AS name, 'damili-pottery' AS slug, 'Elegant Damili-style clay pottery unique to Vigan''s heritage craft tradition.' AS description, 'vigan' AS location_slug, 'handicrafts' AS category_slug, 520.00 AS price, 25 AS quantity_in_stock
  UNION ALL
  SELECT 'Vigan Wallets' AS name, 'vigan-wallets' AS slug, 'Hand-stitched leather wallets crafted by Vigan artisans with Ilocano motifs.' AS description, 'vigan' AS location_slug, 'handicrafts' AS category_slug, 350.00 AS price, 60 AS quantity_in_stock
  UNION ALL
  SELECT 'Buri Bags' AS name, 'buri-bags' AS slug, 'Lightweight and eco-friendly bags woven from Buri palm leaves, a Vigan staple.' AS description, 'vigan' AS location_slug, 'handicrafts' AS category_slug, 320.00 AS price, 45 AS quantity_in_stock
  UNION ALL
  SELECT 'Wood Coasters' AS name, 'wood-coasters' AS slug, 'Set of 4 hand-carved wooden coasters with traditional Ilocano patterns.' AS description, 'vigan' AS location_slug, 'handicrafts' AS category_slug, 150.00 AS price, 80 AS quantity_in_stock
  UNION ALL
  SELECT 'Labba' AS name, 'labba' AS slug, 'Traditional Ilocano woven blanket, the Labba, made with colorful thread patterns.' AS description, 'vigan' AS location_slug, 'handicrafts' AS category_slug, 680.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Bulatlat Pottery' AS name, 'bulatlat-pottery' AS slug, 'Round-bellied Bulatlat clay jar, a signature form of Vigan''s Burnay pottery craft.' AS description, 'vigan' AS location_slug, 'handicrafts' AS category_slug, 490.00 AS price, 18 AS quantity_in_stock
  UNION ALL
  SELECT 'Baguio Keychains' AS name, 'baguio-keychains' AS slug, 'Colorful handcrafted keychains featuring Baguio landmarks and tribal motifs.' AS description, 'baguio' AS location_slug, 'handicrafts' AS category_slug, 85.00 AS price, 120 AS quantity_in_stock
  UNION ALL
  SELECT 'Handwoven Tela' AS name, 'handwoven-tela' AS slug, 'Beautiful handwoven fabric by Cordillera weavers using traditional backstrap looms.' AS description, 'baguio' AS location_slug, 'handicrafts' AS category_slug, 750.00 AS price, 35 AS quantity_in_stock
  UNION ALL
  SELECT 'Baguio Handfan' AS name, 'baguio-handfan' AS slug, 'Handwoven rattan fan with tribal geometric patterns, perfect for warm days.' AS description, 'baguio' AS location_slug, 'handicrafts' AS category_slug, 120.00 AS price, 55 AS quantity_in_stock
  UNION ALL
  SELECT 'Refrigerator Magnet' AS name, 'refrigerator-magnet' AS slug, 'Cute resin fridge magnet featuring iconic Baguio sceneries and attractions.' AS description, 'baguio' AS location_slug, 'handicrafts' AS category_slug, 75.00 AS price, 200 AS quantity_in_stock
  UNION ALL
  SELECT 'Rattan Baskets' AS name, 'rattan-baskets-baguio' AS slug, 'Handwoven rattan storage baskets crafted by Cordillera artisans in Baguio.' AS description, 'baguio' AS location_slug, 'handicrafts' AS category_slug, 350.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Sinalapid Slippers' AS name, 'sinalapid-slippers' AS slug, 'Handmade braided slippers using traditional Cordillera weaving techniques.' AS description, 'baguio' AS location_slug, 'handicrafts' AS category_slug, 290.00 AS price, 30 AS quantity_in_stock
  UNION ALL
  SELECT 'Basahan Tela' AS name, 'basahan-tela' AS slug, 'Traditional recycled cloth fabric woven into colorful rugs and mats.' AS description, 'baguio' AS location_slug, 'handicrafts' AS category_slug, 420.00 AS price, 25 AS quantity_in_stock
  UNION ALL
  SELECT 'Baguio Bracelets' AS name, 'baguio-bracelets' AS slug, 'Beaded bracelets inspired by Igorot tribal jewelry, handmade in Baguio.' AS description, 'baguio' AS location_slug, 'handicrafts' AS category_slug, 110.00 AS price, 90 AS quantity_in_stock
  UNION ALL
  SELECT 'Dream Catchers' AS name, 'dream-catchers' AS slug, 'Handmade dream catchers with natural feathers and beads, crafted in Tagaytay.' AS description, 'tagaytay' AS location_slug, 'handicrafts' AS category_slug, 220.00 AS price, 45 AS quantity_in_stock
  UNION ALL
  SELECT 'I Love Tagaytay Keychain' AS name, 'i-love-tagaytay-keychain' AS slug, 'Charming souvenir keychain with Tagaytay landmark illustrations.' AS description, 'tagaytay' AS location_slug, 'handicrafts' AS category_slug, 80.00 AS price, 150 AS quantity_in_stock
  UNION ALL
  SELECT 'I Love Tagaytay Coin Purse' AS name, 'i-love-tagaytay-coin-purse' AS slug, 'Handstitched coin purse with a Tagaytay-themed print.' AS description, 'tagaytay' AS location_slug, 'handicrafts' AS category_slug, 145.00 AS price, 60 AS quantity_in_stock
  UNION ALL
  SELECT 'Tagaytay Ref Magnet' AS name, 'tagaytay-ref-magnet' AS slug, 'Scenic Taal Volcano souvenir refrigerator magnet from Tagaytay.' AS description, 'tagaytay' AS location_slug, 'handicrafts' AS category_slug, 75.00 AS price, 180 AS quantity_in_stock
  UNION ALL
  SELECT 'Tagaytay Bags' AS name, 'tagaytay-bags' AS slug, 'Woven abaca tote bags featuring Tagaytay scenery prints.' AS description, 'tagaytay' AS location_slug, 'handicrafts' AS category_slug, 380.00 AS price, 35 AS quantity_in_stock
  UNION ALL
  SELECT 'Handwoven Baskets' AS name, 'handwoven-baskets-tagaytay' AS slug, 'Natural fiber baskets woven by local craftspeople in the Tagaytay region.' AS description, 'tagaytay' AS location_slug, 'handicrafts' AS category_slug, 260.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Wooden Kitchenware' AS name, 'wooden-kitchenware-tagaytay' AS slug, 'Handcrafted wooden spoons, spatulas and ladles made from local hardwood.' AS description, 'tagaytay' AS location_slug, 'handicrafts' AS category_slug, 195.00 AS price, 55 AS quantity_in_stock
  UNION ALL
  SELECT 'Coconut Shell Placemat' AS name, 'coconut-shell-placemat' AS slug, 'Eco-friendly placemats made from woven coconut shell strips.' AS description, 'tagaytay' AS location_slug, 'handicrafts' AS category_slug, 170.00 AS price, 70 AS quantity_in_stock
  UNION ALL
  SELECT 'Handwoven Rattan Bag' AS name, 'handwoven-rattan-bag' AS slug, 'Stylish woven rattan bag handcrafted by Boholano artisans.' AS description, 'bohol' AS location_slug, 'handicrafts' AS category_slug, 480.00 AS price, 30 AS quantity_in_stock
  UNION ALL
  SELECT 'Bamboo Coin Bank' AS name, 'bamboo-coin-bank' AS slug, 'Handmade bamboo coin bank shaped like a traditional Bohol hut.' AS description, 'bohol' AS location_slug, 'handicrafts' AS category_slug, 130.00 AS price, 65 AS quantity_in_stock
  UNION ALL
  SELECT 'Wooden Carved Ashtray' AS name, 'wooden-carved-ashtray' AS slug, 'Hand-carved wooden ashtray with Bohol tarsier motif.' AS description, 'bohol' AS location_slug, 'handicrafts' AS category_slug, 210.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Round Woven Box' AS name, 'round-woven-box' AS slug, 'Round buri-woven storage box with lid, perfect as a jewelry or keepsake box.' AS description, 'bohol' AS location_slug, 'handicrafts' AS category_slug, 295.00 AS price, 50 AS quantity_in_stock
  UNION ALL
  SELECT 'Bohol Coin Purse' AS name, 'bohol-coin-purse' AS slug, 'Handwoven coin purse with Bohol-inspired patterns and tarsier embroidery.' AS description, 'bohol' AS location_slug, 'handicrafts' AS category_slug, 120.00 AS price, 75 AS quantity_in_stock
  UNION ALL
  SELECT 'Handwoven Slippers' AS name, 'handwoven-slippers-bohol' AS slug, 'Comfortable handwoven abaca slippers from local Bohol craftspeople.' AS description, 'bohol' AS location_slug, 'handicrafts' AS category_slug, 310.00 AS price, 28 AS quantity_in_stock
  UNION ALL
  SELECT 'Wooden Ref Magnet' AS name, 'wooden-ref-magnet' AS slug, 'Wooden fridge magnet with laser-engraved Bohol landmarks and tarsier design.' AS description, 'bohol' AS location_slug, 'handicrafts' AS category_slug, 90.00 AS price, 160 AS quantity_in_stock
  UNION ALL
  SELECT 'Bohol Wooden Keychain' AS name, 'bohol-wooden-keychain' AS slug, 'Hand-carved wooden keychain with Bohol Chocolate Hills silhouette.' AS description, 'bohol' AS location_slug, 'handicrafts' AS category_slug, 80.00 AS price, 130 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Wooden Ref Magnet' AS name, 'boracay-wooden-ref-magnet' AS slug, 'Handpainted wooden fridge magnet featuring Boracay''s White Beach.' AS description, 'boracay' AS location_slug, 'handicrafts' AS category_slug, 85.00 AS price, 200 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Keychain' AS name, 'boracay-keychain' AS slug, 'Fun seashell-and-resin keychain souvenir from Boracay island.' AS description, 'boracay' AS location_slug, 'handicrafts' AS category_slug, 80.00 AS price, 175 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Bracelet' AS name, 'boracay-bracelet' AS slug, 'Handmade shell and bead bracelet crafted by local Boracay artisans.' AS description, 'boracay' AS location_slug, 'handicrafts' AS category_slug, 115.00 AS price, 95 AS quantity_in_stock
  UNION ALL
  SELECT 'Handmade Pearl Necklace' AS name, 'handmade-pearl-necklace' AS slug, 'Elegant freshwater pearl necklace handcrafted by island jewelers in Boracay.' AS description, 'boracay' AS location_slug, 'handicrafts' AS category_slug, 980.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Pin' AS name, 'boracay-pin' AS slug, 'Enamel pin featuring Boracay''s iconic sailboats and sunset scenery.' AS description, 'boracay' AS location_slug, 'handicrafts' AS category_slug, 95.00 AS price, 110 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Tote Bag' AS name, 'boracay-tote-bag' AS slug, 'Canvas tote bag with hand-printed Boracay beach artwork.' AS description, 'boracay' AS location_slug, 'handicrafts' AS category_slug, 320.00 AS price, 55 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Coin Purse' AS name, 'boracay-coin-purse' AS slug, 'Seashell-embellished handmade coin purse, a cute Boracay keepsake.' AS description, 'boracay' AS location_slug, 'handicrafts' AS category_slug, 130.00 AS price, 80 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Bottle Opener' AS name, 'boracay-bottle-opener' AS slug, 'Novelty wooden bottle opener shaped like a surfboard with Boracay branding.' AS description, 'boracay' AS location_slug, 'handicrafts' AS category_slug, 145.00 AS price, 65 AS quantity_in_stock
  UNION ALL
  SELECT 'Royal Bibingka' AS name, 'royal-bibingka' AS slug, 'Traditional Ilocano bibingka made with glutinous rice, sugar, and coconut milk.' AS description, 'vigan' AS location_slug, 'delicacies' AS category_slug, 180.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Chicacorn' AS name, 'chicacorn' AS slug, 'Savory and crunchy corn snack, a popular pasalubong from Vigan.' AS description, 'vigan' AS location_slug, 'delicacies' AS category_slug, 95.00 AS price, 100 AS quantity_in_stock
  UNION ALL
  SELECT 'Turones De Mani' AS name, 'turones-de-mani' AS slug, 'Crispy fried peanut turrones wrapped in a sweet caramel casing.' AS description, 'vigan' AS location_slug, 'delicacies' AS category_slug, 120.00 AS price, 80 AS quantity_in_stock
  UNION ALL
  SELECT 'Bolero' AS name, 'bolero' AS slug, 'Sweet Ilocano candy made from caramelized sugar and peanuts.' AS description, 'vigan' AS location_slug, 'delicacies' AS category_slug, 85.00 AS price, 90 AS quantity_in_stock
  UNION ALL
  SELECT 'Empanadita' AS name, 'empanadita' AS slug, 'Miniature Vigan empanadas filled with longganisa, egg, and vegetables.' AS description, 'vigan' AS location_slug, 'delicacies' AS category_slug, 150.00 AS price, 30 AS quantity_in_stock
  UNION ALL
  SELECT 'Calamay' AS name, 'calamay-vigan' AS slug, 'Sticky sweet rice delicacy cooked with coconut milk and sugar.' AS description, 'vigan' AS location_slug, 'delicacies' AS category_slug, 165.00 AS price, 50 AS quantity_in_stock
  UNION ALL
  SELECT 'Vigan Longganisa' AS name, 'vigan-longganisa' AS slug, 'Famous garlic-rich Vigan sausage, a beloved Ilocano breakfast staple.' AS description, 'vigan' AS location_slug, 'delicacies' AS category_slug, 220.00 AS price, 35 AS quantity_in_stock
  UNION ALL
  SELECT 'Bagnet Vigan' AS name, 'bagnet-vigan' AS slug, 'Crispy double-fried pork belly, the Ilocano version of chicharon.' AS description, 'vigan' AS location_slug, 'delicacies' AS category_slug, 280.00 AS price, 25 AS quantity_in_stock
  UNION ALL
  SELECT 'Cream Puffs' AS name, 'cream-puffs' AS slug, 'Fluffy choux pastry filled with fresh cream, Baguio''s most iconic pasalubong.' AS description, 'baguio' AS location_slug, 'delicacies' AS category_slug, 195.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Ube Jam' AS name, 'ube-jam' AS slug, 'Creamy homemade purple yam jam from the highlands of Baguio.' AS description, 'baguio' AS location_slug, 'delicacies' AS category_slug, 175.00 AS price, 60 AS quantity_in_stock
  UNION ALL
  SELECT 'Lengua De Gato' AS name, 'lengua-de-gato' AS slug, 'Delicate butter cookies shaped like cat tongues, a Baguio baking tradition.' AS description, 'baguio' AS location_slug, 'delicacies' AS category_slug, 155.00 AS price, 70 AS quantity_in_stock
  UNION ALL
  SELECT 'Peanut Brittle' AS name, 'peanut-brittle' AS slug, 'Classic crunchy peanut brittle made with fresh Benguet peanuts.' AS description, 'baguio' AS location_slug, 'delicacies' AS category_slug, 110.00 AS price, 85 AS quantity_in_stock
  UNION ALL
  SELECT 'Choc''O Flakes' AS name, 'choco-flakes' AS slug, 'Crispy chocolate-coated corn flake clusters, a sweet Baguio treat.' AS description, 'baguio' AS location_slug, 'delicacies' AS category_slug, 130.00 AS price, 95 AS quantity_in_stock
  UNION ALL
  SELECT 'Baguio Strawberry' AS name, 'baguio-strawberry' AS slug, 'Fresh highland strawberries from La Trinidad Valley, Benguet.' AS description, 'baguio' AS location_slug, 'delicacies' AS category_slug, 120.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Baguio Meringue' AS name, 'baguio-meringue' AS slug, 'Light and crispy meringue cookies with a melt-in-your-mouth texture.' AS description, 'baguio' AS location_slug, 'delicacies' AS category_slug, 145.00 AS price, 65 AS quantity_in_stock
  UNION ALL
  SELECT 'Ube Crinkles' AS name, 'ube-crinkles' AS slug, 'Soft and chewy purple yam crinkle cookies dusted with powdered sugar.' AS description, 'baguio' AS location_slug, 'delicacies' AS category_slug, 160.00 AS price, 55 AS quantity_in_stock
  UNION ALL
  SELECT 'Rowena''s Blueberry Cheese Tarts' AS name, 'rowenas-blueberry-cheese-tarts' AS slug, 'Famous blueberry-topped cream cheese tarts from Rowena''s in Tagaytay.' AS description, 'tagaytay' AS location_slug, 'delicacies' AS category_slug, 240.00 AS price, 30 AS quantity_in_stock
  UNION ALL
  SELECT 'Balay Dako Piaya' AS name, 'balay-dako-piaya' AS slug, 'Flat sugarcane-filled unleavened bread, inspired by Balay Dako''s local flavors.' AS description, 'tagaytay' AS location_slug, 'delicacies' AS category_slug, 160.00 AS price, 45 AS quantity_in_stock
  UNION ALL
  SELECT 'Bag of Beans'' Raisin Bread' AS name, 'bag-of-beans-raisin-bread' AS slug, 'Hearty homemade raisin bread from the beloved Bag of Beans café in Tagaytay.' AS description, 'tagaytay' AS location_slug, 'delicacies' AS category_slug, 210.00 AS price, 25 AS quantity_in_stock
  UNION ALL
  SELECT 'Buko Pie' AS name, 'buko-pie' AS slug, 'Creamy young coconut pie, Tagaytay''s most famous pasalubong.' AS description, 'tagaytay' AS location_slug, 'delicacies' AS category_slug, 195.00 AS price, 35 AS quantity_in_stock
  UNION ALL
  SELECT 'Banana Cake' AS name, 'banana-cake' AS slug, 'Moist and flavorful banana loaf cake baked fresh in Tagaytay.' AS description, 'tagaytay' AS location_slug, 'delicacies' AS category_slug, 220.00 AS price, 30 AS quantity_in_stock
  UNION ALL
  SELECT 'Rodilla''s Yema Cake' AS name, 'rodillas-yema-cake' AS slug, 'Indulgent yema frosted chiffon cake from Rodilla''s Bakeshop in Tagaytay.' AS description, 'tagaytay' AS location_slug, 'delicacies' AS category_slug, 350.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Espasol' AS name, 'espasol' AS slug, 'Soft cylindrical rice flour delicacy rolled in toasted coconut, a Tagaytay classic.' AS description, 'tagaytay' AS location_slug, 'delicacies' AS category_slug, 130.00 AS price, 60 AS quantity_in_stock
  UNION ALL
  SELECT 'Sylvannas' AS name, 'sylvannas' AS slug, 'Cashew meringue wafers sandwiched with French buttercream, Tagaytay''s sweet pride.' AS description, 'tagaytay' AS location_slug, 'delicacies' AS category_slug, 185.00 AS price, 50 AS quantity_in_stock
  UNION ALL
  SELECT 'Peanut Kisses' AS name, 'peanut-kisses' AS slug, 'Tiny dome-shaped peanut cookies, Bohol''s most iconic and beloved pasalubong.' AS description, 'bohol' AS location_slug, 'delicacies' AS category_slug, 120.00 AS price, 100 AS quantity_in_stock
  UNION ALL
  SELECT 'Broas' AS name, 'broas' AS slug, 'Light and airy ladyfinger sponge biscuits, a traditional Bohol delicacy.' AS description, 'bohol' AS location_slug, 'delicacies' AS category_slug, 110.00 AS price, 75 AS quantity_in_stock
  UNION ALL
  SELECT 'Bohol''s Calamay' AS name, 'bohols-calamay' AS slug, 'Sweet sticky rice delicacy cooked in coconut milk, served in a coconut shell.' AS description, 'bohol' AS location_slug, 'delicacies' AS category_slug, 165.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Ube Kinampay Polvoron' AS name, 'ube-kinampay-polvoron' AS slug, 'Melt-in-your-mouth polvoron made with Bohol''s prized Kinampay purple yam.' AS description, 'bohol' AS location_slug, 'delicacies' AS category_slug, 140.00 AS price, 65 AS quantity_in_stock
  UNION ALL
  SELECT 'Tinapay Crisp' AS name, 'tinapay-crisp' AS slug, 'Twice-baked crunchy bread crisps, a satisfying snack from Bohol.' AS description, 'bohol' AS location_slug, 'delicacies' AS category_slug, 95.00 AS price, 80 AS quantity_in_stock
  UNION ALL
  SELECT 'Dalareich Chocolates' AS name, 'dalareich-chocolates' AS slug, 'Artisanal Philippine cacao chocolates crafted by Dalareich in Bohol.' AS description, 'bohol' AS location_slug, 'delicacies' AS category_slug, 220.00 AS price, 45 AS quantity_in_stock
  UNION ALL
  SELECT 'Calamay Bun' AS name, 'calamay-bun' AS slug, 'Soft bread rolls filled with sweet calamay coconut-rice filling.' AS description, 'bohol' AS location_slug, 'delicacies' AS category_slug, 130.00 AS price, 35 AS quantity_in_stock
  UNION ALL
  SELECT 'Hillcolate' AS name, 'hillcolate' AS slug, 'Rich tablea-based chocolate drink mix made from locally sourced Bohol cacao.' AS description, 'bohol' AS location_slug, 'delicacies' AS category_slug, 185.00 AS price, 55 AS quantity_in_stock
  UNION ALL
  SELECT 'Biscocho' AS name, 'biscocho' AS slug, 'Crispy twice-baked bread slices brushed with butter and sugar, a Visayan classic.' AS description, 'boracay' AS location_slug, 'delicacies' AS category_slug, 105.00 AS price, 90 AS quantity_in_stock
  UNION ALL
  SELECT 'Calamansi Muffin' AS name, 'calamansi-muffin' AS slug, 'Zesty calamansi-infused muffins baked fresh, a Boracay resort favorite.' AS description, 'boracay' AS location_slug, 'delicacies' AS category_slug, 150.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Butterscotch' AS name, 'butterscotch' AS slug, 'Sweet and buttery butterscotch candy squares, a popular island treat.' AS description, 'boracay' AS location_slug, 'delicacies' AS category_slug, 115.00 AS price, 80 AS quantity_in_stock
  UNION ALL
  SELECT 'Banana Chips' AS name, 'banana-chips' AS slug, 'Thin crispy banana chips fried to golden perfection, lightly salted or sweetened.' AS description, 'boracay' AS location_slug, 'delicacies' AS category_slug, 90.00 AS price, 110 AS quantity_in_stock
  UNION ALL
  SELECT 'Otap' AS name, 'otap' AS slug, 'Flaky oval-shaped puff pastry dusted with sugar, a beloved Visayan biscuit.' AS description, 'boracay' AS location_slug, 'delicacies' AS category_slug, 100.00 AS price, 85 AS quantity_in_stock
  UNION ALL
  SELECT 'Barquillos' AS name, 'barquillos' AS slug, 'Thin rolled wafer tubes with a crispy texture, a light and addictive snack.' AS description, 'boracay' AS location_slug, 'delicacies' AS category_slug, 95.00 AS price, 75 AS quantity_in_stock
  UNION ALL
  SELECT 'Kalamansi Marmalade' AS name, 'kalamansi-marmalade' AS slug, 'Tangy and sweet kalamansi marmalade made from local citrus.' AS description, 'boracay' AS location_slug, 'delicacies' AS category_slug, 165.00 AS price, 50 AS quantity_in_stock
  UNION ALL
  SELECT 'Fish Cracker' AS name, 'fish-cracker' AS slug, 'Crispy fish crackers made from fresh island catch.' AS description, 'boracay' AS location_slug, 'delicacies' AS category_slug, 85.00 AS price, 95 AS quantity_in_stock
  UNION ALL
  SELECT 'Burnay Art Prints' AS name, 'burnay-art-prints' AS slug, 'Artistic prints featuring traditional Vigan Burnay pottery designs.' AS description, 'vigan' AS location_slug, 'decorations' AS category_slug, 380.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Vigan Streetscape Art' AS name, 'vigan-streetscape-art' AS slug, 'Beautiful artwork depicting historic Vigan street scenes.' AS description, 'vigan' AS location_slug, 'decorations' AS category_slug, 450.00 AS price, 15 AS quantity_in_stock
  UNION ALL
  SELECT 'Inabel Placemats' AS name, 'inabel-placemats' AS slug, 'Traditional Ilocano woven placemats with colorful patterns.' AS description, 'vigan' AS location_slug, 'decorations' AS category_slug, 320.00 AS price, 35 AS quantity_in_stock
  UNION ALL
  SELECT 'Miniature Kalesa Model' AS name, 'miniature-kalesa-model' AS slug, 'Detailed miniature model of the traditional horse-drawn carriage.' AS description, 'vigan' AS location_slug, 'decorations' AS category_slug, 580.00 AS price, 22 AS quantity_in_stock
  UNION ALL
  SELECT 'Decorative Vases' AS name, 'decorative-vases' AS slug, 'Hand-painted decorative vases in traditional Vigan style.' AS description, 'vigan' AS location_slug, 'decorations' AS category_slug, 620.00 AS price, 18 AS quantity_in_stock
  UNION ALL
  SELECT 'Ancestral House Figurine' AS name, 'ancestral-house-figurine' AS slug, 'Miniature figurine of traditional Vigan ancestral house.' AS description, 'vigan' AS location_slug, 'decorations' AS category_slug, 490.00 AS price, 25 AS quantity_in_stock
  UNION ALL
  SELECT 'Clay Sculpture' AS name, 'clay-sculpture' AS slug, 'Handcrafted clay sculpture by Vigan artisans.' AS description, 'vigan' AS location_slug, 'decorations' AS category_slug, 750.00 AS price, 10 AS quantity_in_stock
  UNION ALL
  SELECT 'Milling Stone Decor' AS name, 'milling-stone-decor' AS slug, 'Decorative replica of traditional stone mill.' AS description, 'vigan' AS location_slug, 'decorations' AS category_slug, 520.00 AS price, 12 AS quantity_in_stock
  UNION ALL
  SELECT 'Ifugao Rice Guardian' AS name, 'ifugao-rice-guardian' AS slug, 'Traditional Ifugao carved rice guardian figure.' AS description, 'baguio' AS location_slug, 'decorations' AS category_slug, 890.00 AS price, 15 AS quantity_in_stock
  UNION ALL
  SELECT 'Igorot Tribal Wood Carving' AS name, 'igorot-tribal-wood-carving' AS slug, 'Authentic tribal wood carving by Igorot artisans.' AS description, 'baguio' AS location_slug, 'decorations' AS category_slug, 1200.00 AS price, 12 AS quantity_in_stock
  UNION ALL
  SELECT 'Woven Textile Wall Art' AS name, 'woven-textile-wall-art' AS slug, 'Colorful woven textile art piece for wall display.' AS description, 'baguio' AS location_slug, 'decorations' AS category_slug, 780.00 AS price, 18 AS quantity_in_stock
  UNION ALL
  SELECT 'Giant Wooden Spoon and Fork Wall Decor' AS name, 'giant-wooden-spoon-and-fork-wall-decor' AS slug, 'Oversized wooden utensils for rustic wall decoration.' AS description, 'baguio' AS location_slug, 'decorations' AS category_slug, 650.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Ifugao Tribal Mask' AS name, 'ifugao-tribal-mask' AS slug, 'Hand-carved traditional Ifugao tribal mask.' AS description, 'baguio' AS location_slug, 'decorations' AS category_slug, 1450.00 AS price, 8 AS quantity_in_stock
  UNION ALL
  SELECT 'Barrel Man' AS name, 'barrel-man' AS slug, 'Iconic Baguio novelty wooden barrel man figurine.' AS description, 'baguio' AS location_slug, 'decorations' AS category_slug, 185.00 AS price, 60 AS quantity_in_stock
  UNION ALL
  SELECT 'Tribal Bust' AS name, 'tribal-bust' AS slug, 'Carved wooden bust depicting traditional tribal figure.' AS description, 'baguio' AS location_slug, 'decorations' AS category_slug, 980.00 AS price, 10 AS quantity_in_stock
  UNION ALL
  SELECT 'Animal Wood Carving' AS name, 'animal-wood-carving' AS slug, 'Hand-carved wooden animal figurines.' AS description, 'baguio' AS location_slug, 'decorations' AS category_slug, 320.00 AS price, 35 AS quantity_in_stock
  UNION ALL
  SELECT 'Ilog Maria Beeswax Candle' AS name, 'ilog-maria-beeswax-candle' AS slug, 'Natural beeswax candles from Ilog Maria monastery.' AS description, 'tagaytay' AS location_slug, 'decorations' AS category_slug, 280.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Taal Lake Wall Painting' AS name, 'taal-lake-wall-painting' AS slug, 'Beautiful painting featuring scenic Taal Lake views.' AS description, 'tagaytay' AS location_slug, 'decorations' AS category_slug, 1800.00 AS price, 10 AS quantity_in_stock
  UNION ALL
  SELECT 'Small Potted Plants' AS name, 'small-potted-plants' AS slug, 'Assorted small potted plants perfect for home decor.' AS description, 'tagaytay' AS location_slug, 'decorations' AS category_slug, 145.00 AS price, 50 AS quantity_in_stock
  UNION ALL
  SELECT 'Tagaytay Postcard' AS name, 'tagaytay-postcard' AS slug, 'Collectible postcards featuring Tagaytay landmarks.' AS description, 'tagaytay' AS location_slug, 'decorations' AS category_slug, 75.00 AS price, 120 AS quantity_in_stock
  UNION ALL
  SELECT 'Tagaytay Mini Figurines' AS name, 'tagaytay-mini-figurines' AS slug, 'Miniature figurines of Tagaytay attractions.' AS description, 'tagaytay' AS location_slug, 'decorations' AS category_slug, 190.00 AS price, 45 AS quantity_in_stock
  UNION ALL
  SELECT 'Dreamcatcher Wall Display' AS name, 'dreamcatcher-wall-display' AS slug, 'Large decorative dreamcatcher for wall mounting.' AS description, 'tagaytay' AS location_slug, 'decorations' AS category_slug, 480.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Cellphone Holder' AS name, 'cellphone-holder' AS slug, 'Handcrafted wooden cellphone holder.' AS description, 'tagaytay' AS location_slug, 'decorations' AS category_slug, 165.00 AS price, 55 AS quantity_in_stock
  UNION ALL
  SELECT 'Pen Holder' AS name, 'pen-holder' AS slug, 'Decorative wooden pen and pencil holder.' AS description, 'tagaytay' AS location_slug, 'decorations' AS category_slug, 140.00 AS price, 60 AS quantity_in_stock
  UNION ALL
  SELECT 'Antequera Baskets' AS name, 'antequera-baskets-decor' AS slug, 'Decorative woven baskets from Antequera, Bohol.' AS description, 'bohol' AS location_slug, 'decorations' AS category_slug, 350.00 AS price, 35 AS quantity_in_stock
  UNION ALL
  SELECT 'Table Runners' AS name, 'table-runners' AS slug, 'Hand-woven table runners with traditional patterns.' AS description, 'bohol' AS location_slug, 'decorations' AS category_slug, 280.00 AS price, 28 AS quantity_in_stock
  UNION ALL
  SELECT 'Bohol Shell Decor' AS name, 'bohol-shell-decor' AS slug, 'Decorative shell arrangements from Bohol shores.' AS description, 'bohol' AS location_slug, 'decorations' AS category_slug, 195.00 AS price, 45 AS quantity_in_stock
  UNION ALL
  SELECT 'Coconut Bowls with Mother of Pearl' AS name, 'coconut-bowls-with-mother-of-pearl' AS slug, 'Polished coconut bowls inlaid with mother of pearl.' AS description, 'bohol' AS location_slug, 'decorations' AS category_slug, 420.00 AS price, 30 AS quantity_in_stock
  UNION ALL
  SELECT 'Tarsier Wood Carving' AS name, 'tarsier-wood-carving' AS slug, 'Hand-carved wooden tarsier figurine.' AS description, 'bohol' AS location_slug, 'decorations' AS category_slug, 380.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Asin Tibuok' AS name, 'asin-tibuok' AS slug, 'Traditional Bohol sea salt formed in coconut husks.' AS description, 'bohol' AS location_slug, 'decorations' AS category_slug, 650.00 AS price, 15 AS quantity_in_stock
  UNION ALL
  SELECT 'Buri Lampshade' AS name, 'buri-lampshade' AS slug, 'Handwoven buri palm lampshade.' AS description, 'bohol' AS location_slug, 'decorations' AS category_slug, 780.00 AS price, 18 AS quantity_in_stock
  UNION ALL
  SELECT 'Capiz Shell Window' AS name, 'capiz-shell-window' AS slug, 'Traditional window panel made from capiz shells.' AS description, 'bohol' AS location_slug, 'decorations' AS category_slug, 1200.00 AS price, 8 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Sand Bottles' AS name, 'boracay-sand-bottles' AS slug, 'Decorative bottles filled with layered Boracay sand.' AS description, 'boracay' AS location_slug, 'decorations' AS category_slug, 125.00 AS price, 80 AS quantity_in_stock
  UNION ALL
  SELECT 'Abaca Placemats' AS name, 'abaca-placemats' AS slug, 'Natural abaca fiber placemats.' AS description, 'boracay' AS location_slug, 'decorations' AS category_slug, 220.00 AS price, 50 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Painting' AS name, 'boracay-painting' AS slug, 'Artistic painting of Boracay beach scenes.' AS description, 'boracay' AS location_slug, 'decorations' AS category_slug, 1500.00 AS price, 12 AS quantity_in_stock
  UNION ALL
  SELECT 'Miniature Boat Models' AS name, 'miniature-boat-models' AS slug, 'Detailed miniature models of traditional boats.' AS description, 'boracay' AS location_slug, 'decorations' AS category_slug, 560.00 AS price, 25 AS quantity_in_stock
  UNION ALL
  SELECT 'Boracay Lanterns' AS name, 'boracay-lanterns' AS slug, 'Decorative lanterns with beach-themed designs.' AS description, 'boracay' AS location_slug, 'decorations' AS category_slug, 390.00 AS price, 30 AS quantity_in_stock
  UNION ALL
  SELECT 'Shell Chimes' AS name, 'shell-chimes' AS slug, 'Wind chimes made from natural seashells.' AS description, 'boracay' AS location_slug, 'decorations' AS category_slug, 185.00 AS price, 55 AS quantity_in_stock
  UNION ALL
  SELECT 'Stone Figurines' AS name, 'stone-figurines' AS slug, 'Hand-carved stone figurines.' AS description, 'boracay' AS location_slug, 'decorations' AS category_slug, 260.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Wooden Plate Decor' AS name, 'wooden-plate-decor' AS slug, 'Decorative wooden plates with painted designs.' AS description, 'boracay' AS location_slug, 'decorations' AS category_slug, 340.00 AS price, 22 AS quantity_in_stock
  UNION ALL
  SELECT 'Burnay Pottery Set' AS name, 'burnay-pottery-set' AS slug, 'Complete set of traditional Burnay pottery for home use.' AS description, 'vigan' AS location_slug, 'homeware' AS category_slug, 850.00 AS price, 15 AS quantity_in_stock
  UNION ALL
  SELECT 'Wooden Furnitures' AS name, 'wooden-furnitures' AS slug, 'Handcrafted wooden furniture pieces in traditional Ilocano style.' AS description, 'vigan' AS location_slug, 'homeware' AS category_slug, 2500.00 AS price, 8 AS quantity_in_stock
  UNION ALL
  SELECT 'Buri Baskets and Storage' AS name, 'buri-baskets-and-storage' AS slug, 'Versatile storage baskets woven from buri palm.' AS description, 'vigan' AS location_slug, 'homeware' AS category_slug, 380.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Inabel Cloth' AS name, 'inabel-cloth' AS slug, 'Traditional handwoven Inabel fabric.' AS description, 'vigan' AS location_slug, 'homeware' AS category_slug, 550.00 AS price, 25 AS quantity_in_stock
  UNION ALL
  SELECT 'Shell Lamp' AS name, 'shell-lamp' AS slug, 'Decorative lamp adorned with natural shells.' AS description, 'vigan' AS location_slug, 'homeware' AS category_slug, 980.00 AS price, 12 AS quantity_in_stock
  UNION ALL
  SELECT 'Wood Carved Wall Decor' AS name, 'wood-carved-wall-decor' AS slug, 'Intricate hand-carved wooden wall decoration.' AS description, 'vigan' AS location_slug, 'homeware' AS category_slug, 1200.00 AS price, 10 AS quantity_in_stock
  UNION ALL
  SELECT 'Bamboo Rattan Furnitures' AS name, 'bamboo-rattan-furnitures' AS slug, 'Sturdy furniture made from bamboo and rattan.' AS description, 'vigan' AS location_slug, 'homeware' AS category_slug, 3200.00 AS price, 6 AS quantity_in_stock
  UNION ALL
  SELECT 'Bulatlat Pottery Set' AS name, 'bulatlat-pottery-set' AS slug, 'Set of traditional Bulatlat pottery jars.' AS description, 'vigan' AS location_slug, 'homeware' AS category_slug, 720.00 AS price, 14 AS quantity_in_stock
  UNION ALL
  SELECT 'Ifugao Wooden Statue' AS name, 'ifugao-wooden-statue' AS slug, 'Large carved wooden statue in Ifugao tradition.' AS description, 'baguio' AS location_slug, 'homeware' AS category_slug, 1500.00 AS price, 10 AS quantity_in_stock
  UNION ALL
  SELECT 'Wooden Tableware' AS name, 'wooden-tableware' AS slug, 'Handcrafted wooden plates, bowls, and utensils.' AS description, 'baguio' AS location_slug, 'homeware' AS category_slug, 680.00 AS price, 22 AS quantity_in_stock
  UNION ALL
  SELECT 'Terracotta Planters' AS name, 'terracotta-planters' AS slug, 'Traditional terracotta plant pots.' AS description, 'baguio' AS location_slug, 'homeware' AS category_slug, 290.00 AS price, 35 AS quantity_in_stock
  UNION ALL
  SELECT 'Igorot Handwoven Blankets' AS name, 'igorot-handwoven-blankets' AS slug, 'Warm handwoven blankets with tribal patterns.' AS description, 'baguio' AS location_slug, 'homeware' AS category_slug, 1100.00 AS price, 15 AS quantity_in_stock
  UNION ALL
  SELECT 'Handwoven Foot Rugs' AS name, 'handwoven-foot-rugs' AS slug, 'Durable handwoven rugs for home use.' AS description, 'baguio' AS location_slug, 'homeware' AS category_slug, 450.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Bamboo Lantern' AS name, 'bamboo-lantern' AS slug, 'Traditional bamboo lantern for ambient lighting.' AS description, 'baguio' AS location_slug, 'homeware' AS category_slug, 380.00 AS price, 28 AS quantity_in_stock
  UNION ALL
  SELECT 'Mug' AS name, 'mug-baguio' AS slug, 'Ceramic mug with Baguio designs.' AS description, 'baguio' AS location_slug, 'homeware' AS category_slug, 195.00 AS price, 60 AS quantity_in_stock
  UNION ALL
  SELECT 'Wall Photo' AS name, 'wall-photo' AS slug, 'Framed photographs of Baguio scenery.' AS description, 'baguio' AS location_slug, 'homeware' AS category_slug, 420.00 AS price, 18 AS quantity_in_stock
  UNION ALL
  SELECT 'Mahogany Bowl' AS name, 'mahogany-bowl' AS slug, 'Hand-turned mahogany wood serving bowl.' AS description, 'tagaytay' AS location_slug, 'homeware' AS category_slug, 580.00 AS price, 18 AS quantity_in_stock
  UNION ALL
  SELECT 'Abaca Basket' AS name, 'abaca-basket' AS slug, 'Large storage basket woven from abaca fiber.' AS description, 'tagaytay' AS location_slug, 'homeware' AS category_slug, 320.00 AS price, 32 AS quantity_in_stock
  UNION ALL
  SELECT 'Tagaytay Terracotta Planters' AS name, 'tagaytay-terracotta-planters' AS slug, 'Rustic terracotta planters for indoor plants.' AS description, 'tagaytay' AS location_slug, 'homeware' AS category_slug, 265.00 AS price, 28 AS quantity_in_stock
  UNION ALL
  SELECT 'Tagaytay Candle' AS name, 'tagaytay-candle' AS slug, 'Scented candles with natural local fragrances.' AS description, 'tagaytay' AS location_slug, 'homeware' AS category_slug, 245.00 AS price, 50 AS quantity_in_stock
  UNION ALL
  SELECT 'Wood Clock' AS name, 'wood-clock' AS slug, 'Wall clock made from polished wood.' AS description, 'tagaytay' AS location_slug, 'homeware' AS category_slug, 680.00 AS price, 15 AS quantity_in_stock
  UNION ALL
  SELECT 'Embroidered Linens' AS name, 'embroidered-linens' AS slug, 'Hand-embroidered table linens and napkins.' AS description, 'tagaytay' AS location_slug, 'homeware' AS category_slug, 490.00 AS price, 22 AS quantity_in_stock
  UNION ALL
  SELECT 'Wood Chimes' AS name, 'wood-chimes' AS slug, 'Melodious wind chimes made from bamboo.' AS description, 'tagaytay' AS location_slug, 'homeware' AS category_slug, 220.00 AS price, 38 AS quantity_in_stock
  UNION ALL
  SELECT 'Concrete Planters' AS name, 'concrete-planters' AS slug, 'Modern concrete planters for succulents.' AS description, 'tagaytay' AS location_slug, 'homeware' AS category_slug, 350.00 AS price, 25 AS quantity_in_stock
  UNION ALL
  SELECT 'Bohol Coconut Bowl' AS name, 'bohol-coconut-bowl' AS slug, 'Polished coconut shell bowl for serving.' AS description, 'bohol' AS location_slug, 'homeware' AS category_slug, 195.00 AS price, 55 AS quantity_in_stock
  UNION ALL
  SELECT 'Seashell Chime' AS name, 'seashell-chime' AS slug, 'Musical wind chime made from seashells.' AS description, 'bohol' AS location_slug, 'homeware' AS category_slug, 185.00 AS price, 45 AS quantity_in_stock
  UNION ALL
  SELECT 'Tubigon Weave' AS name, 'tubigon-weave' AS slug, 'Traditional woven textile from Tubigon.' AS description, 'bohol' AS location_slug, 'homeware' AS category_slug, 420.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Wooden Kitchenware' AS name, 'wooden-kitchenware-bohol' AS slug, 'Set of wooden spoons and cooking utensils.' AS description, 'bohol' AS location_slug, 'homeware' AS category_slug, 280.00 AS price, 38 AS quantity_in_stock
  UNION ALL
  SELECT 'Antequera Baskets' AS name, 'antequera-baskets-homeware' AS slug, 'Functional storage baskets from Antequera.' AS description, 'bohol' AS location_slug, 'homeware' AS category_slug, 450.00 AS price, 22 AS quantity_in_stock
  UNION ALL
  SELECT 'Woven Nito Vine Accessories' AS name, 'woven-nito-vine-accessories' AS slug, 'Home accessories woven from nito vine.' AS description, 'bohol' AS location_slug, 'homeware' AS category_slug, 380.00 AS price, 18 AS quantity_in_stock
  UNION ALL
  SELECT 'Bohol Bamboo Furniture' AS name, 'bohol-bamboo-furniture' AS slug, 'Sustainable bamboo furniture pieces.' AS description, 'bohol' AS location_slug, 'homeware' AS category_slug, 3500.00 AS price, 5 AS quantity_in_stock
  UNION ALL
  SELECT 'Woven Buri Window Blinds' AS name, 'woven-buri-window-blinds' AS slug, 'Natural window blinds woven from buri.' AS description, 'bohol' AS location_slug, 'homeware' AS category_slug, 1100.00 AS price, 10 AS quantity_in_stock
  UNION ALL
  SELECT 'Shell Decor' AS name, 'shell-decor' AS slug, 'Decorative shell arrangements for home.' AS description, 'boracay' AS location_slug, 'homeware' AS category_slug, 180.00 AS price, 60 AS quantity_in_stock
  UNION ALL
  SELECT 'Puka Shell Chandeliers' AS name, 'puka-shell-chandeliers' AS slug, 'Elegant chandelier made from puka shells.' AS description, 'boracay' AS location_slug, 'homeware' AS category_slug, 2800.00 AS price, 8 AS quantity_in_stock
  UNION ALL
  SELECT 'Driftwood Centerpiece Bowls' AS name, 'driftwood-centerpiece-bowls' AS slug, 'Unique bowls carved from driftwood.' AS description, 'boracay' AS location_slug, 'homeware' AS category_slug, 650.00 AS price, 15 AS quantity_in_stock
  UNION ALL
  SELECT 'Pandanus (Bariw) Floor Mats' AS name, 'pandanus-bariw-floor-mats' AS slug, 'Natural floor mats woven from pandanus.' AS description, 'boracay' AS location_slug, 'homeware' AS category_slug, 480.00 AS price, 20 AS quantity_in_stock
  UNION ALL
  SELECT 'Aqua de Boracay Home Fragrance' AS name, 'aqua-de-boracay-home-fragrance' AS slug, 'Ocean-inspired home fragrance spray.' AS description, 'boracay' AS location_slug, 'homeware' AS category_slug, 320.00 AS price, 40 AS quantity_in_stock
  UNION ALL
  SELECT 'Coconut Shell Soy Candles' AS name, 'coconut-shell-soy-candles' AS slug, 'Eco-friendly soy candles in coconut shells.' AS description, 'boracay' AS location_slug, 'homeware' AS category_slug, 285.00 AS price, 50 AS quantity_in_stock
  UNION ALL
  SELECT 'Kamagong Utensils' AS name, 'kamagong-utensils' AS slug, 'Premium utensils carved from kamagong wood.' AS description, 'boracay' AS location_slug, 'homeware' AS category_slug, 850.00 AS price, 12 AS quantity_in_stock
  UNION ALL
  SELECT 'Tsokolatera & Batirol' AS name, 'tsokolatera-batirol' AS slug, 'Traditional chocolate making set with wooden whisk.' AS description, 'boracay' AS location_slug, 'homeware' AS category_slug, 620.00 AS price, 18 AS quantity_in_stock
) p
JOIN locations l ON l.slug = p.location_slug
JOIN categories c ON c.slug = p.category_slug
JOIN admins a ON a.email = 'admin@soucul.com'
;


-- ── 9. SEED: TEST USERS ──────────────────────────────────────────────────
-- Converted from backend/seed.php users array
-- Default password for these users: password123
INSERT IGNORE INTO users (email, password_hash, first_name, last_name, phone, is_active)
VALUES
  ('john.doe@example.com', '$2y$12$8XbEj2U49MvGKUY7SUr2nedGBpDZu6kUL9xsPF2xPW28Xyzr.SKBO', 'John', 'Doe', '+63-912-345-6789', 1),
  ('jane.smith@example.com', '$2y$12$8XbEj2U49MvGKUY7SUr2nedGBpDZu6kUL9xsPF2xPW28Xyzr.SKBO', 'Jane', 'Smith', '+63-923-456-7890', 1),
  ('bob.wilson@example.com', '$2y$12$8XbEj2U49MvGKUY7SUr2nedGBpDZu6kUL9xsPF2xPW28Xyzr.SKBO', 'Bob', 'Wilson', '+63-934-567-8901', 1)
;
-- ── 10. NOTIFICATIONS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_notifications (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  type       VARCHAR(50) NOT NULL DEFAULT 'general',
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  meta_json  JSON DEFAULT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  read_at    TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_customer_notif_user_created (user_id, created_at),
  INDEX idx_customer_notif_user_read (user_id, is_read)
);

CREATE TABLE IF NOT EXISTS admin_notifications (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id   INT NOT NULL,
  type       VARCHAR(50) NOT NULL DEFAULT 'general',
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  meta_json  JSON DEFAULT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  read_at    TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_admin_notif_admin_created (admin_id, created_at),
  INDEX idx_admin_notif_admin_read (admin_id, is_read)
);

CREATE TABLE IF NOT EXISTS customer_notification_settings (
  user_id          INT PRIMARY KEY,
  order_updates    TINYINT(1) NOT NULL DEFAULT 1,
  promotions       TINYINT(1) NOT NULL DEFAULT 1,
  wishlist_alerts  TINYINT(1) NOT NULL DEFAULT 0,
  newsletter       TINYINT(1) NOT NULL DEFAULT 0,
  sms_notifications TINYINT(1) NOT NULL DEFAULT 1,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── 11. CUSTOMER PROFILE + ACCOUNT DATA ────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birthday DATE NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(30) NULL AFTER birthday;

CREATE TABLE IF NOT EXISTS customer_addresses (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  label         VARCHAR(50) NOT NULL DEFAULT 'Home',
  address_line  VARCHAR(500) NOT NULL,
  city          VARCHAR(120) NOT NULL,
  province      VARCHAR(120) NOT NULL,
  postal_code   VARCHAR(20) DEFAULT NULL,
  phone         VARCHAR(20) DEFAULT NULL,
  is_default    TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_customer_addresses_user (user_id),
  INDEX idx_customer_addresses_default (user_id, is_default)
);

CREATE TABLE IF NOT EXISTS customer_wishlist (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_customer_wishlist (user_id, product_id),
  INDEX idx_customer_wishlist_user_created (user_id, created_at)
);
