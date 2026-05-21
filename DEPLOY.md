# Render deployment

## Live URLs (after Blueprint deploy)

- API: https://digitalbazaar-api.onrender.com
- Web: https://digitalbazaar-web.onrender.com
- Health: https://digitalbazaar-api.onrender.com/api/health

## Blueprint secrets (enter when prompted)

| Service | Variables |
|---------|-----------|
| API | `MONGO_URI`, `STRIPE_SECRET_KEY`, `GOOGLE_CLIENT_ID` |
| Web | `VITE_STRIPE_PUBLIC_KEY`, `VITE_GOOGLE_CLIENT_ID` |

## Checklist

- [ ] Atlas Network Access: `0.0.0.0/0`
- [ ] `MONGO_URI` contains `/digital_bazaar`
- [ ] Push → Render → New → Blueprint
- [ ] API Shell: `npm run seed`
- [ ] Google OAuth JS origin: `https://digitalbazaar-web.onrender.com`
- [ ] If URLs differ in dashboard, update `CLIENT_URL`, `VITE_API_ROOT`, `VITE_SITE_URL`
