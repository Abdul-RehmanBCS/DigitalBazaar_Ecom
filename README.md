# DigitalBazaar_Ecom

Full-stack digital products marketplace — **Digital Bazaar** (React + Node + MongoDB).

Modern full-stack e-commerce application for selling digital products (UI kits, templates, ebooks, source code bundles, prompts, assets).

## Stack

- Frontend: React + Vite + Tailwind + Redux Toolkit + React Helmet
- Backend: Node.js + Express + MongoDB (Mongoose)
- Auth: JWT + Google OAuth
- Payment: Stripe sandbox
- AI: Groq/Gemini chatbot + **admin AI blog generator** (title → full post)

## Features

- User storefront: home, listing, detail, cart, checkout, auth, dashboard
- Admin panel: overview stats, order management, protected routes
- Product/category/order/user REST APIs
- Product SEO fields: meta title/description/keywords and OG tags
- File upload support for product images
- JWT auth middleware + role-based authorization

## Project Structure

```text
client/
  src/
    components/
    lib/
    store/
server/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
```

## Setup

### 1) Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 2) Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## Required Environment Variables

### `server/.env`

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `STRIPE_SECRET_KEY`
- **Free chatbot AI** (use one):
  - `GROQ_API_KEY` — free at [console.groq.com/keys](https://console.groq.com/keys) (recommended)
  - `GEMINI_API_KEY` — free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
  - `OPENAI_API_KEY` (optional, paid)

### `client/.env`

- `VITE_API_ROOT`
- `VITE_STRIPE_PUBLIC_KEY`
- `VITE_GOOGLE_CLIENT_ID` (optional, Google sign-in)
- `GOOGLE_CLIENT_ID` on server (same value)

## Deploy on Render (later)

1. **MongoDB** — use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster; set `MONGO_URI` on the API service.
2. **API service** — Root: `server`, Build: `npm install`, Start: `npm start`. Set all `server/.env` variables in Render dashboard.
3. **Static site** — Root: `client`, Build: `npm install && npm run build`, Publish: `dist`. Set `VITE_API_ROOT` to your Render API URL (calls use `{VITE_API_ROOT}/api`).
4. Set `CLIENT_URL` on the API to your Render frontend URL (CORS).
5. Run seed once locally or via Render shell: `npm run seed` in `server/`.

Do **not** commit `.env` files — only `.env.example`.

## API Overview

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Products: `/api/products` (CRUD + filters + pagination)
- Categories: `/api/categories`
- Orders: `/api/orders`, `/api/orders/mine`
- Users/Admin: `/api/users`, `/api/users/admin/stats`
- Payments: `/api/payments/create-payment-intent`
- Chatbot: `/api/chat`
- Blogs: `/api/blogs`, `/api/blogs/ai` (admin, AI generate)
- Analytics: `/api/analytics/admin/full-stats`

## Notes

- This app targets digital-only products (no shipping flow).
- Admin endpoints require JWT token of user role `admin`.
- In production, replace local uploads with cloud storage (S3/Cloudinary).
