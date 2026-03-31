# SoulCul Backend Setup Guide (Beginner Friendly)

This guide is for new backend developers. Follow the steps in order.

Important stack rule:

1. Backend language is PHP
2. Database is MySQL

Goal:

1. Run PHP + MySQL locally
2. Build APIs for the project
3. Prepare for deployment to Hostinger (backend) and Vercel (frontend)

## 1. What You Need

Install these tools first:

1. PHP 8.2 or newer
2. MySQL 8.0 or newer
3. Composer 2.x
4. Git
5. Postman or Insomnia (for API testing)

Fastest option on Windows:

1. Install XAMPP (includes PHP + MySQL)
2. Install Composer separately

## 2. Check If Tools Are Working

Open PowerShell and run:

```powershell
php -v
composer -V
mysql --version
git --version
```

If each command shows a version, you are ready.

## 3. Create Backend Folder

From the project root:

```powershell
mkdir backend
cd backend
```

Use this starter structure:

```text
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

## 4. Initialize Composer

Run:

```powershell
composer init
composer require vlucas/phpdotenv
```

Optional but useful later:

```powershell
composer require nikic/fast-route monolog/monolog
```

## 5. Add Environment File

Create .env.example inside backend:

```env
APP_NAME=SoulCul API
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=soulcul
DB_USERNAME=root
DB_PASSWORD=
```

Copy it:

```powershell
Copy-Item .env.example .env
```

## 6. Create Local Database

Run this in MySQL:

```sql
CREATE DATABASE soulcul CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 7. Start Local API Server

From backend folder:

```powershell
php -S localhost:8000 -t public
```

Test in browser:

- http://localhost:8000

## 8. Connect Frontend to Backend (Local)

Frontend runs on Vite (usually http://localhost:5173).

Use backend base URL:

- http://localhost:8000/api/...

Do not hardcode localhost in many files. Use one config value when possible.

## 9. Work Split for Two Backend Devs

You are split into two tracks:

1. Customer backend developer
2. Admin/Shop owner backend developer

Ownership:

1. Customer routes: /api/v1/customer/*
2. Admin routes: /api/v1/admin/*

Shared files (both must review):

1. src/Config/*
2. Auth middleware
3. Shared models (users/products/orders)
4. Database migrations

Branch naming:

1. feature/customer-*
2. feature/admin-*
3. feature/core-*

## 10. First Tasks (Simple Starter)

Do these first before full features:

1. Create public/index.php
2. Create GET /health endpoint
3. Load .env file
4. Create DB connection helper
5. Add first auth endpoint for each track

## 11. Hosting Plan (Production)

Your planned hosting setup:

1. Frontend (React/Vite): Vercel
2. Backend (PHP API): Hostinger
3. Database (MySQL): Hostinger

Suggested domains:

1. Frontend: https://soulcul.com
2. Backend API: https://api.soulcul.com

## 12. Deploy Backend to Hostinger (Basic Steps)

In Hostinger hPanel:

1. Create subdomain api.soulcul.com
2. Create MySQL database + user
3. Upload backend files
4. Set document root to backend/public
5. Add production .env values
6. Test https://api.soulcul.com/health

Production .env sample:

```env
APP_NAME=SoulCul API
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.soulcul.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=hostinger_db_name
DB_USERNAME=hostinger_db_user
DB_PASSWORD=strong_password_here
```

## 13. Deploy Frontend to Vercel (Basic Steps)

1. Import GitHub repo into Vercel
2. Use Vite preset
3. Build command: npm run build
4. Output folder: dist
5. Add env var: VITE_API_BASE_URL=https://api.soulcul.com
6. Redeploy

## 14. Common Setup Problems

1. php not recognized
- Add PHP to PATH or use XAMPP shell

2. MySQL connection failed
- Check MySQL service is running
- Check DB values in .env

3. Port already used
- Run: php -S localhost:8001 -t public

4. CORS error from frontend
- Allow your frontend domain in backend CORS config

## 15. Done Checklist

Before coding features, confirm all are true:

1. PHP, MySQL, Composer are installed
2. backend folder exists
3. .env is set
4. soulcul database exists
5. local API server runs
6. /health endpoint works
7. frontend can call backend locally

## 16. Must-Read Next File

After this setup guide, read:

- API_CONTRACT.md

It defines request/response format, status codes, and route ownership for both backend developers.
