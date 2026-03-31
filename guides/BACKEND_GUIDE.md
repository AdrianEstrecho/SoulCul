# SoulCul Backend Development Guide

Complete sequential guide from setup to API deployment. Follow in order.

## Stack
- **Language:** PHP 8.2+
- **Database:** MySQL 8.0+
- **Package Manager:** Composer 2.x
- **Local Server:** PHP built-in server or XAMPP
- **Deployment:** Hostinger (backend), Vercel (frontend)

---

## Part 1: Environment Setup

### 1.1 Install Required Tools

```powershell
# Verify installations
php -v
composer -V
mysql --version
git --version
```

**Windows Quick Start:** Install XAMPP (includes PHP + MySQL), then install Composer separately.

### 1.2 Create Backend Folder

```powershell
mkdir backend
cd backend
```

### 1.3 Folder Structure

```
backend/
  public/
    index.php
  src/
    Config/
    Controllers/
    Services/
    Routes/
  storage/
    logs/
  .env
  .env.example
  composer.json
```

### 1.4 Initialize Composer

```powershell
composer init
composer require vlucas/phpdotenv nikic/fast-route monolog/monolog
```

### 1.5 Environment Variables

Create `.env.example`:

```env
APP_NAME=SoulCul API
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=soulcul
DB_USERNAME=soulcul_user
DB_PASSWORD=your_secure_password

JWT_SECRET=your_jwt_secret_key_here
```

Copy to `.env` and customize values. **Never commit .env to git.**

---

## Part 2: Database Setup

### 2.1 Create Database and User

Connect to MySQL and run:

