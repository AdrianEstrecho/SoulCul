@echo off
REM ================================================================
REM SouCul Backend Setup Script
REM Organizes backend files and sets up the development environment
REM ================================================================

echo ================================
echo SouCul Backend Setup
echo ================================
echo.

REM Change to project root if running from scripts folder
if exist "..\backend" (
    cd ..
)

echo [1/6] Organizing backend directory structure...
echo.

REM Run the cleanup script to organize files
if exist "cleanup-backend.cjs" (
    node cleanup-backend.cjs
    if errorlevel 1 (
        echo Error organizing backend structure!
        pause
        exit /b 1
    )
) else (
    echo Warning: cleanup-backend.cjs not found, skipping organization...
)
echo.

echo [2/6] Setting up environment configuration...
cd backend

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" > nul
        echo ✓ .env file created from .env.example
        echo.
        echo IMPORTANT: Edit backend\.env with your database credentials!
        echo.
        echo Default configuration:
        echo   DB_HOST=127.0.0.1
        echo   DB_PORT=3306
        echo   DB_DATABASE=soucul
        echo   DB_USERNAME=root (or soucul_dev)
        echo   DB_PASSWORD=(your MySQL password)
        echo.
        echo Press any key when you've updated the .env file...
        pause > nul
    ) else (
        echo Error: .env.example not found!
        pause
        exit /b 1
    )
) else (
    echo ✓ .env file already exists
)
echo.

echo [3/6] Installing PHP dependencies...
echo This may take a few minutes...
echo.

if not exist "composer.json" (
    echo Error: composer.json not found!
    echo Make sure you're in the backend directory.
    pause
    exit /b 1
)

composer install
if errorlevel 1 (
    echo.
    echo ╔════════════════════════════════════════╗
    echo ║  Error: Composer install failed!       ║
    echo ╚════════════════════════════════════════╝
    echo.
    echo Make sure Composer is installed: https://getcomposer.org/
    echo.
    pause
    exit /b 1
)
echo.
echo ✓ Dependencies installed successfully!
echo.

echo [4/6] Updating Composer autoload...
composer dump-autoload
echo.

echo [5/6] Checking database requirements...
echo.
echo Database Checklist:
echo   [ ] MySQL is running (XAMPP or standalone)
echo   [ ] Database 'soucul' is created
echo   [ ] Database schema is imported (database-schema.sql)
echo.

choice /C YN /M "Have you completed the database setup"
if errorlevel 2 (
    echo.
    echo Please complete database setup:
    echo.
    echo 1. Start MySQL (XAMPP Control Panel or mysql service)
    echo 2. Open phpMyAdmin: http://localhost/phpmyadmin
    echo 3. Create database: soucul
    echo 4. Import: backend\database-schema.sql
    echo.
    echo After completing these steps, run this script again.
    pause
    exit /b 0
)
echo.

echo [6/6] Seeding database with sample data...
echo.

choice /C YN /M "Do you want to seed the database with sample data"
if errorlevel 1 (
    if exist "seed.php" (
        php seed.php
        if errorlevel 1 (
            echo Warning: Database seeding encountered errors
        ) else (
            echo.
            echo ✓ Sample data created successfully!
        )
    ) else (
        echo Warning: seed.php not found
    )
)
echo.

REM Return to project root
cd ..

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║            Backend Setup Complete! 🎉                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Backend Structure:
echo   backend/
echo   ├── admin/          # Admin API
echo   ├── customer/       # Customer API
echo   ├── shared/         # Shared resources
echo   └── storage/        # Logs and uploads
echo.
echo ================================
echo Next Steps:
echo ================================
echo.
echo 1. Start the Admin API server:
echo    cd backend
echo    php -S localhost:8000 admin/public/index.php
echo.
echo 2. Test the API:
echo    curl http://localhost:8000/health
echo.
echo 3. Login to admin panel:
echo    URL: http://localhost:5173/admin.html (or your frontend URL)
echo    Email: admin@soucul.com
echo    Password: admin123
echo.
echo ⚠️  IMPORTANT: Change the default admin password in production!
echo.
echo ================================
echo Documentation:
echo ================================
echo   • QUICKSTART.md - Quick setup guide
echo   • BACKEND_ORGANIZED.md - Structure overview
echo   • backend/README.md - Backend documentation
echo   • guides/BACKEND_GUIDE.md - Complete API reference
echo.
echo ================================
echo Troubleshooting:
echo ================================
echo   Database errors? Run: node scripts/test-db-connection.js
echo   Need help? Check: BACKEND_IMPLEMENTATION.md
echo.
pause
