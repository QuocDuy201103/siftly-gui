@echo off
setlocal

REM Windows-friendly wrapper (no PowerShell 7 required).
REM Usage:
REM   scripts\gcp\delete-env-secrets.cmd .\chat-bot\.env.local
REM   scripts\gcp\delete-env-secrets.cmd .\chat-bot\.env.local --dry-run

if "%~1"=="" (
  echo Usage: %~nx0 ^<path-to-env-file^> [--dry-run]
  echo Example: %~nx0 .\chat-bot\.env.local --dry-run
  exit /b 2
)

set ENVFILE=%~1
set DRY=
if /i "%~2"=="--dry-run" set DRY=-DryRun

powershell.exe -ExecutionPolicy Bypass -File "%~dp0delete-env-secrets.ps1" -EnvFile "%ENVFILE%" %DRY%
endlocal


