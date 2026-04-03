# SouCul Backend - Quick Setup Guide

## Prerequisites
- PHP 8.2+
- Composer
- MySQL 8.0+ (via XAMPP or standalone)
- Node.js (for running setup scripts)

## Quick Start

### 1. Create Directory Structure
```bash
node create-backend-structure.js
```

### 2. Set Up Environment
```bash
cd backend
copy .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=soucul
DB_USERNAME=soucul_dev
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
```

### 3. Install Dependencies
```bash
composer install
```

### 4. Set Up Database

#### Option A: Using phpMyAdmin (XAMPP)
1. Start XAMPP MySQL
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create database: `soucul`
4. Run the SQL schema from `guides/BACKEND_GUIDE.md` (Part 2.2)

#### Option B: Using MySQL CLI
```bash
mysql -u root -p < database-schema.sql
```

### 5. Seed Database with Sample Data
```bash
php seed.php
```

This will create:
- 5 locations (Vigan, Baguio, Boracay, Tagaytay, Bohol)
- 5 categories (Clothes, Decorations, Delicacies, Handicrafts, Homeware)
- Default admin account (email: admin@soucul.com, password: admin123)
- 11 sample products
- 3 test users

**⚠️ IMPORTANT:** Change the default admin password in production!

### 6. Start Backend Server
```bash
php -S localhost:8000 index.php
```

The API will be available at: `http://localhost:8000`

### 7. Test the API

#### Health Check
```bash
curl http://localhost:8000/health
```

#### Admin Login
```bash
curl -X POST http://localhost:8000/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@soucul.com\",\"password\":\"admin123\"}"
```

Save the returned `token` for authenticated requests.

#### Get Products (Protected)
```bash
curl -X GET http://localhost:8000/api/v1/admin/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## API Endpoints

### Public
- `POST /api/v1/admin/auth/login` - Admin login

### Protected (require Bearer token)
- `GET /api/v1/admin/profile` - Get admin profile
- `GET /api/v1/admin/dashboard/stats` - Dashboard statistics
- `GET /api/v1/admin/products` - List products
- `POST /api/v1/admin/products` - Create product
- `PATCH /api/v1/admin/products/:id` - Update product
- `PATCH /api/v1/admin/products/:id/inventory` - Update inventory
- `GET /api/v1/admin/orders` - List orders
- `GET /api/v1/admin/orders/:id` - Order details
- `PATCH /api/v1/admin/orders/:id/status` - Update order status
- `GET /api/v1/admin/users` - List users
- `PATCH /api/v1/admin/users/:id/toggle` - Toggle user status
- `GET /api/v1/admin/admins` - List admins
- `POST /api/v1/admin/admins` - Create admin (super admin only)
- `PATCH /api/v1/admin/admins/:id/toggle` - Toggle admin status

## Integrating with Admin Panel

Update `public/admin.js` to use the backend API instead of local state.

Example login function:
```javascript
async function doLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      localStorage.setItem('admin_token', result.data.token);
      localStorage.setItem('admin_user', JSON.stringify(result.data.admin));
      // Redirect to dashboard
      window.location.reload();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed');
  }
}
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running (XAMPP Control Panel)
- Check `.env` credentials match your MySQL setup
- Run `node scripts/test-db-connection.js` from project root

### Composer Not Found
- Install Composer from https://getcomposer.org/

### PHP Version Issues
- Verify PHP version: `php -v`
- Update to PHP 8.2+ if needed

### CORS Errors
- Backend already includes CORS headers
- For production, update allowed origins in `index.php`

## File Structure

```
backend/
├── index.php              # Main entry point & routing
├── Database.php           # Database connection
├── AuthMiddleware.php     # JWT authentication
├── AuthController.php     # Login & profile
├── ProductController.php  # Product management
├── OrderController.php    # Order management
├── UserController.php     # User management
├── AdminController.php    # Admin & dashboard
├── seed.php              # Database seeding
├── composer.json         # PHP dependencies
├── .env.example          # Environment template
└── .env                  # Your configuration (not in git)
```

## Next Steps

1. ✅ Backend is running
2. Update `public/admin.js` to call API endpoints
3. Test all admin panel features
4. Add proper error handling
5. Implement file upload for product images
6. Add logging for admin actions
7. Set up production deployment

## Security Notes

- Change default admin password immediately
- Use strong JWT_SECRET in production
- Enable HTTPS in production
- Implement rate limiting for login endpoints
- Never commit `.env` file
- Validate and sanitize all inputs

## Support

Refer to `guides/BACKEND_GUIDE.md` for complete documentation.
