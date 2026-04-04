# SouCul - Regional Filipino Souvenirs E-commerce

A full-stack e-commerce platform showcasing Filipino regional products and delicacies.

## 🏗️ Project Structure

```
SouCul/
├── src/                       # Frontend React application
│   ├── Components/           # Reusable React components
│   │   ├── AboutUs.jsx
│   │   ├── Categories.jsx
│   │   ├── Footer.jsx
│   │   ├── Hero.jsx
│   │   ├── HomePin.jsx
│   │   ├── LandingPage.jsx
│   │   ├── Navbar.jsx
│   │   └── Products.jsx
│   ├── StyleSheet/          # Component-specific styles
│   ├── assets/              # Images and media files
│   ├── Baguio/              # Region-specific pages
│   ├── Bohol/
│   ├── Boracay/
│   ├── Tagaytay/
│   ├── Vigan/
│   ├── Cart.jsx             # Shopping cart page
│   ├── Checkout.jsx         # Checkout page
│   ├── Login.jsx            # Authentication page
│   ├── ProductPage.jsx      # Product details page
│   ├── Profile.jsx          # User profile page
│   ├── SoulCul.jsx          # Main app component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── public/                   # Static assets
│   ├── assets/              # Public images
│   ├── admin.html           # Admin panel
│   ├── admin.js             # Admin functionality
│   └── admin.css            # Admin styles
├── backend/                  # PHP REST API (to be implemented)
├── scripts/                  # Development utilities
│   ├── test-db-connection.js
│   ├── diagnose-db.js
│   ├── run-db-test.bat
│   ├── setup-backend.bat
│   └── README.md
├── guides/                   # Documentation
│   └── BACKEND_GUIDE.md     # Complete backend setup
├── index.html               # Frontend entry point
├── package.json             # Frontend dependencies
├── eslint.config.js         # ESLint configuration
├── vite.config.js           # Vite configuration
└── .env                     # Database configuration
```

**Note:** Frontend stays in root for easy Vercel deployment. Backend has its own folder.

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Create backend folder structure
.\restructure.bat

# 2. Set up backend configuration files
.\setup-backend.bat
```

### Frontend Setup (React + Vite)

Frontend files are in the root directory.

```bash
npm install
npm run dev
```

Access at: `http://localhost:5173`

If you are using the admin panel, run the backend API in a second terminal:

```bash
npm run dev:api
```

Or run both frontend + backend together:

```bash
npm run dev:all
```

The Vite proxy defaults to `http://127.0.0.1:8000`.
You can override it with `VITE_ADMIN_PROXY_TARGET` in your `.env`.

### Backend Setup (PHP + MySQL)

```bash
cd backend
composer install
copy .env.example .env
# Edit .env with your database credentials
php -S 127.0.0.1:8000 -t admin/public admin/public/index.php
```

Access at: `http://localhost:8000`

**Complete backend setup guide:** [guides/BACKEND_GUIDE.md](./guides/BACKEND_GUIDE.md)

## 🗄️ Database Setup

1. **Start XAMPP MySQL** (port 3307 or 3306)

2. **Test connection:**
   ```bash
   node scripts/test-db-connection.js
   ```

3. **Diagnose issues:**
   ```bash
   node scripts/diagnose-db.js
   ```

See [BACKEND_GUIDE.md](./guides/BACKEND_GUIDE.md) for detailed database setup instructions.

## 📚 Documentation

- **[BACKEND_GUIDE.md](./guides/BACKEND_GUIDE.md)** - Complete backend development guide
  - Environment setup
  - Database schema
  - API contract
  - Testing & deployment

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite 8
- React Router DOM

**Backend:**
- PHP 8.2+
- MySQL 8.0+
- Composer

**Deployment:**
- Frontend: Vercel
- Backend: Hostinger

## 👥 Team

- Frontend Developers | @AdrianEstrecho & @yashiro-nyx
- Backend Developer (Customer API) | @RubinusSorro
- Backend Developer (Admin API) | @Vaelarr

## 📝 License

Proprietary - SouCul Team / Technological Institute of the Philippines, CCS
