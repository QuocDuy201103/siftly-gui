# Siftly — Setup & Deployment Guide

Complete guide for setting up and deploying the Siftly application.

---

## Project Overview

This repository contains **two runtimes**:

- **Main app (repo root)**: Express + Vite SPA build (served from `dist/public`) + Admin OAuth/Contacts API.
- **Chatbot (`chat-bot/`)**: Next.js API (`/api/chat*`, `/api/zoho/webhook`) + (optionally) serves a static SPA from `chat-bot/public`.

Recommended deployment is **two Cloud Run services**, and the main app **proxies** these routes to the `chat-bot` service:
- `/api/chat*`
- `/api/zoho/webhook`

(Proxy is implemented in `server/routes.ts`.)

---

## Table of Contents

1. [Database Setup](#database-setup)
2. [Local Development](#local-development)
3. [Deploy to GCP (Cloud Run)](#deploy-to-gcp-cloud-run)
4. [Troubleshooting](#troubleshooting)
5. [Security Notes](#security-notes)
6. [References](#references)

---

## Database Setup

### Step 1: Create a Supabase project

1) **Open Supabase**
- Go to `https://supabase.com/`
- Click **Start your project** (or **Sign in** if you already have an account)

2) **Create a new project**
- Click **New Project**
- Choose an organization (or create one)
- Fill in:
  - **Name**: `siftly` (or any name you prefer)
  - **Database Password**: choose a strong password (save it)
  - **Region**: pick the closest region
  - **Pricing plan**: Free (or Pro if needed)
- Click **Create new project**
- Wait ~2–3 minutes for provisioning

3) **Get the connection string**
- Go to **Project Settings** → **Database**
- Find **Connection string**
- Choose **URI**
- Copy the value (example):

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with your actual DB password.

### Step 2: Set `DATABASE_URL`

#### Option A (recommended): `.env` file

1) Create `.env` in the repo root:

```
E:\AMY_Technology_LLC\1-siftly\.env
```

2) Add variables:

```
# Database MongoDB URL
DATABASE_URL=

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Slack Webhook URL
SLACK_WEBHOOK_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# Session Secret (tạo random string)
# SESSION_SECRET=your-random-session-secret-key-here

# Allowed Admin Emails (optional, comma-separated)
ALLOWED_ADMIN_EMAILS=
```

#### Option B: Set env vars in your shell

**Windows (PowerShell):**

```powershell
$env:DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres"
$env:SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Windows (CMD):**

```cmd
set DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
```

**macOS/Linux:**

```bash
export DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres"
```

### Step 3: Install dependencies

```bash
npm install
```

Make sure `package.json` includes:
- `drizzle-orm`
- `drizzle-kit` (devDependency)
- `postgres`

### Step 4: Create database schema

After `DATABASE_URL` is set:

```bash
npm run db:push
```

This will:
- Read schema from `shared/schema.ts`
- Create tables in Supabase
- Create migrations as needed

### Step 5: Verify connectivity

1) Start the server:

```bash
npm run dev
```

2) Check logs:
- Success example:

```
Supabase PostgreSQL connected successfully
serving on port 5000
```

- If you get errors, verify:
  - `DATABASE_URL` is set correctly
  - password is correct
  - Supabase project is active (not paused)

### Step 6: Verify tables

After `npm run db:push`:

1) **Supabase Dashboard**
- Open your project
- Go to **Table Editor**
- You should see `users` and `contacts`

2) **SQL Editor**

```sql
SELECT * FROM users;
SELECT * FROM contacts;
```

---

## Local Development

1. Set up the database (see [Database Setup](#database-setup))
2. Install dependencies: `npm install`
3. Create `.env` file with required variables
4. Run database migrations: `npm run db:push`
5. Start the development server: `npm run dev`

The app should be available at `http://localhost:5000`.

---

## Deploy to GCP (Cloud Run)

### Prerequisites

1) Install Google Cloud SDK (`gcloud`) and login:

```bash
gcloud auth login
gcloud auth application-default login
```

2) Set project + region (example `us-west1` - Oregon):

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region us-west1
```

3) Enable required APIs:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

### 1) Deploy `chat-bot` (Next.js) to Cloud Run

#### 1.1 Import `.env.local` into Secret Manager (recommended)

Use the provided PowerShell script to create/update secrets from your `.env.local`.

**Windows PowerShell (`powershell.exe`):**

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\chat-bot\.env.local
```

