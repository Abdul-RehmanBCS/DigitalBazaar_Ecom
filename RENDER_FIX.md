# Render — fix missing pieces (do after redeploy)

## Your live URLs

- **Frontend:** https://digitalbazaar-web.onrender.com
- **Backend:** https://digitalbazaar-api.onrender.com
- **Health:** https://digitalbazaar-api.onrender.com/api/health

## 1. Render dashboard — API service env

Open **digitalbazaar-api** → **Environment** and confirm:

| Key | Value |
|-----|--------|
| `MONGO_URI` | Atlas URI with `/digital_bazaar` |
| `CLIENT_URL` | `https://digitalbazaar-web.onrender.com` |
| `JWT_SECRET` | (any long random string) |
| `GOOGLE_CLIENT_ID` | from local `server/.env` |
| `GROQ_API_KEY` | from local `server/.env` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |

Click **Save** → **Manual Deploy**.

## 2. Render dashboard — Web service env

Open **digitalbazaar-web** → **Environment**:

| Key | Value |
|-----|--------|
| `VITE_API_ROOT` | `https://digitalbazaar-api.onrender.com` |
| `VITE_SITE_URL` | `https://digitalbazaar-web.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | same as `GOOGLE_CLIENT_ID` |
| `VITE_STRIPE_PUBLIC_KEY` | `pk_test_...` |

**Manual Deploy** (rebuilds frontend with correct API URL).

## 3. Seed database (required for products)

**digitalbazaar-api** → **Shell**:

```bash
npm run seed
```

Admin: `admin@digitalbazaar.com` / `admin123`

## 4. MongoDB Atlas

Network Access → **Allow 0.0.0.0/0**

## 5. Google OAuth

Authorized JavaScript origins:

- `https://digitalbazaar-web.onrender.com`

## 6. Verify

- https://digitalbazaar-api.onrender.com/api/health → `{"ok":true,"dbReady":true}`
- https://digitalbazaar-web.onrender.com → products and categories load
