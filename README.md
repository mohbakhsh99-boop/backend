# Cafe POS Backend

Node.js + Express backend for the cafe POS graduation project. Includes JWT authentication, Postgres schema, and REST endpoints for menu, orders, management, uploads, and reports.

## Folder structure
- `src/app.js` – Express app bootstrap and middleware
- `src/db.js` – PostgreSQL pool helper
- `src/controllers/` – Route handlers (auth, menu, orders, tables, users, reports, uploads)
- `src/routes/` – Route definitions mounted under `/api`
- `src/middleware/` – Auth and upload middleware
- `uploads/` – Local storage for uploaded images
- `schema.sql` – Database schema for Postgres
- `.env.example` – Sample environment configuration

## Database schema / SQL
See [`schema.sql`](schema.sql) for PostgreSQL DDL covering users, categories, products, product_extras, tables, orders, and order_items.

## Express routes
- `/api/auth` – register, login, refresh, me, update profile
- `/api/categories` – list categories
- `/api/products` – list products / get product / admin create-update-delete
- `/api/orders` – place order (auth)
- `/api/orders/my-history` – customer history
- `/api/orders/:id` – order detail
- `/api/orders/active` – staff active orders
- `/api/orders/:id/status` – staff update status
- `/api/orders/:id/rating` – customer rating
- `/api/tables` – staff list tables
- `/api/tables/:id` – staff update table status
- `/api/users` – admin list/create/update users
- `/api/reports/*` – admin dashboard, revenue, products, staff
- `/api/upload` – authenticated image upload

## Authentication flow
- Passwords hashed with `bcryptjs`
- JWT access tokens (15m by default) and refresh tokens (7d) are issued
- Refresh token stored in httpOnly cookie; `/api/auth/refresh` issues new access token
- `authMiddleware` validates access tokens; `roleMiddleware` gates admin/staff-only routes

## Image handling
- Multipart upload via `/api/upload`
- JPG/PNG only, max 2MB
- Saved under `uploads/` and served from `/uploads/*`; API returns public URL to store in DB

## Reports
- Dashboard: today’s revenue, active orders
- Revenue: aggregates by day/month/year via `group_by`
- Products: most ordered products between dates
- Staff: performance grouped by cashier

## Example .env
See `.env.example` for required keys: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, token TTLS, and upload settings.

## Run locally
1. Install Node.js 18+
2. Create a Postgres database and apply `schema.sql`
3. Copy `.env.example` to `.env` and set values (database URL, secrets)
4. `npm install`
5. `npm run dev`
6. API served at `http://localhost:4000`

