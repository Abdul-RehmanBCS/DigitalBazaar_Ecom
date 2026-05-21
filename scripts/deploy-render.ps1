# One-shot Render deploy helper (run after GitHub push)
# Requires: Render account connected to GitHub repo DigitalBazaar_Ecom

$ErrorActionPreference = "Stop"

Write-Host "=== Digital Bazaar — Free Render Deploy ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open: https://dashboard.render.com/blueprints/new"
Write-Host "2. Sign in with GitHub (Abdul-RehmanBCS)"
Write-Host "3. Select repo: DigitalBazaar_Ecom"
Write-Host "4. When prompted, set these secrets:"
Write-Host ""
Write-Host "   MONGO_URI       = (from server/.env — Atlas with /digital_bazaar)"
Write-Host "   STRIPE_SECRET_KEY = sk_test_... (or placeholder)"
Write-Host "   GOOGLE_CLIENT_ID  = (from server/.env)"
Write-Host "   GROQ_API_KEY      = (from server/.env, optional)"
Write-Host "   VITE_STRIPE_PUBLIC_KEY = pk_test_..."
Write-Host "   VITE_GOOGLE_CLIENT_ID  = (same as GOOGLE_CLIENT_ID)"
Write-Host ""
Write-Host "5. Click Deploy Blueprint"
Write-Host "6. After API is live → Shell → npm run seed"
Write-Host ""
Write-Host "Live URLs (default service names):"
Write-Host "   API:  https://digitalbazaar-api.onrender.com"
Write-Host "   Web:  https://digitalbazaar-web.onrender.com"
Write-Host "   Health: https://digitalbazaar-api.onrender.com/api/health"
Write-Host ""

Start-Process "https://dashboard.render.com/blueprints/new"
