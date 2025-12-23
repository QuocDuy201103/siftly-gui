# Deploy to GCP (Cloud Run) — Siftly

This repository contains **two runtimes**:

- **Main app (repo root)**: Express + Vite SPA build (served from `dist/public`) + Admin OAuth/Contacts API.
- **Chatbot (`chat-bot/`)**: Next.js API (`/api/chat*`, `/api/zoho/webhook`) + (optionally) serves a static SPA from `chat-bot/public`.

Recommended deployment is **two Cloud Run services**, and the main app **proxies** these routes to the `chat-bot` service:
- `/api/chat*`
- `/api/zoho/webhook`

(Proxy is implemented in `server/routes.ts`.)

---

## 0) Prerequisites

1) Install Google Cloud SDK (`gcloud`) and login:

```bash
gcloud auth login
gcloud auth application-default login
```

2) Set project + region (example `asia-southeast1`):

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region asia-southeast1
```

3) Enable required APIs:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

---

## 1) Deploy `chat-bot` (Next.js) to Cloud Run

### 1.1 Import `.env.local` into Secret Manager (recommended)

Use the provided PowerShell script to create/update secrets from your `.env.local`.

**Windows PowerShell (`powershell.exe`)**:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\chat-bot\.env.local
```

**Or use the `.cmd` wrapper**:

```powershell
.\scripts\gcp\import-env-to-secrets.cmd .\chat-bot\.env.local
```

The script will:
- Ignore comments/blank lines
- Create secrets if missing, otherwise add a new version
- Print a **PowerShell-safe** `--set-secrets "..."` string for Cloud Run

### 1.2 Deploy from source (quick path)

> Note for PowerShell: always quote values with commas (`,`), like `--set-secrets "A=...,B=..."`

```powershell
gcloud run deploy siftly-chat-bot `
  --source chat-bot `
  --region us-west1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,SUPABASE_URL=SUPABASE_URL:latest,VITE_SUPABASE_URL=VITE_SUPABASE_URL:latest,VITE_SUPABASE_ANON_KEY=VITE_SUPABASE_ANON_KEY:latest,DEEPSEEK_API_KEY=DEEPSEEK_API_KEY:latest,DEEPSEEK_API_URL=DEEPSEEK_API_URL:latest,HUGGINGFACE_API_KEY=HUGGINGFACE_API_KEY:latest,HUGGINGFACE_EMBEDDING_MODEL=HUGGINGFACE_EMBEDDING_MODEL:latest,HUGGINGFACE_API_URL=HUGGINGFACE_API_URL:latest,EMBEDDING_DIMENSIONS=EMBEDDING_DIMENSIONS:latest,ZOHO_ACCOUNTS_URL=ZOHO_ACCOUNTS_URL:latest,ZOHO_DESK_API_URL=ZOHO_DESK_API_URL:latest,ZOHO_ORG_ID=ZOHO_ORG_ID:latest,ZOHO_CLIENT_ID=ZOHO_CLIENT_ID:latest,ZOHO_CLIENT_SECRET=ZOHO_CLIENT_SECRET:latest,ZOHO_REFRESH_TOKEN=ZOHO_REFRESH_TOKEN:latest,ZOHO_DEPARTMENT_ID=ZOHO_DEPARTMENT_ID:latest,ZOHO_WEBHOOK_SECRET=ZOHO_WEBHOOK_SECRET:latest"
```

### 1.3 If build fails with `Can't resolve '../../shared/schema'`

`chat-bot` imports `../../shared/*`, so `--source chat-bot` may not include `shared/` in the build context.

Most reliable fix: **build a Docker image from repo root** (copies both `shared/` + `chat-bot/`) and deploy using `--image`.

1) Create an Artifact Registry repo (one time):

```powershell
gcloud artifacts repositories create siftly --repository-format=docker --location asia-southeast1
```

2) Build + push using Cloud Build:

```powershell
$PROJECT_ID = (gcloud config get-value project).Trim()
$IMAGE = "asia-southeast1-docker.pkg.dev/$PROJECT_ID/siftly/siftly-chat-bot:latest"
gcloud builds submit --region=asia-southeast1 --config .\cloudbuild.chat-bot.yaml --substitutions "_IMAGE=$IMAGE" .
```