**Or use the `.cmd` wrapper:**

```powershell
.\scripts\gcp\import-env-to-secrets.cmd .\chat-bot\.env.local
```

The script will:
- Ignore comments/blank lines
- Create secrets if missing, otherwise add a new version
- Print a **PowerShell-safe** `--set-secrets "..."` string for Cloud Run

#### 1.2 Deploy from source (quick path)

> Note for PowerShell: always quote values with commas (`,`), like `--set-secrets "A=...,B=..."`

```powershell
gcloud run deploy siftly-chat-bot `
  --source chat-bot `
  --region us-west1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" `
  --set-secrets "<PASTE_FROM_SCRIPT_OUTPUT>"
```

#### 1.3 If build fails with `Can't resolve '../../shared/schema'`

`chat-bot` imports `../../shared/*`, so `--source chat-bot` may not include `shared/` in the build context.

Most reliable fix: **build a Docker image from repo root** (copies both `shared/` + `chat-bot/`) and deploy using `--image`.

1) Create an Artifact Registry repo (one time):

```powershell
gcloud artifacts repositories create siftly --repository-format=docker --location us-west1
```

2) Build + push using Cloud Build:

```powershell
$PROJECT_ID = (gcloud config get-value project).Trim()
$IMAGE = "us-west1-docker.pkg.dev/$PROJECT_ID/siftly/siftly-chat-bot:latest"
gcloud builds submit --region=us-west1 --config .\cloudbuild.chat-bot.yaml --substitutions "_IMAGE=$IMAGE" .
```

3) Deploy from the image:

```powershell
gcloud run deploy siftly-chat-bot `
  --image $IMAGE `
  --region us-west1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,SUPABASE_URL=SUPABASE_URL:latest,VITE_SUPABASE_URL=VITE_SUPABASE_URL:latest,VITE_SUPABASE_ANON_KEY=VITE_SUPABASE_ANON_KEY:latest,DEEPSEEK_API_KEY=DEEPSEEK_API_KEY:latest,DEEPSEEK_API_URL=DEEPSEEK_API_URL:latest,HUGGINGFACE_API_KEY=HUGGINGFACE_API_KEY:latest,HUGGINGFACE_EMBEDDING_MODEL=HUGGINGFACE_EMBEDDING_MODEL:latest,HUGGINGFACE_API_URL=HUGGINGFACE_API_URL:latest,EMBEDDING_DIMENSIONS=EMBEDDING_DIMENSIONS:latest,ZOHO_ACCOUNTS_URL=ZOHO_ACCOUNTS_URL:latest,ZOHO_DESK_API_URL=ZOHO_DESK_API_URL:latest,ZOHO_ORG_ID=ZOHO_ORG_ID:latest,ZOHO_CLIENT_ID=ZOHO_CLIENT_ID:latest,ZOHO_CLIENT_SECRET=ZOHO_CLIENT_SECRET:latest,ZOHO_REFRESH_TOKEN=ZOHO_REFRESH_TOKEN:latest,ZOHO_DEPARTMENT_ID=ZOHO_DEPARTMENT_ID:latest,ZOHO_WEBHOOK_SECRET=ZOHO_WEBHOOK_SECRET:latest"
```

After deploy you will get a URL like:
- `https://siftly-chat-bot-xxxxx-us-west1.a.run.app`

### 2) Deploy main app (repo root) to Cloud Run

The main app serves:
- Web UI (SPA)
- `/api/auth/*`, `/api/contact`, `/api/contacts/*`

And it proxies:
- `/api/chat*`
- `/api/zoho/webhook`

…to the `chat-bot` service via env var `CHATBOT_BASE_URL`.

#### 2.1 Import secrets for the main app

If your root `.env` contains secrets, import them too:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\.env
```

#### 2.2 Deploy

```powershell
$CHATBOT_URL = "https://siftly-chat-bot-xxxxxxxx.us-west1.run.app"

gcloud run deploy siftly-web `
  --source . `
  --region us-west1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,CHATBOT_BASE_URL=$CHATBOT_URL" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,VITE_SUPABASE_URL=VITE_SUPABASE_URL:latest,VITE_SUPABASE_ANON_KEY=VITE_SUPABASE_ANON_KEY:latest,SLACK_WEBHOOK_URL=SLACK_WEBHOOK_URL:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,GOOGLE_CALLBACK_URL=GOOGLE_CALLBACK_URL:latest,ALLOWED_ADMIN_EMAILS=ALLOWED_ADMIN_EMAILS:latest"
