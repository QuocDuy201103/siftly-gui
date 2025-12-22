<#
.SYNOPSIS
  Delete Google Secret Manager secrets for keys listed in a .env/.env.local file.

.DESCRIPTION
  - Reads KEY=VALUE pairs (supports optional "export " prefix)
  - Ignores blank lines and comments starting with #
  - Deletes secrets by ID (optionally with a prefix)
  - Supports -DryRun to preview what would be deleted

.EXAMPLE
  powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\delete-env-secrets.ps1 -EnvFile .\chat-bot\.env.local -DryRun

.EXAMPLE
  powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\delete-env-secrets.ps1 -EnvFile .\chat-bot\.env.local

.EXAMPLE
  powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\delete-env-secrets.ps1 -EnvFile .\chat-bot\.env.local -Prefix SIFTLY_
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$EnvFile,

  # Optional prefix for secret IDs (env var name stays the same)
  [string]$Prefix = "",

  # Preview only; do not delete anything
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Env file not found: $EnvFile"
}

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  throw "gcloud not found in PATH. Install Google Cloud CLI first."
}

$lines = Get-Content -LiteralPath $EnvFile -Raw -Encoding UTF8
if (-not $lines) {
  throw "Env file is empty: $EnvFile"
}

$keys = New-Object System.Collections.Generic.HashSet[string]

foreach ($rawLine in ($lines -split "`r?`n")) {
  $line = $rawLine.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { continue }

  if ($line.StartsWith("export ")) {
    $line = $line.Substring(7).Trim()
  }

  $eqIdx = $line.IndexOf("=")
  if ($eqIdx -lt 1) { continue }

  $key = $line.Substring(0, $eqIdx).Trim()
  if ($key -eq "") { continue }

  [void]$keys.Add($key)
}

if ($keys.Count -eq 0) {
  throw "No KEY=VALUE pairs found in $EnvFile"
}

Write-Host "Found $($keys.Count) keys in $EnvFile"

$secretIds = @()
foreach ($k in $keys) {
  $secretId = "$Prefix$k"
  if ($secretId -notmatch '^[A-Za-z][A-Za-z0-9_-]{0,254}$') {
    throw "Invalid secret id '$secretId'. Consider using -Prefix or renaming key."
  }
  $secretIds += $secretId
}

Write-Host "Will delete secrets:"
$secretIds | Sort-Object | ForEach-Object { Write-Host "  - $_" }

if ($DryRun) {
  Write-Host ""
  Write-Host "DryRun: no secrets deleted."
  exit 0
}

Write-Host ""
Write-Host "Deleting..."

foreach ($sid in ($secretIds | Sort-Object)) {
  # --quiet avoids interactive confirmation
  try {
    gcloud secrets delete $sid --quiet | Out-Null
    Write-Host "  deleted $sid"
  } catch {
    # Keep going; common if secret doesn't exist
    Write-Host "  failed $sid ($($_.Exception.Message))"
  }
}

Write-Host ""
Write-Host "Done."