3) Deploy from the image:

```powershell
gcloud run deploy siftly-chat-bot `
  --image $IMAGE `
  --region asia-southeast1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,SUPABASE_URL=SUPABASE_URL:latest,VITE_SUPABASE_URL=VITE_SUPABASE_URL:latest,VITE_SUPABASE_ANON_KEY=VITE_SUPABASE_ANON_KEY:latest,DEEPSEEK_API_KEY=DEEPSEEK_API_KEY:latest,DEEPSEEK_API_URL=DEEPSEEK_API_URL:latest,HUGGINGFACE_API_KEY=HUGGINGFACE_API_KEY:latest,HUGGINGFACE_EMBEDDING_MODEL=HUGGINGFACE_EMBEDDING_MODEL:latest,HUGGINGFACE_API_URL=HUGGINGFACE_API_URL:latest,EMBEDDING_DIMENSIONS=EMBEDDING_DIMENSIONS:latest,ZOHO_ACCOUNTS_URL=ZOHO_ACCOUNTS_URL:latest,ZOHO_DESK_API_URL=ZOHO_DESK_API_URL:latest,ZOHO_ORG_ID=ZOHO_ORG_ID:latest,ZOHO_CLIENT_ID=ZOHO_CLIENT_ID:latest,ZOHO_CLIENT_SECRET=ZOHO_CLIENT_SECRET:latest,ZOHO_REFRESH_TOKEN=ZOHO_REFRESH_TOKEN:latest,ZOHO_DEPARTMENT_ID=ZOHO_DEPARTMENT_ID:latest,ZOHO_WEBHOOK_SECRET=ZOHO_WEBHOOK_SECRET:latest"
```

After deploy you will get a URL like:
- `https://siftly-chat-bot-xxxxx-asia-southeast1.a.run.app`

---

## 2) Deploy main app (repo root) to Cloud Run

The main app serves:
- Web UI (SPA)
- `/api/auth/*`, `/api/contact`, `/api/contacts/*`

And it proxies:
- `/api/chat*`
- `/api/zoho/webhook`

…to the `chat-bot` service via env var `CHATBOT_BASE_URL`.

### 2.1 Import secrets for the main app

If your root `.env` contains secrets, import them too:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\.env
```

### 2.2 Deploy

```powershell
$CHATBOT_URL = "https://siftly-chat-bot-29216080826.asia-southeast1.run.app"

gcloud run deploy siftly-web `
  --source . `
  --region asia-southeast1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,CHATBOT_BASE_URL=$CHATBOT_URL" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,VITE_SUPABASE_URL=VITE_SUPABASE_URL:latest,VITE_SUPABASE_ANON_KEY=VITE_SUPABASE_ANON_KEY:latest,SLACK_WEBHOOK_URL=SLACK_WEBHOOK_URL:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,GOOGLE_CALLBACK_URL=GOOGLE_CALLBACK_URL:latest,ALLOWED_ADMIN_EMAILS=ALLOWED_ADMIN_EMAILS:latest"
```

### 2.3 Google OAuth callback

In your Google OAuth client config, set the callback URL:
- `https://<siftly-web-url>/api/auth/google/callback`

If you store it in Secret Manager, update the secret value:

```powershell
$NEW = "https://<siftly-web-url>/api/auth/google/callback"
$NEW | gcloud secrets versions add GOOGLE_CALLBACK_URL --data-file=-
```

---

## 3) Post-deploy checks

- Open the `siftly-web` URL → UI should load.
- Visit `/admin/login` → test Google OAuth.
- Open the chat widget → it should call `/api/chat` on the **same origin** (and be proxied to `chat-bot`).
- Zoho webhook: configure Zoho to call either:
  - `https://<siftly-web-url>/api/zoho/webhook` (proxied), or
  - `https://<siftly-chat-bot-url>/api/zoho/webhook` (direct)

---

## 4) Notes

- Cloud Run sets `PORT=8080` automatically; the app should bind to `process.env.PORT`.
- Vite `VITE_*` variables are build-time. For runtime config, prefer server endpoints like `/api/public-config`.
- If you want private services, remove `--allow-unauthenticated` and configure IAM invokers.


