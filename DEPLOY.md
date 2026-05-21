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

## Step 3 — MongoDB Atlas

- Network Access → **0.0.0.0/0**
- URI format: `mongodb+srv://USER:PASS@cluster.mongodb.net/digital_bazaar?retryWrites=true&w=majority`

## Step 4 — Google OAuth

Add to **Authorized JavaScript origins**:

- `https://digitalbazaar-web.onrender.com`
- `https://abdul-rehmanbcs.github.io` (if using GitHub Pages)

## Step 5 — GitHub Pages (automatic)

Push to `main` runs `.github/workflows/deploy-pages.yml`.

Enable: Repo → **Settings** → **Pages** → Source: **GitHub Actions**.

Optional repo secrets: `VITE_GOOGLE_CLIENT_ID`, `VITE_STRIPE_PUBLIC_KEY`.

## Local helper

```powershell
.\scripts\deploy-render.ps1
```

Opens Render blueprint wizard in browser.
