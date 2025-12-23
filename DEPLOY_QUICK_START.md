# Quick Start: Deploy Siftly to Google Cloud Run

This guide will help you deploy both services to Google Cloud Platform in the shortest time possible.

## Prerequisites Checklist

- [ ] Google Cloud account with billing enabled
- [ ] `gcloud` CLI installed and authenticated
- [ ] PostgreSQL database ready (Supabase recommended)
- [ ] Google OAuth credentials created
- [ ] Supabase project created
- [ ] DeepSeek API key
- [ ] HuggingFace API token
- [ ] Zoho Desk OAuth credentials

## Step-by-Step Deployment

### 1. Configure GCP

```powershell
# Login
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region asia-southeast1

# Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

# Create Artifact Registry
gcloud artifacts repositories create siftly --repository-format=docker --location asia-southeast1
```

### 2. Prepare Environment Files

#### 2.1 Chat-Bot Environment

Create `chat-bot/.env.local`:

```env
DATABASE_URL=postgresql://...

SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...

DEEPSEEK_API_KEY=...
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions

HUGGINGFACE_API_KEY=...
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
HUGGINGFACE_API_URL=https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction
EMBEDDING_DIMENSIONS=384

ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_DESK_API_URL=https://desk.zoho.com/api/v1
ZOHO_ORG_ID=...
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
ZOHO_DEPARTMENT_ID=...
ZOHO_WEBHOOK_SECRET=...
```

#### 2.2 App-Next Environment

Create `app-next/.env.local`:

```env
DATABASE_URL=postgresql://...

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=  # Generate with: openssl rand -base64 32

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ALLOWED_ADMIN_EMAILS=admin@example.com

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...

CHATBOT_BASE_URL=http://localhost:4000

SLACK_WEBHOOK_URL=...  # Optional
```

**Generate NEXTAUTH_SECRET:**

```powershell
# PowerShell
.\scripts\generate-nextauth-secret.ps1

# Or use OpenSSL
openssl rand -base64 32
```

### 3. Setup Database

```powershell
cd chat-bot

# Enable pgvector
# Run in Supabase SQL editor:
# CREATE EXTENSION IF NOT EXISTS vector;

# Create tables
npx drizzle-kit push

# Add help articles
npx tsx scripts/add-help-article.ts "How to reset password" "Content..." "https://example.com" "Account"

# Generate embeddings
npx tsx scripts/create-embeddings.ts
```

### 4. Deploy Chat-Bot Service

```powershell
# Import secrets
powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\chat-bot\.env.local

# Build and deploy
$PROJECT_ID = (gcloud config get-value project).Trim()
$IMAGE = "asia-southeast1-docker.pkg.dev/$PROJECT_ID/siftly/siftly-chat-bot:latest"

gcloud builds submit --region=asia-southeast1 `
  --config .\cloudbuild.chat-bot.yaml `
  --substitutions "_IMAGE=$IMAGE,_SERVICE_NAME=siftly-chat-bot,_REGION=asia-southeast1" .
```

**Note the deployed URL:** `https://siftly-chat-bot-xxxxx-asia-southeast1.run.app`

### 5. Deploy App-Next Service

```powershell
# Import secrets
powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\app-next\.env.local

# Build and deploy
$PROJECT_ID = (gcloud config get-value project).Trim()
$CHATBOT_URL = "https://siftly-chat-bot-xxxxx-asia-southeast1.run.app"  # From step 4
$IMAGE = "asia-southeast1-docker.pkg.dev/$PROJECT_ID/siftly/siftly-app-next:latest"

gcloud builds submit --region=asia-southeast1 `
  --config .\cloudbuild.app-next.yaml `
  --substitutions "_IMAGE=$IMAGE,_SERVICE_NAME=siftly-app-next,_REGION=asia-southeast1,_CHATBOT_BASE_URL=$CHATBOT_URL" .
```

**Note the deployed URL:** `https://siftly-app-next-xxxxx-asia-southeast1.run.app`

### 6. Post-Deployment Configuration

#### 6.1 Update NEXTAUTH_URL

```powershell
$PROD_URL = "https://siftly-app-next-xxxxx-asia-southeast1.run.app"  # From step 5
echo $PROD_URL | gcloud secrets versions add NEXTAUTH_URL --data-file=-

# Redeploy to pick up new secret
gcloud run services update siftly-app-next --region asia-southeast1
```

#### 6.2 Configure Google OAuth

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add Authorized redirect URI:
   ```
   https://siftly-app-next-xxxxx-asia-southeast1.run.app/api/auth/callback/google
   ```

#### 6.3 Configure Zoho Webhook

In Zoho Desk, configure webhook to:
```
https://siftly-app-next-xxxxx-asia-southeast1.run.app/api/zoho/webhook
```

Add header:
```
X-Zoho-Webhook-Secret: <your-secret-from-env>
```

### 7. Verify Deployment

- [ ] Open app-next URL → landing page loads
- [ ] Visit `/admin/login` → Google OAuth works
- [ ] Submit contact form → saves to database
- [ ] Open chat widget → can send messages
- [ ] Test quick options → instant answers from chatbot
- [ ] Test custom question → triggers human handoff form
- [ ] Verify Zoho integration works

## Common Issues

### "Can't resolve '@shared/schema'"

Use Docker build method (Cloud Build), not `--source` deployment.

### Google OAuth fails

- Check `NEXTAUTH_URL` matches production URL
- Verify redirect URI in Google Console
- Ensure `NEXTAUTH_SECRET` is set

### Chat widget can't connect

- Verify `CHATBOT_BASE_URL` is correct
- Check both services are deployed and running

### Database connection fails

- Verify `DATABASE_URL` is correct
- Check Supabase IP allowlist (allow all for Cloud Run)

## Update/Redeploy

To redeploy after code changes:

```powershell
# Redeploy chat-bot
gcloud builds submit --region=asia-southeast1 `
  --config .\cloudbuild.chat-bot.yaml `
  --substitutions "_IMAGE=asia-southeast1-docker.pkg.dev/$PROJECT_ID/siftly/siftly-chat-bot:latest,_SERVICE_NAME=siftly-chat-bot,_REGION=asia-southeast1" .

# Redeploy app-next
gcloud builds submit --region=asia-southeast1 `
  --config .\cloudbuild.app-next.yaml `
  --substitutions "_IMAGE=asia-southeast1-docker.pkg.dev/$PROJECT_ID/siftly/siftly-app-next:latest,_SERVICE_NAME=siftly-app-next,_REGION=asia-southeast1,_CHATBOT_BASE_URL=$CHATBOT_URL" .
```

## Cost Optimization

- Set minimum instances to 0 (default)
- Set maximum instances based on traffic
- Use Cloud Run cold starts for low-traffic apps
- Monitor billing alerts

```powershell
# Set instance limits
gcloud run services update siftly-app-next `
  --region asia-southeast1 `
  --min-instances 0 `
  --max-instances 10

gcloud run services update siftly-chat-bot `
  --region asia-southeast1 `
  --min-instances 0 `
  --max-instances 5
```

## Next Steps

- [ ] Set up custom domain
- [ ] Configure Cloud CDN for static assets
- [ ] Set up Cloud Monitoring and alerting
- [ ] Configure Cloud Logging filters
- [ ] Set up CI/CD with Cloud Build triggers
- [ ] Add staging environment

For detailed documentation, see `DEPLOY_GCP.md`.

