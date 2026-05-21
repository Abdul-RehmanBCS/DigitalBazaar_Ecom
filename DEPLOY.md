# Free deployment (from scratch)

## Live URLs (after deploy)

| Service | URL |
|---------|-----|
| **API (Render)** | https://digitalbazaar-api.onrender.com |
| **Web (Render)** | https://digitalbazaar-web.onrender.com |
| **Web (GitHub Pages backup)** | https://abdul-rehmanbcs.github.io/DigitalBazaar_Ecom/ |
| **Health** | https://digitalbazaar-api.onrender.com/api/health |

## Step 1 — Code on GitHub (done)

https://github.com/Abdul-RehmanBCS/DigitalBazaar_Ecom

## Step 2 — Deploy backend + frontend on Render (one click)

**Click:** https://render.com/deploy?repo=https://github.com/Abdul-RehmanBCS/DigitalBazaar_Ecom

1. Sign in with GitHub
2. Approve blueprint
3. Enter secrets when asked:

| Variable | Value |
|----------|--------|
| `MONGO_URI` | Atlas URI with `/digital_bazaar` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `GOOGLE_CLIENT_ID` | from `server/.env` |
| `GROQ_API_KEY` | from `server/.env` (optional) |
| `VITE_STRIPE_PUBLIC_KEY` | `pk_test_...` |
| `VITE_GOOGLE_CLIENT_ID` | same as `GOOGLE_CLIENT_ID` |

4. **Deploy Blueprint**
5. API → **Shell** → `npm run seed`

## Step 3 — MongoDB Atlas (required for login, cart, checkout)

**Without this, the live API cannot save users or orders** (products may still show via catalog fallback).

1. Open https://cloud.mongodb.com → your project → **Network Access**
2. **Add IP Address** → choose **Allow Access from Anywhere** (`0.0.0.0/0`) → Confirm
3. Wait ~1 minute, then check: https://digitalbazaar-api.onrender.com/api/health → `"dbReady": true`
4. On first connect, the API **auto-seeds** 18 products (same as localhost `npm run seed`)

Render API env (if not using blueprint defaults):

| Key | Value |
|-----|--------|
| `MONGO_USER` | `abdulrehmanjavediqbal7_db_user` |
| `MONGO_CLUSTER` | `cluster0.znb35ue.mongodb.net` |
| `MONGO_PASSWORD` | your Atlas database user password |

## Step 4 — Google OAuth (required for “Continue with Google”)

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth 2.0 Client → **Authorized JavaScript origins**, add:

- `https://digitalbazaar-web.onrender.com`
- `http://localhost:5173` (local dev)
- `https://abdul-rehmanbcs.github.io` (if using GitHub Pages)

**Authorized redirect URIs** are not required for the Google One Tap / credential flow this app uses.

## Step 5 — GitHub Pages (automatic)

Push to `main` runs `.github/workflows/deploy-pages.yml`.

Enable: Repo → **Settings** → **Pages** → Source: **GitHub Actions**.

Optional repo secrets: `VITE_GOOGLE_CLIENT_ID`, `VITE_STRIPE_PUBLIC_KEY`.

## Local helper

```powershell
.\scripts\deploy-render.ps1
```

Opens Render blueprint wizard in browser.