```

#### 2.3 Google OAuth callback

In your Google OAuth client config, set the callback URL:
- `https://<siftly-web-url>/api/auth/google/callback`

If you store it in Secret Manager, update the secret value:

```powershell
$NEW = "https://<siftly-web-url>/api/auth/google/callback"
$NEW | gcloud secrets versions add GOOGLE_CALLBACK_URL --data-file=-
```

### 3) Post-deploy checks

- Open the `siftly-web` URL → UI should load.
- Visit `/admin/login` → test Google OAuth.
- Open the chat widget → it should call `/api/chat` on the **same origin** (and be proxied to `chat-bot`).
- Zoho webhook: configure Zoho to call either:
  - `https://<siftly-web-url>/api/zoho/webhook` (proxied), or
  - `https://<siftly-chat-bot-url>/api/zoho/webhook` (direct)

### 4) Notes

- Cloud Run sets `PORT=8080` automatically; the app should bind to `process.env.PORT`.
- Vite `VITE_*` variables are build-time. For runtime config, prefer server endpoints like `/api/public-config`.
- If you want private services, remove `--allow-unauthenticated` and configure IAM invokers.

### 5) Setup Cloud Build Trigger từ Bitbucket (CI/CD)

Để tự động build và deploy khi có code push lên Bitbucket, xem hướng dẫn chi tiết trong file:
- **[SETUP_BITBUCKET_TRIGGER.md](./SETUP_BITBUCKET_TRIGGER.md)**

**Tóm tắt:**
1. Connect Bitbucket repository với GCP Cloud Build
2. Tạo 2 triggers:
   - `siftly-chat-bot-trigger` → sử dụng `cloudbuild.chat-bot.yaml`
   - `siftly-web-trigger` → sử dụng `cloudbuild.yaml`
3. Mỗi khi push code lên branch `main`, trigger sẽ tự động build và deploy

**Files cần thiết:**
- `cloudbuild.yaml` - Build & deploy main app
- `cloudbuild.chat-bot.yaml` - Build & deploy chat-bot
- `Dockerfile` - Dockerfile cho main app
- `Dockerfile.chat-bot` - Dockerfile cho chat-bot (đã có sẵn)

---

## Troubleshooting

### Database Issues

#### Error: `DATABASE_URL environment variable is not set`
- Create `.env` with `DATABASE_URL`, or set it in your shell.

#### Error: `password authentication failed`
- The DB password in the connection string is wrong.
- Check Supabase Dashboard → Settings → Database.

#### Error: connection timeout / `ECONNREFUSED`
- Network issues, Supabase project paused, wrong host, firewall restrictions.

#### Error: `relation does not exist`
- Tables are not created. Run:

```bash
npm run db:push
```

#### Error: `Cannot find module 'postgres'`
- Install missing dependencies:

```bash
npm install postgres drizzle-orm drizzle-kit
```

### Deployment Issues

#### Build fails with `Can't resolve '../../shared/schema'`
- See section [1.3](#13-if-build-fails-with-cant-resolve-sharedschema) for Docker-based deployment solution.

#### Service not accessible
- Check that `--allow-unauthenticated` flag is set, or configure IAM invokers.
- Verify the service URL is correct.

#### Secrets not found
- Ensure secrets are created in Secret Manager before deployment.
- Use the import script to create/update secrets from `.env` files.

---

## Security Notes

1) **Do not commit `.env`**
- `.env` should be in `.gitignore`

2) **Protect DB credentials**
- Never hardcode secrets in code
- Prefer env vars / secret managers (Cloud Run, etc.)

3) **Backups**
- Supabase provides automatic backups depending on your plan
- You can export data or use `pg_dump` for manual backups

4) **Production secrets**
- Use GCP Secret Manager for production deployments
- Never commit secrets to version control
- Rotate secrets regularly

---

## References

- Supabase docs: `https://supabase.com/docs`
- Drizzle ORM docs: `https://orm.drizzle.team/`
- PostgreSQL docs: `https://www.postgresql.org/docs/`
- Google Cloud Run docs: `https://cloud.google.com/run/docs`
- Next.js deployment: `https://nextjs.org/docs/deployment`