```sql
CREATE DATABASE IF NOT EXISTS soulcul CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE soulcul;

CREATE USER 'soulcul_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON soulcul.* TO 'soulcul_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2.2 Create Tables

```sql
-- Users (customers)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  profile_image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Admins (shop owners)
CREATE TABLE admins (
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
CREATE TABLE locations (
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
CREATE TABLE categories (
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
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  sku VARCHAR(100),
  location_id INT NOT NULL,
  category_id INT NOT NULL,
  admin_id INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  quantity_in_stock INT NOT NULL DEFAULT 0,
  featured_image_url VARCHAR(500),
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
CREATE TABLE product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  display_order INT DEFAULT 0,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
);

-- Shopping Cart
CREATE TABLE cart_items (
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
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
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
CREATE TABLE order_items (
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
CREATE TABLE payments (
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
```

### 2.3 Seed Default Data

```sql
-- Add locations
INSERT INTO locations (name, slug, region, province, is_active, display_order) VALUES
('Vigan', 'vigan', 'Ilocos Region', 'Ilocos Sur', true, 1),
('Baguio', 'baguio', 'Cordillera Administrative Region', 'Benguet', true, 2),
('Boracay', 'boracay', 'Western Visayas', 'Aklan', true, 3),
('Tagaytay', 'tagaytay', 'Calabarzon', 'Cavite', true, 4),
('Bohol', 'bohol', 'Central Visayas', 'Bohol', true, 5);

-- Add categories
INSERT INTO categories (name, slug, display_order, is_active) VALUES
('Clothes', 'clothes', 1, true),
('Decorations', 'decorations', 2, true),
('Delicacies', 'delicacies', 3, true),
('Handicrafts', 'handicrafts', 4, true),
('Homeware', 'homeware', 5, true);
```

### 2.4 Backup & Restore

```bash
# Backup
mysqldump -u soulcul_user -p soulcul > soulcul_backup_$(date +%Y%m%d).sql

# Restore
mysql -u soulcul_user -p soulcul < soulcul_backup_20260331.sql
```

---

## Part 3: API Contract

All endpoints must follow this contract. Both backend developers must review changes.

### 3.1 Core Rules

1. All routes use `/api/v1/...`
2. Customer endpoints: `/api/v1/customer/*`
3. Admin endpoints: `/api/v1/admin/*`
4. Every response uses standard JSON format
5. Use `snake_case` for all field names
6. Use ISO 8601 UTC timestamps: `2026-03-31T14:20:00Z`

### 3.2 Standard Response Format

**Success (200, 201):**

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {}
}
```

**Error (4xx, 5xx):**

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "meta": {
    "errors": {
      "email": ["Email is required"]
    }
  }
}
```

### 3.3 HTTP Status Codes

| Code | Use Case |
|------|----------|
| 200 | Successful read/update |
| 201 | Resource created |
| 204 | Deleted (no body) |
| 400 | Bad request |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 422 | Validation error |
| 500 | Server error |

### 3.4 Authentication

- Use `Authorization: Bearer <token>` header
- Customer and admin login are separate endpoints
- Protect routes by verifying token and role
- Never return password hashes

### 3.5 Pagination

Query params: `page` (default 1), `per_page` (default 20, max 100), `sort`, `order` (asc/desc)

Response meta:

```json
{
  "meta": {
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 130,
      "total_pages": 7
    }
  }
}
```

### 3.6 Customer Endpoints (Public API)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/api/v1/customer/auth/register` | Register new customer |
| POST | `/api/v1/customer/auth/login` | Login customer |
| GET | `/api/v1/customer/profile` | Get profile (protected) |
| GET | `/api/v1/customer/cart` | Get cart (protected) |
| POST | `/api/v1/customer/cart/items` | Add to cart (protected) |
| POST | `/api/v1/customer/checkout` | Create order (protected) |
| GET | `/api/v1/customer/orders` | Get orders (protected) |

### 3.7 Admin Endpoints (Admin API)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/admin/auth/login` | Admin login |
| GET | `/api/v1/admin/profile` | Get admin profile (protected) |
| GET | `/api/v1/admin/products` | List products (protected) |
| POST | `/api/v1/admin/products` | Create product (protected) |
| PATCH | `/api/v1/admin/products/{id}` | Update product (protected) |
| PATCH | `/api/v1/admin/products/{id}/inventory` | Update inventory (protected) |
| GET | `/api/v1/admin/orders` | List orders (protected) |
| PATCH | `/api/v1/admin/orders/{id}/status` | Update order status (protected) |

### 3.8 Sample Request & Response

**Create Product Request:**

```json
{
  "name": "Handwoven Basket",
  "description": "Made by local artisans",
  "price": 799.0,
  "stock": 25,
  "category": "handicrafts",
  "region": "vigan"
}
```

**Create Product Response:**

```json
{
  "success": true,
  "message": "Product created",
  "data": {
    "id": 101,
    "name": "Handwoven Basket",
    "price": 799.0,
    "stock": 25
  },
  "meta": {}
}
```

### 3.9 Breaking Changes

- Current version: `/api/v1`
- If breaking change needed: discuss first, then either:
  - Create new endpoint
  - Move to `/api/v2`
- Update this guide before merging

---

## Part 4: Development Workflow

### 4.1 Local Development

```powershell
cd backend
php -S localhost:8000 public/index.php
```

Access at `http://localhost:8000`

### 4.2 Testing

1. Use Postman or Insomnia for API testing
2. Test all endpoints before committing
3. Include sample requests in code comments

### 4.3 Team Responsibilities

- **Customer Backend Dev:** Customer routes (`/api/v1/customer/*`)
- **Admin Backend Dev:** Admin routes (`/api/v1/admin/*`)
- **Shared:** Auth, models, migrations (both review)

### 4.4 Database Changes

1. Shared schema changes need both devs' review
2. Keep migrations reversible
3. Avoid breaking frontend fields without transition plan

---

## Database Relationships

```
users → cart_items, orders
admins → products
products → product_images, cart_items, order_items
products ← locations, categories
orders → order_items, payments
```

---

## Deployment Checklist

- [ ] All environment variables set in production
- [ ] Database backed up
- [ ] Composer dependencies installed
- [ ] .env not committed to git
- [ ] API tested against frontend in staging
- [ ] SSL certificate configured
- [ ] Database user has minimal required permissions
- [ ] Rate limiting configured for auth endpoints
