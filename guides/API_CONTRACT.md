# SoulCul API Contract (Beginner Friendly)

This file tells both backend developers how APIs should look and behave.

Important stack rule:

1. API implementation is PHP
2. Database is MySQL
3. Contract examples assume PHP + MySQL behavior

## 1. Quick Rules

1. All routes use /api/v1/...
2. Customer endpoints go under /api/v1/customer/*
3. Admin/shop owner endpoints go under /api/v1/admin/*
4. Every response uses the same JSON format
5. Do not change response field names without team agreement

## 2. Ownership (Two Backend Devs)

1. Customer backend dev owns customer routes
2. Admin backend dev owns admin/shop owner routes
3. Shared changes (auth, common models, migrations) need review from both

## 3. Base URLs

Local:

- http://localhost:8000

Production:

- https://api.soulcul.com

Frontend env var in Vercel:

- VITE_API_BASE_URL=https://api.soulcul.com

## 4. Standard Response Format

Every endpoint should return this shape:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {}
}
```

Required fields:

1. success (boolean)
2. message (string)
3. data (object, array, or null)

meta is optional.

## 5. Standard Error Format

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

## 6. Status Codes To Use

1. 200 = success (read/update)
2. 201 = created
3. 204 = deleted with no body
4. 400 = bad request
5. 401 = not logged in / invalid token
6. 403 = logged in but no permission
7. 404 = not found
8. 409 = conflict (duplicate/state conflict)
9. 422 = validation error
10. 500 = server error

## 7. Auth Rules

1. Use Authorization header with Bearer token
2. Customer and admin login are separate endpoints
3. Protected routes must verify token and role
4. Never return password hashes or sensitive secrets

## 8. Data Naming Rules

1. Use snake_case in JSON and database fields
2. Use ISO 8601 UTC timestamps (example: 2026-03-31T14:20:00Z)
3. IDs are integers unless the team moves to UUIDs

## 9. Pagination Rules (For List APIs)

Query params:

1. page (default 1)
2. per_page (default 20, max 100)
3. sort
4. order (asc or desc)

Pagination in response meta:

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

## 10. Starter Endpoints

Public:

1. GET /health

Customer track:

1. POST /api/v1/customer/auth/register
2. POST /api/v1/customer/auth/login
3. GET /api/v1/customer/profile
4. GET /api/v1/customer/cart
5. POST /api/v1/customer/cart/items
6. POST /api/v1/customer/checkout
7. GET /api/v1/customer/orders

Admin/shop owner track:

1. POST /api/v1/admin/auth/login
2. GET /api/v1/admin/profile
3. GET /api/v1/admin/products
4. POST /api/v1/admin/products
5. PATCH /api/v1/admin/products/{id}
6. PATCH /api/v1/admin/products/{id}/inventory
7. GET /api/v1/admin/orders
8. PATCH /api/v1/admin/orders/{id}/status

## 11. Sample Request and Response

Create product request:

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

Success response:

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

## 12. Database Change Rules

1. Shared schema changes need both backend devs to review
2. Avoid breaking existing frontend fields without a transition plan
3. Keep migrations safe and reversible when possible

## 13. Breaking Changes and Versioning

1. Current version is /api/v1
2. If breaking change is needed, discuss first and either:
- add a new endpoint
- or move to /api/v2
3. Update this file before merging breaking changes

## 14. Change Log

- 2026-03-31: Beginner-friendly API contract version created
