# SouCul Hostinger Premium Deployment (Frontend + Backend)

This guide is prepared for the current SouCul repository structure.

## 1) Target Production Topology

- Main frontend: `https://yourdomain.com`
- Admin API: `https://api-admin.yourdomain.com`
- Customer API: `https://api-customer.yourdomain.com`

## 2) Hostinger hPanel Setup

1. Add/connect your main domain.
2. Create subdomains:
   - `api-admin.yourdomain.com`
   - `api-customer.yourdomain.com`
3. Enable SSL for all three hosts.

## 3) Build Frontend Locally

Run from project root:

```bash
npm install
npm run build
```

This creates `dist/`.

## 4) Upload Frontend Files

Upload the **contents** of `dist/` into the main domain `public_html`.

Important files included from this repo setup:
- `runtime-config.js`
- `admin.html`
- `admin.js`
- `admin-api.js`
- `customer-api.js`

## 5) Set Runtime API URLs (No Rebuild Needed)

After upload, edit this file on the server:

- `public_html/runtime-config.js`

Set values:

```javascript
window.__SOUCUL_CONFIG__ = window.__SOUCUL_CONFIG__ || {};
window.__SOUCUL_CONFIG__.adminApiBaseUrl = "https://api-admin.yourdomain.com";
window.__SOUCUL_CONFIG__.customerApiBaseUrl = "https://api-customer.yourdomain.com";
```

## 6) Upload Backend Code

Upload the repository `backend/` folder to your Hostinger files.

Required backend runtime directories:
- `backend/admin/public`
- `backend/customer/public`
- `backend/shared`
- `backend/vendor`

If `vendor/` is not uploaded, run Composer on server SSH inside `backend/`:

```bash
composer install --no-dev --optimize-autoloader
```

## 7) Point Subdomain Document Roots

Configure document roots:

- `api-admin.yourdomain.com` -> `backend/admin/public`
- `api-customer.yourdomain.com` -> `backend/customer/public`

## 8) Database Setup

1. Create MySQL database and user in Hostinger.
2. Import SQL files in order:
   - `backend/database-schema.sql`
   - `backend/migration.sql`

## 9) Set Backend Environment Variables

This project reads DB/JWT values from environment variables via `getenv()`.

Add these in both files:
- `backend/admin/public/.htaccess`
- `backend/customer/public/.htaccess`

```apache
SetEnv DB_HOST localhost
SetEnv DB_PORT 3306
SetEnv DB_NAME your_database_name
SetEnv DB_USER your_database_user
SetEnv DB_PASS your_database_password
SetEnv JWT_SECRET replace_with_long_random_secret
SetEnv JWT_EXPIRY_SECONDS 28800
```

## 10) Write Permissions

Ensure writable paths:

- `backend/admin/public/uploads/products`
- `backend/storage/logs`

## 11) Frontend Routing on Hostinger

This repo now includes `public/.htaccess` for SPA fallback.

If your routes show 404 when reloading deep links, verify this file exists in `public_html/.htaccess`.

## 12) Verification Checklist

Check these URLs:

- `https://api-admin.yourdomain.com/health`
- `https://api-customer.yourdomain.com/health`
- `https://yourdomain.com`
- `https://yourdomain.com/admin.html`

Then test:

1. Admin login
2. Product listing
3. Customer products
4. Product image upload

## 13) Common Hostinger Notes

- Keep `backend/admin/public/.htaccess` and `backend/customer/public/.htaccess` deployed.
- Use SSL URLs in `runtime-config.js`.
- Do not expose `.env` files in web root.

## 14) Troubleshooting: "Cannot read properties of null (reading 'token')"

If admin login shows this error in production:

1. Hard refresh the page (`Ctrl+F5`) to clear cached scripts.
2. Confirm `public_html/runtime-config.js` has valid URLs:

```javascript
window.__SOUCUL_CONFIG__.adminApiBaseUrl = "https://api-admin.yourdomain.com";
window.__SOUCUL_CONFIG__.customerApiBaseUrl = "https://api-customer.yourdomain.com";
```

3. Open `https://api-admin.yourdomain.com/health` and verify it returns JSON.
4. Open browser DevTools Network tab and ensure login calls hit `api-admin` host, not the main frontend host.
5. Temporarily disable browser extensions (or test in Incognito) if console shows extension script errors (for example `chrome-extension://...`).

This error usually means the frontend expected JSON login data but received HTML or stale JS from cache.
