# Generate NEXTAUTH_SECRET for NextAuth.js
# Usage: .\scripts\generate-nextauth-secret.ps1

$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)

Write-Host ""
Write-Host "Generated NEXTAUTH_SECRET:" -ForegroundColor Green
Write-Host $secret -ForegroundColor Yellow
Write-Host ""
Write-Host "Add this to your .env.local file:" -ForegroundColor Cyan
Write-Host "NEXTAUTH_SECRET=$secret"
Write-Host ""
Write-Host "Or add to Google Secret Manager:" -ForegroundColor Cyan
Write-Host "echo '$secret' | gcloud secrets versions add NEXTAUTH_SECRET --data-file=-" -ForegroundColor White
Write-Host ""

