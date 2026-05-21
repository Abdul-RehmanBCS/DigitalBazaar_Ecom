# Deploy Digital Bazaar on Render

## 1. Push to GitHub

Repo: https://github.com/Abdul-RehmanBCS/DigitalBazaar_Ecom

## 2. MongoDB Atlas (free)

1. https://www.mongodb.com/cloud/atlas → create cluster (M0 free).
2. Database Access → add user + password.
3. Network Access → **Allow access from anywhere** (`0.0.0.0/0`) for Render.
4. Connect → Drivers → copy connection string.
5. Replace `<password>` and set database name, e.g. `digital_bazaar`:
   `mongodb+srv://user:pass@cluster.mongodb.net/digital_bazaar?retryWrites=true&w=majority`

## 3. Render — Blueprint (recommended)

1. https://dashboard.render.com → **New** → **Blueprint**.
2. Connect GitHub repo `DigitalBazaar_Ecom`.
3. Render reads `render.yaml` and creates **API** + **static web** services.
4. When prompted, set **sync: false** variables:

| Service | Variable | Value |
|---------|----------|--------|
| API | `MONGO_URI` | Atlas connection string |
| API | `STRIPE_SECRET_KEY` | Stripe test/live secret |
| API | `GOOGLE_CLIENT_ID` | Google OAuth Web client ID |
| API | `GROQ_API_KEY` or `GEMINI_API_KEY` | Free AI key (optional) |
| Web | `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| Web | `VITE_GOOGLE_CLIENT_ID` | Same as `GOOGLE_CLIENT_ID` |

`JWT_SECRET` and cross-service URLs (`CLIENT_URL`, `VITE_API_ROOT`) are wired by the blueprint.

## 4. Google OAuth (production)

Google Cloud Console → Credentials → OAuth client:

- **Authorized JavaScript origins:** your Render web URL, e.g. `https://digitalbazaar-web.onrender.com`
- Use the same client ID in API `GOOGLE_CLIENT_ID` and web `VITE_GOOGLE_CLIENT_ID`.

## 5. Seed database (once)

After API is live, in Render → **digitalbazaar-api** → **Shell**:

```bash
npm run seed
```

## 6. Manual deploy (without Blueprint)

**API (Web Service)**  
- Root: `server`  
- Build: `npm install`  
- Start: `npm start`  
- Env: all keys from `server/.env.example`

**Frontend (Static Site)**  
- Root: `client`  
- Build: `npm install && npm run build`  
- Publish: `dist`  
- Env: `VITE_API_ROOT` = `https://<your-api>.onrender.com`  
- `VITE_API_URL` is derived as `{VITE_API_ROOT}/api` in the client.

Set API `CLIENT_URL` to your static site URL (CORS).

## 7. Uploads on Render

Product images in `server/uploads/` are **ephemeral** on free tier. For production, use Cloudinary/S3 later. Seeded products use external/picsum URLs by default.

## 8. Local `.env` stays local

Never commit `server/.env` or `client/.env`. Copy values into Render only.
