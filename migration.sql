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

ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'cash_on_delivery_requested',
    'online_payment_requested',
    'cash_on_delivery_approved',
    'online_payment_processed',
    'waiting_for_courier',
    'shipped',
    'to_be_delivered',
    'delivered',
    'cancelled',
    'pending',
    'confirmed',
    'processing'
  ) NOT NULL DEFAULT 'cash_on_delivery_requested';

-- ── 3.1 PRODUCTS — add featured flag for homepage highlights ───────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0
  AFTER featured_image_url;

ALTER TABLE products
  ADD INDEX IF NOT EXISTS idx_products_featured_active (is_featured, is_active);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS material VARCHAR(120) NOT NULL DEFAULT 'Locally sourced'
  AFTER description;

UPDATE products
SET material = 'Locally sourced'
WHERE material IS NULL OR TRIM(material) = '';

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
  name, slug, description, location_id, category_id, admin_id, price, size_tier, quantity_in_stock, is_active
)
SELECT
  p.name,
  p.slug,
  p.description,
  l.id AS location_id,
  c.id AS category_id,
  a.id AS admin_id,
  p.price, p.size_tier,
  p.quantity_in_stock,
  1 AS is_active
FROM (

-- ═══════════════════════════════════════════════════
-- HANDICRAFTS — VIGAN
-- ═══════════════════════════════════════════════════
  SELECT 'Burnay Pottery' AS name, 'burnay-pottery-small' AS slug, 'Traditional hand-thrown Burnay earthenware pot from Vigan, small size.' AS description, 'vigan' AS location_slug, 'handicrafts' AS category_slug, 165.00 AS price, 'small' AS size_tier, 30 AS quantity_in_stock, 1 AS is_active
  UNION ALL SELECT 'Burnay Pottery', 'burnay-pottery-medium', 'Traditional hand-thrown Burnay earthenware pot from Vigan, medium size.', 'vigan', 'handicrafts', 450.00, 'medium', 30, 1
  UNION ALL SELECT 'Burnay Pottery', 'burnay-pottery-large', 'Traditional hand-thrown Burnay earthenware pot from Vigan, large size.', 'vigan', 'handicrafts', 800.00, 'large', 20, 1
  UNION ALL SELECT 'Burnay Pottery', 'burnay-pottery-special', 'Traditional hand-thrown Burnay earthenware pot from Vigan, special quality.', 'vigan', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Handwoven Baskets', 'handwoven-baskets-vigan-small', 'Sturdy rattan baskets handwoven by local Ilocano artisans, small size.', 'vigan', 'handicrafts', 175.00, 'small', 50, 1
  UNION ALL SELECT 'Handwoven Baskets', 'handwoven-baskets-vigan-medium', 'Sturdy rattan baskets handwoven by local Ilocano artisans, medium size.', 'vigan', 'handicrafts', 425.00, 'medium', 50, 1
  UNION ALL SELECT 'Handwoven Baskets', 'handwoven-baskets-vigan-large', 'Sturdy rattan baskets handwoven by local Ilocano artisans, large size.', 'vigan', 'handicrafts', 900.00, 'large', 30, 1
  UNION ALL SELECT 'Handwoven Baskets', 'handwoven-baskets-vigan-special', 'Sturdy rattan baskets handwoven by local Ilocano artisans, premium quality.', 'vigan', 'handicrafts', 1000.00, 'special', 20, 1
 
  UNION ALL SELECT 'Damili Pottery', 'damili-pottery-small', 'Elegant Damili-style clay pottery unique to Vigan, small size.', 'vigan', 'handicrafts', 125.00, 'small', 25, 1
  UNION ALL SELECT 'Damili Pottery', 'damili-pottery-medium', 'Elegant Damili-style clay pottery unique to Vigan, medium size.', 'vigan', 'handicrafts', 350.00, 'medium', 25, 1
  UNION ALL SELECT 'Damili Pottery', 'damili-pottery-large', 'Elegant Damili-style clay pottery unique to Vigan, large size.', 'vigan', 'handicrafts', 750.00, 'large', 15, 1
  UNION ALL SELECT 'Damili Pottery', 'damili-pottery-special', 'Elegant Damili-style clay pottery unique to Vigan, special quality.', 'vigan', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Vigan Wallets', 'vigan-wallets-small', 'Hand-stitched leather wallets crafted by Vigan artisans, small size.', 'vigan', 'handicrafts', 100.00, 'small', 60, 1
  UNION ALL SELECT 'Vigan Wallets', 'vigan-wallets-medium', 'Hand-stitched leather wallets crafted by Vigan artisans, medium size.', 'vigan', 'handicrafts', 275.00, 'medium', 60, 1
  UNION ALL SELECT 'Vigan Wallets', 'vigan-wallets-large', 'Hand-stitched leather wallets crafted by Vigan artisans, large size.', 'vigan', 'handicrafts', 600.00, 'large', 40, 1
  UNION ALL SELECT 'Vigan Wallets', 'vigan-wallets-special', 'Hand-stitched leather wallets crafted by Vigan artisans, premium quality.', 'vigan', 'handicrafts', 500.00, 'special', 20, 1
 
  UNION ALL SELECT 'Buri Bags', 'buri-bags-small', 'Lightweight eco-friendly bags woven from Buri palm, small size.', 'vigan', 'handicrafts', 80.00, 'small', 50, 1
  UNION ALL SELECT 'Buri Bags', 'buri-bags-medium', 'Lightweight eco-friendly bags woven from Buri palm, medium size.', 'vigan', 'handicrafts', 275.00, 'medium', 50, 1
  UNION ALL SELECT 'Buri Bags', 'buri-bags-large', 'Lightweight eco-friendly bags woven from Buri palm, large size.', 'vigan', 'handicrafts', 550.00, 'large', 35, 1
  UNION ALL SELECT 'Buri Bags', 'buri-bags-special', 'Lightweight eco-friendly bags woven from Buri palm, premium quality.', 'vigan', 'handicrafts', 1150.00, 'special', 20, 1
 
  UNION ALL SELECT 'Wood Coasters', 'wood-coasters-small', 'Hand-carved wooden coasters with traditional Ilocano designs, small size.', 'vigan', 'handicrafts', 70.00, 'small', 80, 1
  UNION ALL SELECT 'Wood Coasters', 'wood-coasters-medium', 'Hand-carved wooden coasters with traditional Ilocano designs, medium size.', 'vigan', 'handicrafts', 140.00, 'medium', 80, 1
  UNION ALL SELECT 'Wood Coasters', 'wood-coasters-large', 'Hand-carved wooden coasters with traditional Ilocano designs, large size.', 'vigan', 'handicrafts', 225.00, 'large', 60, 1
  UNION ALL SELECT 'Wood Coasters', 'wood-coasters-special', 'Hand-carved wooden coasters with traditional Ilocano designs, premium quality.', 'vigan', 'handicrafts', 900.00, 'special', 20, 1
 
  UNION ALL SELECT 'Labba', 'labba-small', 'Traditional Ilocano woven blanket, the Labba, small size.', 'vigan', 'handicrafts', 225.00, 'small', 20, 1
  UNION ALL SELECT 'Labba', 'labba-medium', 'Traditional Ilocano woven blanket, the Labba, medium size.', 'vigan', 'handicrafts', 500.00, 'medium', 20, 1
  UNION ALL SELECT 'Labba', 'labba-large', 'Traditional Ilocano woven blanket, the Labba, large size.', 'vigan', 'handicrafts', 1100.00, 'large', 15, 1
  UNION ALL SELECT 'Labba', 'labba-special', 'Traditional Ilocano woven blanket, the Labba, special quality.', 'vigan', 'handicrafts', 0.00, 'special', 0, 0
 
-- ═══════════════════════════════════════════════════
-- HANDICRAFTS — BAGUIO
-- ═══════════════════════════════════════════════════
  UNION ALL SELECT 'Baguio Keychains', 'baguio-keychains-small', 'Colorful handcrafted keychains featuring Baguio landmarks, small size.', 'baguio', 'handicrafts', 30.00, 'small', 120, 1
  UNION ALL SELECT 'Baguio Keychains', 'baguio-keychains-medium', 'Colorful handcrafted keychains featuring Baguio landmarks, medium size.', 'baguio', 'handicrafts', 60.00, 'medium', 120, 1
  UNION ALL SELECT 'Baguio Keychains', 'baguio-keychains-large', 'Colorful handcrafted keychains featuring Baguio landmarks, large size.', 'baguio', 'handicrafts', 115.00, 'large', 80, 1
  UNION ALL SELECT 'Baguio Keychains', 'baguio-keychains-special', 'Colorful handcrafted keychains featuring Baguio landmarks, special quality.', 'baguio', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Handwoven Tela', 'handwoven-tela-small', 'Beautiful handwoven fabric by Cordillera weavers, small size.', 'baguio', 'handicrafts', 250.00, 'small', 35, 1
  UNION ALL SELECT 'Handwoven Tela', 'handwoven-tela-medium', 'Beautiful handwoven fabric by Cordillera weavers, medium size.', 'baguio', 'handicrafts', 650.00, 'medium', 35, 1
  UNION ALL SELECT 'Handwoven Tela', 'handwoven-tela-large', 'Beautiful handwoven fabric by Cordillera weavers, large size.', 'baguio', 'handicrafts', 1750.00, 'large', 20, 1
  UNION ALL SELECT 'Handwoven Tela', 'handwoven-tela-special', 'Beautiful handwoven fabric by Cordillera weavers, premium quality.', 'baguio', 'handicrafts', 2900.00, 'special', 10, 1
 
  UNION ALL SELECT 'Baguio Handfan', 'baguio-handfan-small', 'Handwoven rattan fan with tribal geometric patterns, small size.', 'baguio', 'handicrafts', 45.00, 'small', 55, 1
  UNION ALL SELECT 'Baguio Handfan', 'baguio-handfan-medium', 'Handwoven rattan fan with tribal geometric patterns, medium size.', 'baguio', 'handicrafts', 83.00, 'medium', 55, 1
  UNION ALL SELECT 'Baguio Handfan', 'baguio-handfan-large', 'Handwoven rattan fan with tribal geometric patterns, large size.', 'baguio', 'handicrafts', 150.00, 'large', 40, 1
  UNION ALL SELECT 'Baguio Handfan', 'baguio-handfan-special', 'Handwoven rattan fan with tribal geometric patterns, premium quality.', 'baguio', 'handicrafts', 350.00, 'special', 20, 1
 
  UNION ALL SELECT 'Refrigerator Magnet', 'refrigerator-magnet-small', 'Cute resin fridge magnet featuring iconic Baguio scenery, small size.', 'baguio', 'handicrafts', 20.00, 'small', 200, 1
  UNION ALL SELECT 'Refrigerator Magnet', 'refrigerator-magnet-medium', 'Cute resin fridge magnet featuring iconic Baguio scenery, medium size.', 'baguio', 'handicrafts', 45.00, 'medium', 200, 1
  UNION ALL SELECT 'Refrigerator Magnet', 'refrigerator-magnet-large', 'Cute resin fridge magnet featuring iconic Baguio scenery, large size.', 'baguio', 'handicrafts', 90.00, 'large', 150, 1
  UNION ALL SELECT 'Refrigerator Magnet', 'refrigerator-magnet-special', 'Cute resin fridge magnet featuring iconic Baguio scenery, premium quality.', 'baguio', 'handicrafts', 200.00, 'special', 80, 1
 
  UNION ALL SELECT 'Rattan Baskets', 'rattan-baskets-baguio-small', 'Handwoven rattan storage baskets by Cordillera artisans, small size.', 'baguio', 'handicrafts', 175.00, 'small', 40, 1
  UNION ALL SELECT 'Rattan Baskets', 'rattan-baskets-baguio-medium', 'Handwoven rattan storage baskets by Cordillera artisans, medium size.', 'baguio', 'handicrafts', 475.00, 'medium', 40, 1
  UNION ALL SELECT 'Rattan Baskets', 'rattan-baskets-baguio-large', 'Handwoven rattan storage baskets by Cordillera artisans, large size.', 'baguio', 'handicrafts', 1100.00, 'large', 25, 1
  UNION ALL SELECT 'Rattan Baskets', 'rattan-baskets-baguio-special', 'Handwoven rattan storage baskets by Cordillera artisans, premium quality.', 'baguio', 'handicrafts', 2650.00, 'special', 10, 1
 
  UNION ALL SELECT 'Sinalapid Slippers', 'sinalapid-slippers-small', 'Handmade braided slippers using Cordillera techniques, small size.', 'baguio', 'handicrafts', 83.00, 'small', 30, 1
  UNION ALL SELECT 'Sinalapid Slippers', 'sinalapid-slippers-medium', 'Handmade braided slippers using Cordillera techniques, medium size.', 'baguio', 'handicrafts', 138.00, 'medium', 30, 1
  UNION ALL SELECT 'Sinalapid Slippers', 'sinalapid-slippers-large', 'Handmade braided slippers using Cordillera techniques, large size.', 'baguio', 'handicrafts', 170.00, 'large', 25, 1
  UNION ALL SELECT 'Sinalapid Slippers', 'sinalapid-slippers-special', 'Handmade braided slippers using Cordillera techniques, special quality.', 'baguio', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Basahan Tela', 'basahan-tela-small', 'Traditional recycled cloth fabric woven into colorful mats, small size.', 'baguio', 'handicrafts', 8.00, 'small', 25, 1
  UNION ALL SELECT 'Basahan Tela', 'basahan-tela-medium', 'Traditional recycled cloth fabric woven into colorful mats, medium size.', 'baguio', 'handicrafts', 20.00, 'medium', 25, 1
  UNION ALL SELECT 'Basahan Tela', 'basahan-tela-large', 'Traditional recycled cloth fabric woven into colorful mats, large size.', 'baguio', 'handicrafts', 48.00, 'large', 20, 1
  UNION ALL SELECT 'Basahan Tela', 'basahan-tela-special', 'Traditional recycled cloth fabric woven into colorful mats, special quality.', 'baguio', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Baguio Bracelets', 'baguio-bracelets-small', 'Beaded bracelets inspired by Igorot tribal jewelry, small size.', 'baguio', 'handicrafts', 25.00, 'small', 90, 1
  UNION ALL SELECT 'Baguio Bracelets', 'baguio-bracelets-medium', 'Beaded bracelets inspired by Igorot tribal jewelry, medium size.', 'baguio', 'handicrafts', 58.00, 'medium', 90, 1
  UNION ALL SELECT 'Baguio Bracelets', 'baguio-bracelets-large', 'Beaded bracelets inspired by Igorot tribal jewelry, large size.', 'baguio', 'handicrafts', 115.00, 'large', 60, 1
  UNION ALL SELECT 'Baguio Bracelets', 'baguio-bracelets-special', 'Beaded bracelets inspired by Igorot tribal jewelry, special quality.', 'baguio', 'handicrafts', 0.00, 'special', 0, 0
 
-- ═══════════════════════════════════════════════════
-- HANDICRAFTS — TAGAYTAY
-- ═══════════════════════════════════════════════════
  UNION ALL SELECT 'Dream Catchers', 'dream-catchers-small', 'Handmade dream catchers with natural feathers and beads, small size.', 'tagaytay', 'handicrafts', 118.00, 'small', 45, 1
  UNION ALL SELECT 'Dream Catchers', 'dream-catchers-medium', 'Handmade dream catchers with natural feathers and beads, medium size.', 'tagaytay', 'handicrafts', 350.00, 'medium', 45, 1
  UNION ALL SELECT 'Dream Catchers', 'dream-catchers-large', 'Handmade dream catchers with natural feathers and beads, large size.', 'tagaytay', 'handicrafts', 850.00, 'large', 30, 1
  UNION ALL SELECT 'Dream Catchers', 'dream-catchers-special', 'Handmade dream catchers with natural feathers and beads, premium quality.', 'tagaytay', 'handicrafts', 2500.00, 'special', 10, 1
 
  UNION ALL SELECT 'I Love Tagaytay Keychain', 'i-love-tagaytay-keychain-small', 'Charming souvenir keychain with Tagaytay landmark designs, small size.', 'tagaytay', 'handicrafts', 20.00, 'small', 150, 1
  UNION ALL SELECT 'I Love Tagaytay Keychain', 'i-love-tagaytay-keychain-medium', 'Charming souvenir keychain with Tagaytay landmark designs, medium size.', 'tagaytay', 'handicrafts', 45.00, 'medium', 150, 1
  UNION ALL SELECT 'I Love Tagaytay Keychain', 'i-love-tagaytay-keychain-large', 'Charming souvenir keychain with Tagaytay landmark designs, large size.', 'tagaytay', 'handicrafts', 108.00, 'large', 100, 1
  UNION ALL SELECT 'I Love Tagaytay Keychain', 'i-love-tagaytay-keychain-special', 'Charming souvenir keychain with Tagaytay landmark designs, special quality.', 'tagaytay', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'I Love Tagaytay Coin Purse', 'i-love-tagaytay-coin-purse-small', 'Handstitched coin purse with Tagaytay-themed print, small size.', 'tagaytay', 'handicrafts', 35.00, 'small', 60, 1
  UNION ALL SELECT 'I Love Tagaytay Coin Purse', 'i-love-tagaytay-coin-purse-medium', 'Handstitched coin purse with Tagaytay-themed print, medium size.', 'tagaytay', 'handicrafts', 73.00, 'medium', 60, 1
  UNION ALL SELECT 'I Love Tagaytay Coin Purse', 'i-love-tagaytay-coin-purse-large', 'Handstitched coin purse with Tagaytay-themed print, large size.', 'tagaytay', 'handicrafts', 0.00, 'large', 0, 0
  UNION ALL SELECT 'I Love Tagaytay Coin Purse', 'i-love-tagaytay-coin-purse-special', 'Handstitched coin purse with Tagaytay-themed print, premium quality.', 'tagaytay', 'handicrafts', 475.00, 'special', 30, 1
 
  UNION ALL SELECT 'Tagaytay Ref Magnet', 'tagaytay-ref-magnet-small', 'Scenic Taal Volcano souvenir refrigerator magnet, small size.', 'tagaytay', 'handicrafts', 23.00, 'small', 180, 1
  UNION ALL SELECT 'Tagaytay Ref Magnet', 'tagaytay-ref-magnet-medium', 'Scenic Taal Volcano souvenir refrigerator magnet, medium size.', 'tagaytay', 'handicrafts', 60.00, 'medium', 180, 1
  UNION ALL SELECT 'Tagaytay Ref Magnet', 'tagaytay-ref-magnet-large', 'Scenic Taal Volcano souvenir refrigerator magnet, large size.', 'tagaytay', 'handicrafts', 130.00, 'large', 120, 1
  UNION ALL SELECT 'Tagaytay Ref Magnet', 'tagaytay-ref-magnet-special', 'Scenic Taal Volcano souvenir refrigerator magnet, special quality.', 'tagaytay', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Tagaytay Bags', 'tagaytay-bags-small', 'Woven abaca tote bags featuring Tagaytay scenery prints, small size.', 'tagaytay', 'handicrafts', 78.00, 'small', 35, 1
  UNION ALL SELECT 'Tagaytay Bags', 'tagaytay-bags-medium', 'Woven abaca tote bags featuring Tagaytay scenery prints, medium size.', 'tagaytay', 'handicrafts', 145.00, 'medium', 35, 1
  UNION ALL SELECT 'Tagaytay Bags', 'tagaytay-bags-large', 'Woven abaca tote bags featuring Tagaytay scenery prints, large size.', 'tagaytay', 'handicrafts', 275.00, 'large', 25, 1
  UNION ALL SELECT 'Tagaytay Bags', 'tagaytay-bags-special', 'Woven abaca tote bags featuring Tagaytay scenery prints, premium quality.', 'tagaytay', 'handicrafts', 1175.00, 'special', 10, 1
 
  UNION ALL SELECT 'Handwoven Baskets', 'handwoven-baskets-tagaytay-small', 'Natural fiber baskets woven by local Tagaytay craftspeople, small size.', 'tagaytay', 'handicrafts', 75.00, 'small', 40, 1
  UNION ALL SELECT 'Handwoven Baskets', 'handwoven-baskets-tagaytay-medium', 'Natural fiber baskets woven by local Tagaytay craftspeople, medium size.', 'tagaytay', 'handicrafts', 250.00, 'medium', 40, 1
  UNION ALL SELECT 'Handwoven Baskets', 'handwoven-baskets-tagaytay-large', 'Natural fiber baskets woven by local Tagaytay craftspeople, large size.', 'tagaytay', 'handicrafts', 625.00, 'large', 25, 1
  UNION ALL SELECT 'Handwoven Baskets', 'handwoven-baskets-tagaytay-special', 'Natural fiber baskets woven by local Tagaytay craftspeople, premium quality.', 'tagaytay', 'handicrafts', 2650.00, 'special', 10, 1
 
  UNION ALL SELECT 'Wooden Kitchenware', 'wooden-kitchenware-tagaytay-small', 'Handcrafted wooden spoons and ladles from Tagaytay, small size.', 'tagaytay', 'handicrafts', 200.00, 'small', 55, 1
  UNION ALL SELECT 'Wooden Kitchenware', 'wooden-kitchenware-tagaytay-medium', 'Handcrafted wooden spoons and ladles from Tagaytay, medium size.', 'tagaytay', 'handicrafts', 365.00, 'medium', 55, 1
  UNION ALL SELECT 'Wooden Kitchenware', 'wooden-kitchenware-tagaytay-large', 'Handcrafted wooden spoons and ladles from Tagaytay, large size.', 'tagaytay', 'handicrafts', 550.00, 'large', 40, 1
  UNION ALL SELECT 'Wooden Kitchenware', 'wooden-kitchenware-tagaytay-special', 'Handcrafted wooden spoons and ladles from Tagaytay, special quality.', 'tagaytay', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Coconut Shell Placemat', 'coconut-shell-placemat-small', 'Eco-friendly placemats from woven coconut shell strips, small size.', 'tagaytay', 'handicrafts', 55.00, 'small', 70, 1
  UNION ALL SELECT 'Coconut Shell Placemat', 'coconut-shell-placemat-medium', 'Eco-friendly placemats from woven coconut shell strips, medium size.', 'tagaytay', 'handicrafts', 170.00, 'medium', 70, 1
  UNION ALL SELECT 'Coconut Shell Placemat', 'coconut-shell-placemat-large', 'Eco-friendly placemats from woven coconut shell strips, large size.', 'tagaytay', 'handicrafts', 215.00, 'large', 50, 1
  UNION ALL SELECT 'Coconut Shell Placemat', 'coconut-shell-placemat-special', 'Eco-friendly placemats from woven coconut shell strips, special quality.', 'tagaytay', 'handicrafts', 0.00, 'special', 0, 0
 
-- ═══════════════════════════════════════════════════
-- HANDICRAFTS — BOHOL
-- ═══════════════════════════════════════════════════
  UNION ALL SELECT 'Handwoven Rattan Bag', 'handwoven-rattan-bag-small', 'Stylish woven rattan bag by Boholano artisans, small size.', 'bohol', 'handicrafts', 350.00, 'small', 30, 1
  UNION ALL SELECT 'Handwoven Rattan Bag', 'handwoven-rattan-bag-medium', 'Stylish woven rattan bag by Boholano artisans, medium size.', 'bohol', 'handicrafts', 725.00, 'medium', 30, 1
  UNION ALL SELECT 'Handwoven Rattan Bag', 'handwoven-rattan-bag-large', 'Stylish woven rattan bag by Boholano artisans, large size.', 'bohol', 'handicrafts', 1600.00, 'large', 20, 1
  UNION ALL SELECT 'Handwoven Rattan Bag', 'handwoven-rattan-bag-special', 'Stylish woven rattan bag by Boholano artisans, special quality.', 'bohol', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Bamboo Coin Bank', 'bamboo-coin-bank-small', 'Handmade bamboo coin bank from Bohol, small size.', 'bohol', 'handicrafts', 70.00, 'small', 65, 1
  UNION ALL SELECT 'Bamboo Coin Bank', 'bamboo-coin-bank-medium', 'Handmade bamboo coin bank from Bohol, medium size.', 'bohol', 'handicrafts', 180.00, 'medium', 65, 1
  UNION ALL SELECT 'Bamboo Coin Bank', 'bamboo-coin-bank-large', 'Handmade bamboo coin bank from Bohol, large size.', 'bohol', 'handicrafts', 375.00, 'large', 40, 1
  UNION ALL SELECT 'Bamboo Coin Bank', 'bamboo-coin-bank-special', 'Handmade bamboo coin bank from Bohol, special quality.', 'bohol', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Wooden Carved Ashtray', 'wooden-carved-ashtray-small', 'Hand-carved wooden ashtray with Bohol tarsier motif, small size.', 'bohol', 'handicrafts', 138.00, 'small', 40, 1
  UNION ALL SELECT 'Wooden Carved Ashtray', 'wooden-carved-ashtray-medium', 'Hand-carved wooden ashtray with Bohol tarsier motif, medium size.', 'bohol', 'handicrafts', 185.00, 'medium', 40, 1
  UNION ALL SELECT 'Wooden Carved Ashtray', 'wooden-carved-ashtray-large', 'Hand-carved wooden ashtray with Bohol tarsier motif, large size.', 'bohol', 'handicrafts', 335.00, 'large', 25, 1
  UNION ALL SELECT 'Wooden Carved Ashtray', 'wooden-carved-ashtray-special', 'Hand-carved wooden ashtray with Bohol tarsier motif, special quality.', 'bohol', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Round Woven Box', 'round-woven-box-small', 'Round buri-woven storage box with lid, small size.', 'bohol', 'handicrafts', 118.00, 'small', 50, 1
  UNION ALL SELECT 'Round Woven Box', 'round-woven-box-medium', 'Round buri-woven storage box with lid, medium size.', 'bohol', 'handicrafts', 265.00, 'medium', 50, 1
  UNION ALL SELECT 'Round Woven Box', 'round-woven-box-large', 'Round buri-woven storage box with lid, large size.', 'bohol', 'handicrafts', 650.00, 'large', 30, 1
  UNION ALL SELECT 'Round Woven Box', 'round-woven-box-special', 'Round buri-woven storage box with lid, special quality.', 'bohol', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Bohol Coin Purse', 'bohol-coin-purse-small', 'Handwoven coin purse with Bohol-inspired patterns, small size.', 'bohol', 'handicrafts', 35.00, 'small', 75, 1
  UNION ALL SELECT 'Bohol Coin Purse', 'bohol-coin-purse-medium', 'Handwoven coin purse with Bohol-inspired patterns, medium size.', 'bohol', 'handicrafts', 72.00, 'medium', 75, 1
  UNION ALL SELECT 'Bohol Coin Purse', 'bohol-coin-purse-large', 'Handwoven coin purse with Bohol-inspired patterns, large size.', 'bohol', 'handicrafts', 0.00, 'large', 0, 0
  UNION ALL SELECT 'Bohol Coin Purse', 'bohol-coin-purse-special', 'Handwoven coin purse with Bohol-inspired patterns, special quality.', 'bohol', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Handwoven Slippers', 'handwoven-slippers-bohol-small', 'Comfortable handwoven abaca slippers from Bohol, small size.', 'bohol', 'handicrafts', 88.00, 'small', 28, 1
  UNION ALL SELECT 'Handwoven Slippers', 'handwoven-slippers-bohol-medium', 'Comfortable handwoven abaca slippers from Bohol, medium size.', 'bohol', 'handicrafts', 170.00, 'medium', 28, 1
  UNION ALL SELECT 'Handwoven Slippers', 'handwoven-slippers-bohol-large', 'Comfortable handwoven abaca slippers from Bohol, large size.', 'bohol', 'handicrafts', 325.00, 'large', 20, 1
  UNION ALL SELECT 'Handwoven Slippers', 'handwoven-slippers-bohol-special', 'Comfortable handwoven abaca slippers from Bohol, special quality.', 'bohol', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Wooden Ref Magnet', 'wooden-ref-magnet-small', 'Wooden fridge magnet with laser-engraved Bohol landmarks, small size.', 'bohol', 'handicrafts', 38.00, 'small', 160, 1
  UNION ALL SELECT 'Wooden Ref Magnet', 'wooden-ref-magnet-medium', 'Wooden fridge magnet with laser-engraved Bohol landmarks, medium size.', 'bohol', 'handicrafts', 103.00, 'medium', 160, 1
  UNION ALL SELECT 'Wooden Ref Magnet', 'wooden-ref-magnet-large', 'Wooden fridge magnet with laser-engraved Bohol landmarks, large size.', 'bohol', 'handicrafts', 133.00, 'large', 100, 1
  UNION ALL SELECT 'Wooden Ref Magnet', 'wooden-ref-magnet-special', 'Wooden fridge magnet with laser-engraved Bohol landmarks, special quality.', 'bohol', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Bohol Wooden Keychain', 'bohol-wooden-keychain-small', 'Hand-carved wooden keychain with Bohol Chocolate Hills silhouette, small size.', 'bohol', 'handicrafts', 18.00, 'small', 130, 1
  UNION ALL SELECT 'Bohol Wooden Keychain', 'bohol-wooden-keychain-medium', 'Hand-carved wooden keychain with Bohol Chocolate Hills silhouette, medium size.', 'bohol', 'handicrafts', 68.00, 'medium', 130, 1
  UNION ALL SELECT 'Bohol Wooden Keychain', 'bohol-wooden-keychain-large', 'Hand-carved wooden keychain with Bohol Chocolate Hills silhouette, large size.', 'bohol', 'handicrafts', 0.00, 'large', 0, 0
  UNION ALL SELECT 'Bohol Wooden Keychain', 'bohol-wooden-keychain-special', 'Hand-carved wooden keychain with Bohol Chocolate Hills silhouette, special quality.', 'bohol', 'handicrafts', 0.00, 'special', 0, 0
 
-- ═══════════════════════════════════════════════════
-- HANDICRAFTS — BORACAY
-- ═══════════════════════════════════════════════════
  UNION ALL SELECT 'Boracay Wooden Ref Magnet', 'boracay-wooden-ref-magnet-small', 'Handpainted wooden fridge magnet featuring Boracay White Beach, small size.', 'boracay', 'handicrafts', 50.00, 'small', 200, 1
  UNION ALL SELECT 'Boracay Wooden Ref Magnet', 'boracay-wooden-ref-magnet-medium', 'Handpainted wooden fridge magnet featuring Boracay White Beach, medium size.', 'boracay', 'handicrafts', 98.00, 'medium', 200, 1
  UNION ALL SELECT 'Boracay Wooden Ref Magnet', 'boracay-wooden-ref-magnet-large', 'Handpainted wooden fridge magnet featuring Boracay White Beach, large size.', 'boracay', 'handicrafts', 118.00, 'large', 150, 1
  UNION ALL SELECT 'Boracay Wooden Ref Magnet', 'boracay-wooden-ref-magnet-special', 'Handpainted wooden fridge magnet featuring Boracay White Beach, special quality.', 'boracay', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Boracay Keychain', 'boracay-keychain-small', 'Fun seashell-and-resin keychain souvenir from Boracay, small size.', 'boracay', 'handicrafts', 38.00, 'small', 175, 1
  UNION ALL SELECT 'Boracay Keychain', 'boracay-keychain-medium', 'Fun seashell-and-resin keychain souvenir from Boracay, medium size.', 'boracay', 'handicrafts', 93.00, 'medium', 175, 1
  UNION ALL SELECT 'Boracay Keychain', 'boracay-keychain-large', 'Fun seashell-and-resin keychain souvenir from Boracay, large size.', 'boracay', 'handicrafts', 115.00, 'large', 120, 1
  UNION ALL SELECT 'Boracay Keychain', 'boracay-keychain-special', 'Fun seashell-and-resin keychain souvenir from Boracay, special quality.', 'boracay', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Boracay Bracelet', 'boracay-bracelet-small', 'Handmade shell and bead bracelet from Boracay, small size.', 'boracay', 'handicrafts', 0.00, 'small', 0, 0
  UNION ALL SELECT 'Boracay Bracelet', 'boracay-bracelet-medium', 'Handmade shell and bead bracelet from Boracay, medium size.', 'boracay', 'handicrafts', 60.00, 'medium', 95, 1
  UNION ALL SELECT 'Boracay Bracelet', 'boracay-bracelet-large', 'Handmade shell and bead bracelet from Boracay, large size.', 'boracay', 'handicrafts', 0.00, 'large', 0, 0
  UNION ALL SELECT 'Boracay Bracelet', 'boracay-bracelet-special', 'Handmade shell and bead bracelet from Boracay, premium quality.', 'boracay', 'handicrafts', 175.00, 'special', 50, 1
 
  UNION ALL SELECT 'Handmade Pearl Necklace', 'handmade-pearl-necklace-small', 'Elegant freshwater pearl necklace from Boracay jewelers, small size.', 'boracay', 'handicrafts', 118.00, 'small', 20, 1
  UNION ALL SELECT 'Handmade Pearl Necklace', 'handmade-pearl-necklace-medium', 'Elegant freshwater pearl necklace from Boracay jewelers, medium size.', 'boracay', 'handicrafts', 135.00, 'medium', 20, 1
  UNION ALL SELECT 'Handmade Pearl Necklace', 'handmade-pearl-necklace-large', 'Elegant freshwater pearl necklace from Boracay jewelers, large size.', 'boracay', 'handicrafts', 350.00, 'large', 15, 1
  UNION ALL SELECT 'Handmade Pearl Necklace', 'handmade-pearl-necklace-special', 'Elegant freshwater pearl necklace from Boracay jewelers, special quality.', 'boracay', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Boracay Pin', 'boracay-pin-small', 'Enamel pin featuring Boracay sailboats and sunset scenery, small size.', 'boracay', 'handicrafts', 50.00, 'small', 110, 1
  UNION ALL SELECT 'Boracay Pin', 'boracay-pin-medium', 'Enamel pin featuring Boracay sailboats and sunset scenery, medium size.', 'boracay', 'handicrafts', 0.00, 'medium', 0, 0
  UNION ALL SELECT 'Boracay Pin', 'boracay-pin-large', 'Enamel pin featuring Boracay sailboats and sunset scenery, large size.', 'boracay', 'handicrafts', 98.00, 'large', 80, 1
  UNION ALL SELECT 'Boracay Pin', 'boracay-pin-special', 'Enamel pin featuring Boracay sailboats and sunset scenery, special quality.', 'boracay', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Boracay Tote Bag', 'boracay-tote-bag-small', 'Canvas tote bag with hand-printed Boracay beach artwork, small size.', 'boracay', 'handicrafts', 85.00, 'small', 55, 1
  UNION ALL SELECT 'Boracay Tote Bag', 'boracay-tote-bag-medium', 'Canvas tote bag with hand-printed Boracay beach artwork, medium size.', 'boracay', 'handicrafts', 155.00, 'medium', 55, 1
  UNION ALL SELECT 'Boracay Tote Bag', 'boracay-tote-bag-large', 'Canvas tote bag with hand-printed Boracay beach artwork, large size.', 'boracay', 'handicrafts', 0.00, 'large', 0, 0
  UNION ALL SELECT 'Boracay Tote Bag', 'boracay-tote-bag-special', 'Canvas tote bag with hand-printed Boracay beach artwork, premium quality.', 'boracay', 'handicrafts', 275.00, 'special', 30, 1
 
  UNION ALL SELECT 'Boracay Coin Purse', 'boracay-coin-purse-small', 'Seashell-embellished handmade coin purse from Boracay, small size.', 'boracay', 'handicrafts', 50.00, 'small', 80, 1
  UNION ALL SELECT 'Boracay Coin Purse', 'boracay-coin-purse-medium', 'Seashell-embellished handmade coin purse from Boracay, medium size.', 'boracay', 'handicrafts', 65.00, 'medium', 80, 1
  UNION ALL SELECT 'Boracay Coin Purse', 'boracay-coin-purse-large', 'Seashell-embellished handmade coin purse from Boracay, large size.', 'boracay', 'handicrafts', 0.00, 'large', 0, 0
  UNION ALL SELECT 'Boracay Coin Purse', 'boracay-coin-purse-special', 'Seashell-embellished handmade coin purse from Boracay, special quality.', 'boracay', 'handicrafts', 0.00, 'special', 0, 0
 
  UNION ALL SELECT 'Boracay Bottle Opener', 'boracay-bottle-opener-small', 'Novelty surfboard-shaped bottle opener from Boracay, small size.', 'boracay', 'handicrafts', 65.00, 'small', 65, 1
  UNION ALL SELECT 'Boracay Bottle Opener', 'boracay-bottle-opener-medium', 'Novelty surfboard-shaped bottle opener from Boracay, medium size.', 'boracay', 'handicrafts', 0.00, 'medium', 0, 0
  UNION ALL SELECT 'Boracay Bottle Opener', 'boracay-bottle-opener-large', 'Novelty surfboard-shaped bottle opener from Boracay, large size.', 'boracay', 'handicrafts', 170.00, 'large', 40, 1
  UNION ALL SELECT 'Boracay Bottle Opener', 'boracay-bottle-opener-special', 'Novelty surfboard-shaped bottle opener from Boracay, premium quality.', 'boracay', 'handicrafts', 125.00, 'special', 30, 1
 
-- ═══════════════════════════════════════════════════
-- DELICACIES — all locations 
-- ═══════════════════════════════════════════════════
  UNION ALL SELECT 'Royal Bibingka', 'royal-bibingka', 'Traditional Ilocano bibingka made with glutinous rice, sugar, and coconut milk.', 'vigan', 'delicacies', 180.00, 'medium', 40, 1
  UNION ALL SELECT 'Chicacorn', 'chicacorn', 'Savory and crunchy corn snack, a popular pasalubong from Vigan.', 'vigan', 'delicacies', 95.00, 'medium', 100, 1
  UNION ALL SELECT 'Turones De Mani', 'turones-de-mani', 'Crispy fried peanut turrones wrapped in a sweet caramel casing.', 'vigan', 'delicacies', 120.00, 'medium', 80, 1
  UNION ALL SELECT 'Bolero', 'bolero', 'Sweet Ilocano candy made from caramelized sugar and peanuts.', 'vigan', 'delicacies', 85.00, 'medium', 90, 1
  UNION ALL SELECT 'Empanadita', 'empanadita', 'Miniature Vigan empanadas filled with longganisa, egg, and vegetables.', 'vigan', 'delicacies', 150.00, 'medium', 30, 1
  UNION ALL SELECT 'Calamay', 'calamay-vigan', 'Sticky sweet rice delicacy cooked with coconut milk and sugar.', 'vigan', 'delicacies', 165.00, 'medium', 50, 1
  UNION ALL SELECT 'Vigan Longganisa', 'vigan-longganisa', 'Famous garlic-rich Vigan sausage, a beloved Ilocano breakfast staple.', 'vigan', 'delicacies', 550.00, 'medium', 35, 1
  UNION ALL SELECT 'Bagnet Vigan', 'bagnet-vigan', 'Crispy double-fried pork belly, the Ilocano version of chicharon.', 'vigan', 'delicacies', 825.00, 'medium', 25, 1
  UNION ALL SELECT 'Cream Puffs', 'cream-puffs', 'Fluffy choux pastry filled with fresh cream, Baguio''s most iconic pasalubong.', 'baguio', 'delicacies', 195.00, 'medium', 40, 1
  UNION ALL SELECT 'Ube Jam', 'ube-jam', 'Creamy homemade purple yam jam from the highlands of Baguio.', 'baguio', 'delicacies', 425.00, 'medium', 60, 1
  UNION ALL SELECT 'Lengua De Gato', 'lengua-de-gato', 'Delicate butter cookies shaped like cat tongues, a Baguio baking tradition.', 'baguio', 'delicacies', 200.00, 'medium', 70, 1
  UNION ALL SELECT 'Peanut Brittle', 'peanut-brittle', 'Classic crunchy peanut brittle made with fresh Benguet peanuts.', 'baguio', 'delicacies', 148.00, 'medium', 85, 1
  UNION ALL SELECT 'Choc''O Flakes', 'choco-flakes', 'Crispy chocolate-coated corn flake clusters, a sweet Baguio treat.', 'baguio', 'delicacies', 130.00, 'medium', 95, 1
  UNION ALL SELECT 'Baguio Strawberry', 'baguio-strawberry', 'Fresh highland strawberries from La Trinidad Valley, Benguet.', 'baguio', 'delicacies', 120.00, 'medium', 20, 1
  UNION ALL SELECT 'Baguio Meringue', 'baguio-meringue', 'Light and crispy meringue cookies with a melt-in-your-mouth texture.', 'baguio', 'delicacies', 145.00, 'medium', 65, 1
  UNION ALL SELECT 'Ube Crinkles', 'ube-crinkles', 'Soft and chewy purple yam crinkle cookies dusted with powdered sugar.', 'baguio', 'delicacies', 160.00, 'medium', 55, 1
  UNION ALL SELECT 'Rowena''s Blueberry Cheese Tarts', 'rowenas-blueberry-cheese-tarts', 'Famous blueberry-topped cream cheese tarts from Rowena''s in Tagaytay.', 'tagaytay', 'delicacies', 365.00, 'medium', 30, 1
  UNION ALL SELECT 'Balay Dako Piaya', 'balay-dako-piaya', 'Flat sugarcane-filled unleavened bread inspired by Balay Dako''s local flavors.', 'tagaytay', 'delicacies', 160.00, 'medium', 45, 1
  UNION ALL SELECT 'Bag of Beans'' Raisin Bread', 'bag-of-beans-raisin-bread', 'Hearty homemade raisin bread from the beloved Bag of Beans café in Tagaytay.', 'tagaytay', 'delicacies', 210.00, 'medium', 25, 1
  UNION ALL SELECT 'Buko Pie', 'buko-pie', 'Creamy young coconut pie, Tagaytay''s most famous pasalubong.', 'tagaytay', 'delicacies', 315.00, 'medium', 35, 1
  UNION ALL SELECT 'Banana Cake', 'banana-cake', 'Moist and flavorful banana loaf cake baked fresh in Tagaytay.', 'tagaytay', 'delicacies', 220.00, 'medium', 30, 1
  UNION ALL SELECT 'Rodilla''s Yema Cake', 'rodillas-yema-cake', 'Indulgent yema frosted chiffon cake from Rodilla''s Bakeshop in Tagaytay.', 'tagaytay', 'delicacies', 350.00, 'medium', 20, 1
  UNION ALL SELECT 'Espasol', 'espasol', 'Soft cylindrical rice flour delicacy rolled in toasted coconut, a Tagaytay classic.', 'tagaytay', 'delicacies', 85.00, 'medium', 60, 1
  UNION ALL SELECT 'Sylvannas', 'sylvannas', 'Cashew meringue wafers sandwiched with French buttercream, Tagaytay''s sweet pride.', 'tagaytay', 'delicacies', 185.00, 'medium', 50, 1
  UNION ALL SELECT 'Peanut Kisses', 'peanut-kisses', 'Tiny dome-shaped peanut cookies, Bohol''s most iconic and beloved pasalubong.', 'bohol', 'delicacies', 120.00, 'medium', 100, 1
  UNION ALL SELECT 'Broas', 'broas', 'Light and airy ladyfinger sponge biscuits, a traditional Bohol delicacy.', 'bohol', 'delicacies', 110.00, 'medium', 75, 1
  UNION ALL SELECT 'Bohol''s Calamay', 'bohols-calamay', 'Sweet sticky rice delicacy cooked in coconut milk, served in a coconut shell.', 'bohol', 'delicacies', 113.00, 'medium', 40, 1
  UNION ALL SELECT 'Ube Kinampay Polvoron', 'ube-kinampay-polvoron', 'Melt-in-your-mouth polvoron made with Bohol''s prized Kinampay purple yam.', 'bohol', 'delicacies', 140.00, 'medium', 65, 1
  UNION ALL SELECT 'Tinapay Crisp', 'tinapay-crisp', 'Twice-baked crunchy bread crisps, a satisfying snack from Bohol.', 'bohol', 'delicacies', 95.00, 'medium', 80, 1
  UNION ALL SELECT 'Dalareich Chocolates', 'dalareich-chocolates', 'Artisanal Philippine cacao chocolates crafted by Dalareich in Bohol.', 'bohol', 'delicacies', 220.00, 'medium', 45, 1
  UNION ALL SELECT 'Calamay Bun', 'calamay-bun', 'Soft bread rolls filled with sweet calamay coconut-rice filling.', 'bohol', 'delicacies', 130.00, 'medium', 35, 1
  UNION ALL SELECT 'Hillcolate', 'hillcolate', 'Rich tablea-based chocolate drink mix from locally sourced Bohol cacao.', 'bohol', 'delicacies', 185.00, 'medium', 55, 1
  UNION ALL SELECT 'Biscocho', 'biscocho', 'Crispy twice-baked bread slices brushed with butter and sugar, a Visayan classic.', 'boracay', 'delicacies', 185.00, 'medium', 90, 1
  UNION ALL SELECT 'Calamansi Muffin', 'calamansi-muffin', 'Zesty calamansi-infused muffins baked fresh, a Boracay resort favorite.', 'boracay', 'delicacies', 83.00, 'medium', 40, 1
  UNION ALL SELECT 'Butterscotch', 'butterscotch', 'Sweet and buttery butterscotch candy squares, a popular island treat.', 'boracay', 'delicacies', 115.00, 'medium', 80, 1
  UNION ALL SELECT 'Banana Chips', 'banana-chips', 'Thin crispy banana chips fried to golden perfection, lightly salted or sweetened.', 'boracay', 'delicacies', 90.00, 'medium', 110, 1
  UNION ALL SELECT 'Otap', 'otap', 'Flaky oval-shaped puff pastry dusted with sugar, a beloved Visayan biscuit.', 'boracay', 'delicacies', 100.00, 'medium', 85, 1
  UNION ALL SELECT 'Barquillos', 'barquillos', 'Thin rolled wafer tubes with a crispy texture, a light and addictive snack.', 'boracay', 'delicacies', 120.00, 'medium', 75, 1
  UNION ALL SELECT 'Kalamansi Marmalade', 'kalamansi-marmalade', 'Tangy and sweet kalamansi marmalade made from local citrus.', 'boracay', 'delicacies', 165.00, 'medium', 50, 1
  UNION ALL SELECT 'Fish Cracker', 'fish-cracker', 'Crispy fish crackers made from fresh island catch.', 'boracay', 'delicacies', 85.00, 'medium', 95, 1
 
-- ═══════════════════════════════════════════════════
-- DECORATIONS — all locations 
-- ═══════════════════════════════════════════════════
  UNION ALL SELECT 'Burnay Art Prints', 'burnay-art-prints', 'Artistic prints featuring traditional Vigan Burnay pottery designs.', 'vigan', 'decorations', 380.00, 'medium', 20, 1
  UNION ALL SELECT 'Vigan Streetscape Art', 'vigan-streetscape-art', 'Beautiful artwork depicting historic Vigan street scenes.', 'vigan', 'decorations', 450.00, 'medium', 15, 1
  UNION ALL SELECT 'Inabel Placemats', 'inabel-placemats', 'Traditional Ilocano woven placemats with colorful patterns.', 'vigan', 'decorations', 143.00, 'medium', 35, 1
  UNION ALL SELECT 'Miniature Kalesa Model', 'miniature-kalesa-model', 'Detailed miniature model of the traditional horse-drawn carriage.', 'vigan', 'decorations', 185.00, 'medium', 22, 1
  UNION ALL SELECT 'Decorative Vases', 'decorative-vases', 'Hand-painted decorative vases in traditional Vigan style.', 'vigan', 'decorations', 250.00, 'medium', 18, 1
  UNION ALL SELECT 'Ancestral House Figurine', 'ancestral-house-figurine', 'Miniature figurine of traditional Vigan ancestral house.', 'vigan', 'decorations', 490.00, 'medium', 25, 1
  UNION ALL SELECT 'Clay Sculpture', 'clay-sculpture', 'Handcrafted clay sculpture by Vigan artisans.', 'vigan', 'decorations', 750.00, 'medium', 10, 1
  UNION ALL SELECT 'Milling Stone Decor', 'milling-stone-decor', 'Decorative replica of traditional stone mill.', 'vigan', 'decorations', 520.00, 'medium', 12, 1
  UNION ALL SELECT 'Ifugao Rice Guardian', 'ifugao-rice-guardian', 'Traditional Ifugao carved rice guardian figure.', 'baguio', 'decorations', 425.00, 'medium', 15, 1
  UNION ALL SELECT 'Igorot Tribal Wood Carving', 'igorot-tribal-wood-carving', 'Authentic tribal wood carving by Igorot artisans.', 'baguio', 'decorations', 240.00, 'medium', 12, 1
  UNION ALL SELECT 'Woven Textile Wall Art', 'woven-textile-wall-art', 'Colorful woven textile art piece for wall display.', 'baguio', 'decorations', 73.00, 'medium', 18, 1
  UNION ALL SELECT 'Giant Wooden Spoon and Fork Wall Decor', 'giant-wooden-spoon-and-fork-wall-decor', 'Oversized wooden utensils for rustic wall decoration.', 'baguio', 'decorations', 148.00, 'medium', 20, 1
  UNION ALL SELECT 'Ifugao Tribal Mask', 'ifugao-tribal-mask', 'Hand-carved traditional Ifugao tribal mask.', 'baguio', 'decorations', 200.00, 'medium', 8, 1
  UNION ALL SELECT 'Barrel Man', 'barrel-man', 'Iconic Baguio novelty wooden barrel man figurine.', 'baguio', 'decorations', 185.00, 'medium', 60, 1
  UNION ALL SELECT 'Tribal Bust', 'tribal-bust', 'Carved wooden bust depicting traditional tribal figure.', 'baguio', 'decorations', 980.00, 'medium', 10, 1
  UNION ALL SELECT 'Animal Wood Carving', 'animal-wood-carving', 'Hand-carved wooden animal figurines.', 'baguio', 'decorations', 320.00, 'medium', 35, 1
  UNION ALL SELECT 'Ilog Maria Beeswax Candle', 'ilog-maria-beeswax-candle', 'Natural beeswax candles from Ilog Maria monastery.', 'tagaytay', 'decorations', 315.00, 'medium', 40, 1
  UNION ALL SELECT 'Taal Lake Wall Painting', 'taal-lake-wall-painting', 'Beautiful painting featuring scenic Taal Lake views.', 'tagaytay', 'decorations', 365.00, 'medium', 10, 1
  UNION ALL SELECT 'Small Potted Plants', 'small-potted-plants', 'Assorted small potted plants perfect for home decor.', 'tagaytay', 'decorations', 85.00, 'medium', 50, 1
  UNION ALL SELECT 'Tagaytay Postcard', 'tagaytay-postcard', 'Collectible postcards featuring Tagaytay landmarks.', 'tagaytay', 'decorations', 75.00, 'medium', 120, 1
  UNION ALL SELECT 'Tagaytay Mini Figurines', 'tagaytay-mini-figurines', 'Miniature figurines of Tagaytay attractions.', 'tagaytay', 'decorations', 100.00, 'medium', 45, 1
  UNION ALL SELECT 'Dreamcatcher Wall Display', 'dreamcatcher-wall-display', 'Large decorative dreamcatcher for wall mounting.', 'tagaytay', 'decorations', 480.00, 'medium', 20, 1
  UNION ALL SELECT 'Cellphone Holder', 'cellphone-holder', 'Handcrafted wooden cellphone holder.', 'tagaytay', 'decorations', 165.00, 'medium', 55, 1
  UNION ALL SELECT 'Pen Holder', 'pen-holder', 'Decorative wooden pen and pencil holder.', 'tagaytay', 'decorations', 140.00, 'medium', 60, 1
  UNION ALL SELECT 'Antequera Baskets', 'antequera-baskets-decor', 'Decorative woven baskets from Antequera, Bohol.', 'bohol', 'decorations', 158.00, 'medium', 35, 1
  UNION ALL SELECT 'Table Runners', 'table-runners', 'Hand-woven table runners with traditional patterns.', 'bohol', 'decorations', 113.00, 'medium', 28, 1
  UNION ALL SELECT 'Bohol Shell Decor', 'bohol-shell-decor', 'Decorative shell arrangements from Bohol shores.', 'bohol', 'decorations', 105.00, 'medium', 45, 1
  UNION ALL SELECT 'Coconut Bowls with Mother of Pearl', 'coconut-bowls-with-mother-of-pearl', 'Polished coconut bowls inlaid with mother of pearl.', 'bohol', 'decorations', 180.00, 'medium', 30, 1
  UNION ALL SELECT 'Tarsier Wood Carving', 'tarsier-wood-carving', 'Hand-carved wooden tarsier figurine.', 'bohol', 'decorations', 65.00, 'medium', 40, 1
  UNION ALL SELECT 'Asin Tibuok', 'asin-tibuok', 'Traditional Bohol sea salt formed in coconut husks.', 'bohol', 'decorations', 650.00, 'medium', 15, 1
  UNION ALL SELECT 'Buri Lampshade', 'buri-lampshade', 'Handwoven buri palm lampshade.', 'bohol', 'decorations', 780.00, 'medium', 18, 1
  UNION ALL SELECT 'Capiz Shell Window', 'capiz-shell-window', 'Traditional window panel made from capiz shells.', 'bohol', 'decorations', 1200.00, 'medium', 8, 1
  UNION ALL SELECT 'Boracay Sand Bottles', 'boracay-sand-bottles', 'Decorative bottles filled with layered Boracay sand.', 'boracay', 'decorations', 188.00, 'medium', 80, 1
  UNION ALL SELECT 'Abaca Placemats', 'abaca-placemats', 'Natural abaca fiber placemats.', 'boracay', 'decorations', 83.00, 'medium', 50, 1
  UNION ALL SELECT 'Boracay Painting', 'boracay-painting', 'Artistic painting of Boracay beach scenes.', 'boracay', 'decorations', 185.00, 'medium', 12, 1
  UNION ALL SELECT 'Miniature Boat Models', 'miniature-boat-models', 'Detailed miniature models of traditional boats.', 'boracay', 'decorations', 120.00, 'medium', 25, 1
  UNION ALL SELECT 'Boracay Lanterns', 'boracay-lanterns', 'Decorative lanterns with beach-themed designs.', 'boracay', 'decorations', 390.00, 'medium', 30, 1
  UNION ALL SELECT 'Shell Chimes', 'shell-chimes', 'Wind chimes made from natural seashells.', 'boracay', 'decorations', 185.00, 'medium', 55, 1
  UNION ALL SELECT 'Stone Figurines', 'stone-figurines', 'Hand-carved stone figurines.', 'boracay', 'decorations', 260.00, 'medium', 40, 1
  UNION ALL SELECT 'Wooden Plate Decor', 'wooden-plate-decor', 'Decorative wooden plates with painted designs.', 'boracay', 'decorations', 340.00, 'medium', 22, 1
 
-- ═══════════════════════════════════════════════════
-- HOMEWARE — all locations 

-- ═══════════════════════════════════════════════════
  UNION ALL SELECT 'Burnay Pottery Set', 'burnay-pottery-set', 'Complete set of traditional Burnay pottery for home use.', 'vigan', 'homeware', 850.00, 'medium', 15, 1
  UNION ALL SELECT 'Wooden Furnitures', 'wooden-furnitures', 'Handcrafted wooden furniture pieces in traditional Ilocano style.', 'vigan', 'homeware', 2500.00, 'medium', 8, 1
  UNION ALL SELECT 'Buri Baskets and Storage', 'buri-baskets-and-storage', 'Versatile storage baskets woven from buri palm.', 'vigan', 'homeware', 380.00, 'medium', 40, 1
  UNION ALL SELECT 'Inabel Cloth', 'inabel-cloth', 'Traditional handwoven Inabel fabric.', 'vigan', 'homeware', 550.00, 'medium', 25, 1
  UNION ALL SELECT 'Shell Lamp', 'shell-lamp', 'Decorative lamp adorned with natural shells.', 'vigan', 'homeware', 980.00, 'medium', 12, 1
  UNION ALL SELECT 'Wood Carved Wall Decor', 'wood-carved-wall-decor', 'Intricate hand-carved wooden wall decoration.', 'vigan', 'homeware', 1200.00, 'medium', 10, 1
  UNION ALL SELECT 'Bamboo Rattan Furnitures', 'bamboo-rattan-furnitures', 'Sturdy furniture made from bamboo and rattan.', 'vigan', 'homeware', 3200.00, 'medium', 6, 1
  UNION ALL SELECT 'Bulatlat Pottery Set', 'bulatlat-pottery-set', 'Set of traditional Bulatlat pottery jars.', 'vigan', 'homeware', 720.00, 'medium', 14, 1
  UNION ALL SELECT 'Ifugao Wooden Statue', 'ifugao-wooden-statue', 'Large carved wooden statue in Ifugao tradition.', 'baguio', 'homeware', 1500.00, 'medium', 10, 1
  UNION ALL SELECT 'Wooden Tableware', 'wooden-tableware', 'Handcrafted wooden plates, bowls, and utensils.', 'baguio', 'homeware', 680.00, 'medium', 22, 1
  UNION ALL SELECT 'Terracotta Planters', 'terracotta-planters', 'Traditional terracotta plant pots.', 'baguio', 'homeware', 290.00, 'medium', 35, 1
  UNION ALL SELECT 'Igorot Handwoven Blankets', 'igorot-handwoven-blankets', 'Warm handwoven blankets with tribal patterns.', 'baguio', 'homeware', 1100.00, 'medium', 15, 1
  UNION ALL SELECT 'Handwoven Foot Rugs', 'handwoven-foot-rugs', 'Durable handwoven rugs for home use.', 'baguio', 'homeware', 450.00, 'medium', 20, 1
  UNION ALL SELECT 'Bamboo Lantern', 'bamboo-lantern', 'Traditional bamboo lantern for ambient lighting.', 'baguio', 'homeware', 380.00, 'medium', 28, 1
  UNION ALL SELECT 'Mug', 'mug-baguio', 'Ceramic mug with Baguio designs.', 'baguio', 'homeware', 195.00, 'medium', 60, 1
  UNION ALL SELECT 'Wall Photo', 'wall-photo', 'Framed photographs of Baguio scenery.', 'baguio', 'homeware', 420.00, 'medium', 18, 1
  UNION ALL SELECT 'Mahogany Bowl', 'mahogany-bowl', 'Hand-turned mahogany wood serving bowl.', 'tagaytay', 'homeware', 580.00, 'medium', 18, 1
  UNION ALL SELECT 'Abaca Basket', 'abaca-basket', 'Large storage basket woven from abaca fiber.', 'tagaytay', 'homeware', 320.00, 'medium', 32, 1
  UNION ALL SELECT 'Tagaytay Terracotta Planters', 'tagaytay-terracotta-planters', 'Rustic terracotta planters for indoor plants.', 'tagaytay', 'homeware', 265.00, 'medium', 28, 1
  UNION ALL SELECT 'Tagaytay Candle', 'tagaytay-candle', 'Scented candles with natural local fragrances.', 'tagaytay', 'homeware', 245.00, 'medium', 50, 1
  UNION ALL SELECT 'Wood Clock', 'wood-clock', 'Wall clock made from polished wood.', 'tagaytay', 'homeware', 680.00, 'medium', 15, 1
  UNION ALL SELECT 'Embroidered Linens', 'embroidered-linens', 'Hand-embroidered table linens and napkins.', 'tagaytay', 'homeware', 490.00, 'medium', 22, 1
  UNION ALL SELECT 'Wood Chimes', 'wood-chimes', 'Melodious wind chimes made from bamboo.', 'tagaytay', 'homeware', 220.00, 'medium', 38, 1
  UNION ALL SELECT 'Concrete Planters', 'concrete-planters', 'Modern concrete planters for succulents.', 'tagaytay', 'homeware', 350.00, 'medium', 25, 1
  UNION ALL SELECT 'Bohol Coconut Bowl', 'bohol-coconut-bowl', 'Polished coconut shell bowl for serving.', 'bohol', 'homeware', 195.00, 'medium', 55, 1
  UNION ALL SELECT 'Seashell Chime', 'seashell-chime', 'Musical wind chime made from seashells.', 'bohol', 'homeware', 185.00, 'medium', 45, 1
  UNION ALL SELECT 'Tubigon Weave', 'tubigon-weave', 'Traditional woven textile from Tubigon.', 'bohol', 'homeware', 420.00, 'medium', 20, 1
  UNION ALL SELECT 'Wooden Kitchenware', 'wooden-kitchenware-bohol', 'Set of wooden spoons and cooking utensils.', 'bohol', 'homeware', 280.00, 'medium', 38, 1
  UNION ALL SELECT 'Antequera Baskets', 'antequera-baskets-homeware', 'Functional storage baskets from Antequera.', 'bohol', 'homeware', 450.00, 'medium', 22, 1
  UNION ALL SELECT 'Woven Nito Vine Accessories', 'woven-nito-vine-accessories', 'Home accessories woven from nito vine.', 'bohol', 'homeware', 380.00, 'medium', 18, 1
  UNION ALL SELECT 'Bohol Bamboo Furniture', 'bohol-bamboo-furniture', 'Sustainable bamboo furniture pieces.', 'bohol', 'homeware', 3500.00, 'medium', 5, 1
  UNION ALL SELECT 'Woven Buri Window Blinds', 'woven-buri-window-blinds', 'Natural window blinds woven from buri.', 'bohol', 'homeware', 1100.00, 'medium', 10, 1
  UNION ALL SELECT 'Shell Decor', 'shell-decor', 'Decorative shell arrangements for home.', 'boracay', 'homeware', 180.00, 'medium', 60, 1
  UNION ALL SELECT 'Puka Shell Chandeliers', 'puka-shell-chandeliers', 'Elegant chandelier made from puka shells.', 'boracay', 'homeware', 2800.00, 'medium', 8, 1
  UNION ALL SELECT 'Driftwood Centerpiece Bowls', 'driftwood-centerpiece-bowls', 'Unique bowls carved from driftwood.', 'boracay', 'homeware', 650.00, 'medium', 15, 1
  UNION ALL SELECT 'Pandanus (Bariw) Floor Mats', 'pandanus-bariw-floor-mats', 'Natural floor mats woven from pandanus.', 'boracay', 'homeware', 480.00, 'medium', 20, 1
  UNION ALL SELECT 'Aqua de Boracay Home Fragrance', 'aqua-de-boracay-home-fragrance', 'Ocean-inspired home fragrance spray.', 'boracay', 'homeware', 320.00, 'medium', 40, 1
  UNION ALL SELECT 'Coconut Shell Soy Candles', 'coconut-shell-soy-candles', 'Eco-friendly soy candles in coconut shells.', 'boracay', 'homeware', 285.00, 'medium', 50, 1
  UNION ALL SELECT 'Kamagong Utensils', 'kamagong-utensils', 'Premium utensils carved from kamagong wood.', 'boracay', 'homeware', 850.00, 'medium', 12, 1
  UNION ALL SELECT 'Tsokolatera & Batirol', 'tsokolatera-batirol', 'Traditional chocolate making set with wooden whisk.', 'boracay', 'homeware', 620.00, 'medium', 18, 1
 
-- ═══════════════════════════════════════════════════
-- CLOTHES — all locations 
-- ═══════════════════════════════════════════════════
  UNION ALL SELECT 'Souvenir Shirt', 'souvenir-shirt-vigan', 'Classic Vigan souvenir shirt with local heritage prints.', 'vigan', 'clothes', 203.00, 'medium', 80, 1
  UNION ALL SELECT 'Inabel Shawl', 'inabel-shawl-vigan', 'Handwoven Inabel shawl using traditional Ilocano loom techniques.', 'vigan', 'clothes', 450.00, 'medium', 40, 1
  UNION ALL SELECT 'Inabel Blouse/Top', 'inabel-blouse-top-vigan', 'Elegant Inabel blouse/top handwoven by Ilocano weavers.', 'vigan', 'clothes', 1100.00, 'medium', 25, 1
  UNION ALL SELECT 'Modern Filipiniana / Ethnic Blouse', 'modern-filipiniana-blouse-vigan', 'Modern Filipiniana blouse with ethnic Ilocano design accents.', 'vigan', 'clothes', 1175.00, 'medium', 25, 1
  UNION ALL SELECT 'Woven Polo Shirts', 'woven-polo-shirts-vigan', 'Breathable woven polo shirts featuring traditional Ilocano patterns.', 'vigan', 'clothes', 925.00, 'medium', 30, 1
  UNION ALL SELECT 'Inabel Ponchos', 'inabel-ponchos-vigan', 'Cozy Inabel ponchos handwoven from native Ilocano threads.', 'vigan', 'clothes', 750.00, 'medium', 30, 1
  UNION ALL SELECT 'Woven Ethnic Ponchos/Boleros', 'woven-ethnic-ponchos-baguio', 'Warm woven ethnic ponchos and boleros from Baguio highland weavers.', 'baguio', 'clothes', 875.00, 'medium', 30, 1
  UNION ALL SELECT 'Handwoven Wrap Skirts', 'handwoven-wrap-skirts-baguio', 'Handwoven wrap skirts in traditional Cordillera patterns.', 'baguio', 'clothes', 675.00, 'medium', 30, 1
  UNION ALL SELECT 'Igorot-Inspired Vests', 'igorot-inspired-vests-baguio', 'Vests inspired by traditional Igorot attire from the Cordillera highlands.', 'baguio', 'clothes', 600.00, 'medium', 30, 1
  UNION ALL SELECT 'Ethnic-Print Headbands', 'ethnic-print-headbands-baguio', 'Colorful headbands featuring Igorot ethnic prints and designs.', 'baguio', 'clothes', 100.00, 'medium', 80, 1
  UNION ALL SELECT 'Winter/Heavy Jackets', 'winter-heavy-jackets-baguio', 'Thick and warm jackets perfect for Baguio''s cool highland climate.', 'baguio', 'clothes', 500.00, 'medium', 40, 1
  UNION ALL SELECT 'Knitted Sweaters', 'knitted-sweaters-baguio', 'Hand-knitted sweaters crafted by local Baguio knitters.', 'baguio', 'clothes', 225.00, 'medium', 40, 1
  UNION ALL SELECT 'Flannels & Casual Shirts', 'flannels-casual-shirts-baguio', 'Casual flannel shirts perfect for Baguio''s cool weather.', 'baguio', 'clothes', 125.00, 'medium', 50, 1
  UNION ALL SELECT 'High-Quality Graphic Tees', 'high-quality-graphic-tees-baguio', 'Premium graphic tees featuring Baguio landmark and nature designs.', 'baguio', 'clothes', 250.00, 'medium', 60, 1
  UNION ALL SELECT 'Knitted Cardigans / Sweaters', 'knitted-cardigans-sweaters-tagaytay', 'Cozy knitted cardigans and sweaters for Tagaytay''s cool breeze.', 'tagaytay', 'clothes', 550.00, 'medium', 35, 1
  UNION ALL SELECT 'Embossed Tagaytay Hoodies', 'embossed-tagaytay-hoodies', 'Comfortable hoodies with embossed Tagaytay scenic designs.', 'tagaytay', 'clothes', 650.00, 'medium', 35, 1
  UNION ALL SELECT 'Light Windbreakers', 'light-windbreakers-tagaytay', 'Lightweight windbreakers ideal for outdoor activities in Tagaytay.', 'tagaytay', 'clothes', 450.00, 'medium', 35, 1
  UNION ALL SELECT 'Pashmina / Shawls', 'pashmina-shawls-tagaytay', 'Soft pashmina shawls perfect for Tagaytay''s cool highland atmosphere.', 'tagaytay', 'clothes', 250.00, 'medium', 50, 1
  UNION ALL SELECT 'Minimalist/Graphic Tees', 'minimalist-graphic-tees-tagaytay', 'Minimalist and graphic tees with Tagaytay and Taal Lake designs.', 'tagaytay', 'clothes', 340.00, 'medium', 60, 1
  UNION ALL SELECT 'Adult Souvenir Shirt (Cotton)', 'adult-souvenir-shirt-tagaytay', 'Classic cotton souvenir shirt with Tagaytay landmark prints.', 'tagaytay', 'clothes', 230.00, 'medium', 80, 1
  UNION ALL SELECT 'Embroidered Caps / Waway Hats', 'embroidered-caps-waway-hats-tagaytay', 'Embroidered caps and waway hats featuring Tagaytay designs.', 'tagaytay', 'clothes', 225.00, 'medium', 60, 1
  UNION ALL SELECT 'Native Abaca Slippers', 'native-abaca-slippers-tagaytay', 'Comfortable slippers handwoven from native abaca fibers.', 'tagaytay', 'clothes', 185.00, 'medium', 40, 1
  UNION ALL SELECT 'Modern Filipiniana / Blouses', 'modern-filipiniana-blouses-bohol', 'Beautifully embroidered Filipiniana blouses with Bohol-inspired accents.', 'bohol', 'clothes', 1275.00, 'medium', 25, 1
  UNION ALL SELECT 'Inabel/Woven Shawls or Wraps', 'inabel-woven-shawls-bohol', 'Elegant woven shawls and wraps crafted by Bohol artisan weavers.', 'bohol', 'clothes', 600.00, 'medium', 30, 1
  UNION ALL SELECT 'Native-Inspired Vests or Boleros', 'native-inspired-vests-boleros-bohol', 'Vests and boleros inspired by Bohol''s native weaving traditions.', 'bohol', 'clothes', 850.00, 'medium', 25, 1
  UNION ALL SELECT 'Graphic Tees (Visayan/Bohol-themed)', 'graphic-tees-bohol', 'Fun and colorful graphic tees with Visayan and Bohol-themed designs.', 'bohol', 'clothes', 265.00, 'medium', 70, 1
  UNION ALL SELECT 'Standard Cotton I Love Bohol Shirts', 'i-love-bohol-shirts', 'Classic cotton shirts with I Love Bohol souvenir prints.', 'bohol', 'clothes', 265.00, 'medium', 80, 1
  UNION ALL SELECT 'Kids Souvenir Shirts (Bohol)', 'kids-souvenir-shirts-bohol', 'Adorable kids souvenir shirts with Bohol tarsier and nature designs.', 'bohol', 'clothes', 138.00, 'medium', 60, 1
  UNION ALL SELECT 'Sarongs / Beach Wraps', 'sarongs-beach-wraps-boracay', 'Lightweight rayon and cotton sarongs and beach wraps from Boracay.', 'boracay', 'clothes', 250.00, 'medium', 60, 1
  UNION ALL SELECT 'Summer Dresses / Maxi Dresses', 'summer-maxi-dresses-boracay', 'Flowy summer and maxi dresses perfect for Boracay beach days.', 'boracay', 'clothes', 825.00, 'medium', 30, 1
  UNION ALL SELECT 'Men''s Tropical/Floral Shirts', 'mens-tropical-floral-shirts-boracay', 'Vibrant tropical and floral shirts perfect for Boracay''s beach lifestyle.', 'boracay', 'clothes', 550.00, 'medium', 40, 1
  UNION ALL SELECT 'I Love Boracay T-Shirts', 'i-love-boracay-tshirts', 'Classic I Love Boracay souvenir T-shirts.', 'boracay', 'clothes', 185.00, 'medium', 80, 1
  UNION ALL SELECT 'Muscle Tees / Tank Tops', 'muscle-tees-tank-tops-boracay', 'Casual muscle tees and tank tops with Boracay beach prints.', 'boracay', 'clothes', 190.00, 'medium', 70, 1
  UNION ALL SELECT 'Kids Boracay Shirts', 'kids-boracay-shirts', 'Fun kids souvenir shirts with Boracay beach and island designs.', 'boracay', 'clothes', 138.00, 'medium', 60, 1
  UNION ALL SELECT 'Native Sandals/Slides', 'native-sandals-slides-boracay', 'Comfortable native sandals and slides handcrafted in Boracay.', 'boracay', 'clothes', 275.00, 'medium', 40, 1
 
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
