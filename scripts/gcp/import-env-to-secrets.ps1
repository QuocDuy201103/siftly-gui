<#
.SYNOPSIS
  Import .env/.env.local style variables into Google Secret Manager using gcloud.

.DESCRIPTION
  - Reads KEY=VALUE pairs (supports optional "export " prefix)
  - Ignores blank lines and comments starting with #
  - Creates secret if missing; otherwise adds a new version
  - Prints a ready-to-copy --set-secrets mapping for Cloud Run

.EXAMPLE
  pwsh -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\chat-bot\.env.local

.EXAMPLE
  pwsh -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\.env.local -Prefix SIFTLY_
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$EnvFile,

  # Optional prefix for secret IDs (env var name stays the same)
  [string]$Prefix = "",

  # Optional line-range import (1-based, inclusive). Default imports the whole file.
  [int]$FromLine = 1,
  [int]$ToLine = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-Value([string]$v) {
  $v = $v.Trim()
  if ($v.Length -ge 2) {
    $first = $v.Substring(0, 1)
    $last = $v.Substring($v.Length - 1, 1)
    if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
      return $v.Substring(1, $v.Length - 2)
    }
  }
  return $v
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Env file not found: $EnvFile"
}

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  throw "gcloud not found in PATH. Install Google Cloud CLI first."
}

$allLines = Get-Content -LiteralPath $EnvFile -Encoding UTF8
if ($allLines.Count -eq 0) { throw "Env file is empty: $EnvFile" }

if ($FromLine -lt 1) { throw "-FromLine must be >= 1" }
if ($ToLine -ne 0 -and $ToLine -lt $FromLine) { throw "-ToLine must be 0 (no limit) or >= -FromLine" }

$startIdx = $FromLine - 1
$endIdx = if ($ToLine -eq 0) { $allLines.Count - 1 } else { [Math]::Min($ToLine - 1, $allLines.Count - 1) }
if ($startIdx -gt ($allLines.Count - 1)) { throw "FromLine $FromLine is beyond end of file ($($allLines.Count) lines)" }

$lines = $allLines[$startIdx..$endIdx]

$pairs = New-Object System.Collections.Generic.List[object]

foreach ($rawLine in $lines) {
  $line = ([string]$rawLine).Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { continue }

  if ($line.StartsWith("export ")) {
    $line = $line.Substring(7).Trim()
  }

  # Split on first '=' only
  $eqIdx = $line.IndexOf("=")
  if ($eqIdx -lt 1) { continue }

  $key = $line.Substring(0, $eqIdx).Trim()
  $val = $line.Substring($eqIdx + 1)

  if ($key -eq "") { continue }

  $val = Normalize-Value $val
  $pairs.Add([pscustomobject]@{ Key = $key; Value = $val })
}

if ($pairs.Count -eq 0) {
  throw "No KEY=VALUE pairs found in $EnvFile (lines $FromLine..$($endIdx + 1))"
}

Write-Host "Found $($pairs.Count) variables in $EnvFile (lines $FromLine..$($endIdx + 1))"
Write-Host "Importing into Secret Manager..."

$setSecrets = New-Object System.Collections.Generic.List[string]

foreach ($p in $pairs) {
  $envVar = [string]$p.Key
  $secretId = "$Prefix$envVar"

  # Secret Manager IDs: start with letter; allow letters/numbers/_/-
  if ($secretId -notmatch '^[A-Za-z][A-Za-z0-9_-]{0,254}$') {
    throw "Invalid secret id '$secretId'. Consider using -Prefix or renaming key."
  }

  $tmp = [System.IO.Path]::GetTempFileName()
  try {
    # Keep exact value, no trailing newline
    [System.IO.File]::WriteAllText($tmp, [string]$p.Value, (New-Object System.Text.UTF8Encoding($false)))

    $exists = $true
    try {
      gcloud secrets describe $secretId *> $null
    } catch {
      $exists = $false
    }

    if (-not $exists) {
      Write-Host "  + create $secretId"
      gcloud secrets create $secretId --replication-policy="automatic" | Out-Null
    } else {
      Write-Host "  ~ update $secretId (new version)"
    }

    gcloud secrets versions add $secretId --data-file=$tmp | Out-Null
    # PowerShell parses "$var:xyz" as a scoped variable (e.g. $env:PATH), so use ${} to avoid truncation.
    $setSecrets.Add("$envVar=${secretId}:latest")
  } finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
  }
}

Write-Host ""
Write-Host "Done."
Write-Host ""
Write-Host "Cloud Run flag (copy/paste):"
$secretsCsv = ($setSecrets -join ",")
# In PowerShell, unquoted commas can split arguments; provide a quoted version that is safe to paste.
Write-Host ("--set-secrets " + $secretsCsv)
Write-Host ""
Write-Host "PowerShell-safe (recommended):"
Write-Host ("--set-secrets """ + $secretsCsv + """")


