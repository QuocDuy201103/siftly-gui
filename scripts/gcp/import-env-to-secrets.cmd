@echo off
setlocal

REM Windows-friendly wrapper (no PowerShell 7 required).
REM Usage:
REM   scripts\gcp\import-env-to-secrets.cmd .\chat-bot\.env.local

if "%~1"=="" (
  echo Usage: %~nx0 ^<path-to-env-file^>
  echo Example: %~nx0 .\chat-bot\.env.local
  exit /b 2
)

powershell.exe -ExecutionPolicy Bypass -File "%~dp0import-env-to-secrets.ps1" -EnvFile "%~1"
endlocal


