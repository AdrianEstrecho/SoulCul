# SouCul - Regional Filipino Souvenirs E-commerce

A full-stack e-commerce platform showcasing Filipino regional products and delicacies.

## 🏗️ Project Structure

```
SouCul/
├── src/                  # Frontend React components
├── public/               # Frontend static assets
├── index.html            # Frontend entry point
├── package.json          # Frontend dependencies
├── vite.config.js        # Vite configuration
├── backend/              # PHP REST API
│   ├── public/           # API entry point
│   ├── src/              # Application code
│   └── composer.json     # Backend dependencies
├── scripts/              # Utility scripts
│   ├── test-db-connection.js
│   └── diagnose-db.js
├── guides/               # Documentation
│   └── BACKEND_GUIDE.md  # Complete backend setup
└── .env                  # Database configuration
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

### Backend Setup (PHP + MySQL)

```bash
cd backend
composer install
copy .env.example .env
# Edit .env with your database credentials
php -S localhost:8000 -t public
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

- Frontend Developer
- Backend Developer (Customer API)
- Backend Developer (Admin API)

## 📝 License

Proprietary - SouCul Team / Technological Institute of the Philippines, CCS
