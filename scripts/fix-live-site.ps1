# Opens the two dashboards needed to match localhost on the live site.
Write-Host "1) MongoDB Atlas — allow Render to connect (0.0.0.0/0)"
Start-Process "https://cloud.mongodb.com/v2#/security/network/accessList"
Start-Sleep -Seconds 2
Write-Host "2) Google Cloud — add live site to Authorized JavaScript origins"
Start-Process "https://console.cloud.google.com/apis/credentials"
Write-Host ""
Write-Host "After Atlas: https://digitalbazaar-api.onrender.com/api/health should show dbReady: true"
Write-Host "Live shop: https://digitalbazaar-web.onrender.com"
