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

INSERT IGNORE INTO admins (username, email, password_hash, full_name, role, is_active)
VALUES (
  'superadmin',
  'admin@soucul.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123 (bcrypt)
  'Super Admin',
  'super_admin',
  1
);

-- ── 6. SEED — locations (provinces) ─────────────────────────────────────────

INSERT IGNORE INTO locations (name, slug, region, province, is_active, display_order) VALUES
  ('Vigan',    'vigan',    'Ilocos Region',     'Ilocos Sur',    1, 1),
  ('Baguio',   'baguio',   'CAR',               'Benguet',       1, 2),
  ('Tagaytay', 'tagaytay', 'CALABARZON',        'Cavite',        1, 3),
  ('Bohol',    'bohol',    'Central Visayas',   'Bohol',         1, 4),
  ('Boracay',  'boracay',  'Western Visayas',   'Aklan',         1, 5);

-- ── 7. SEED — categories (subcategories) ────────────────────────────────────

INSERT IGNORE INTO categories (name, slug, is_active, display_order) VALUES
  ('Clothes',      'clothes',      1, 1),
  ('Handicrafts',  'handicrafts',  1, 2),
  ('Delicacies',   'delicacies',   1, 3),
  ('Decorations',  'decorations',  1, 4),
  ('Homeware',     'homeware',     1, 5);

-- ── 8. NOTIFICATIONS ─────────────────────────────────────────────────────────

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

-- ── 9. CUSTOMER PROFILE + ACCOUNT DATA ─────────────────────────────────────

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