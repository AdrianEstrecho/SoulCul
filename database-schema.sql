/*
Estrecho, Adrian M.
Mansilla, Rhangel R.
Romualdo, Jervin Paul C.
Sostea, Joana Marie A.
Torres, Ceazarion Sean Nicholas M.
Tupaen, Arianne Kaye E.

BSIT/IT22S1
*/

-- SouCul Database Schema
-- Run this in phpMyAdmin or MySQL CLI after creating the 'soucul' database

-- Users (customers)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  birthday DATE,
  gender VARCHAR(30),
  profile_image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  requested_ip VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_resets_user (user_id),
  INDEX idx_password_resets_expires (expires_at),
  INDEX idx_password_resets_used (used_at)
);

-- Admins (shop owners)
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(155) NOT NULL,
  phone VARCHAR(20),
  role ENUM('super_admin', 'shop_owner', 'inventory_manager') DEFAULT 'shop_owner',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Locations (regions)
CREATE TABLE IF NOT EXISTS locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  featured_image_url VARCHAR(500),
  region VARCHAR(100),
  province VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  featured_image_url VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  material VARCHAR(120) NOT NULL DEFAULT 'Locally sourced',
  sku VARCHAR(100),
  location_id INT NOT NULL,
  category_id INT NOT NULL,
  admin_id INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  quantity_in_stock INT NOT NULL DEFAULT 0,
  featured_image_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating_average DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (admin_id) REFERENCES admins(id),
  INDEX idx_location_category (location_id, category_id)
);

-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  display_order INT DEFAULT 0,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
);

-- Shopping Cart
CREATE TABLE IF NOT EXISTS cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  status ENUM(
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
  ) DEFAULT 'cash_on_delivery_requested',
  subtotal DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  
  shipping_address VARCHAR(500) NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_province VARCHAR(100) NOT NULL,
  shipping_phone VARCHAR(20),
  
  customer_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_status (user_id, status)
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_id (order_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL UNIQUE,
  payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'gcash', 'cod') NOT NULL,
  payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payment_status (payment_status)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity),
  INDEX idx_created_at (created_at)
);

-- Customer Notifications
CREATE TABLE IF NOT EXISTS customer_notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  meta_json JSON DEFAULT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_customer_notifications_user (user_id),
  INDEX idx_customer_notifications_unread (user_id, is_read),
  INDEX idx_customer_notifications_created (created_at)
);

-- Admin Notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  meta_json JSON DEFAULT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_admin_notifications_admin (admin_id),
  INDEX idx_admin_notifications_unread (admin_id, is_read),
  INDEX idx_admin_notifications_created (created_at)
);

-- Customer Notification Settings
CREATE TABLE IF NOT EXISTS customer_notification_settings (
  user_id INT PRIMARY KEY,
  order_updates BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT true,
  wishlist_alerts BOOLEAN DEFAULT false,
  newsletter BOOLEAN DEFAULT false,
  sms_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  label VARCHAR(50) NOT NULL DEFAULT 'Home',
  address_line VARCHAR(500) NOT NULL,
  city VARCHAR(120) NOT NULL,
  province VARCHAR(120) NOT NULL,
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_customer_addresses_user (user_id),
  INDEX idx_customer_addresses_default (user_id, is_default)
);

-- Customer Wishlist
CREATE TABLE IF NOT EXISTS customer_wishlist (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_customer_wishlist (user_id, product_id),
  INDEX idx_customer_wishlist_user_created (user_id, created_at)
);

-- Customer Payment Methods
CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
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

-- Customer Security Settings
CREATE TABLE IF NOT EXISTS customer_security_settings (
  user_id INT PRIMARY KEY,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_method ENUM('sms', 'app') NOT NULL DEFAULT 'sms',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Customer Linked Accounts
CREATE TABLE IF NOT EXISTS customer_linked_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  provider VARCHAR(40) NOT NULL,
  account_label VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_customer_linked_provider (user_id, provider),
  INDEX idx_customer_linked_accounts_user (user_id, is_active)
);

-- Customer Reviews
CREATE TABLE IF NOT EXISTS customer_reviews (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
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
