# Environment Variables Setup

## Create `chat-bot/.env.local`

Create a `.env.local` file inside `chat-bot/`:

```env
# ============================================
# Supabase / Postgres
# ============================================
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# ============================================
# Supabase Realtime (Human Handoff live chat)
# - Get keys from Supabase Dashboard → Project Settings → API
# - Service role key is server-only (webhook). Never expose it in the browser.
# ============================================
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ============================================
# DeepSeek (chat completions)
# ============================================
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions

# ============================================
# HuggingFace embeddings (BAAI/bge-m3)
# ============================================
HUGGINGFACE_API_KEY=your-huggingface-api-key-here
HUGGINGFACE_EMBEDDING_MODEL=BAAI/bge-m3
HUGGINGFACE_API_URL=https://router.huggingface.co/hf-inference/models/BAAI/bge-m3/pipeline/feature-extraction
EMBEDDING_DIMENSIONS=1024

# ============================================
# Zoho Desk (Human Handoff)
# ============================================
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_DESK_API_URL=https://desk.zoho.com/api/v1
ZOHO_ORG_ID=your-zoho-org-id
ZOHO_CLIENT_ID=your-zoho-client-id
ZOHO_CLIENT_SECRET=your-zoho-client-secret
ZOHO_REFRESH_TOKEN=your-zoho-refresh-token
ZOHO_DEPARTMENT_ID=your-department-id-here

# Optional: protect webhook endpoint chat-bot/app/api/zoho/webhook
ZOHO_WEBHOOK_SECRET=your-random-secret-string

# ============================================
# App
# ============================================
NODE_ENV=development
```

---

## How to get API keys

### Supabase `DATABASE_URL`
1. Open Supabase Dashboard: `https://supabase.com/dashboard`
2. Select your project
3. Settings → Database
4. Connection string → URI
5. Replace `[YOUR-PASSWORD]` with your DB password

### DeepSeek API Key
1. Login at `https://platform.deepseek.com/`
2. Settings → API Keys
3. Create/copy an API key

### HuggingFace API Key
1. Login at `https://huggingface.co/`
2. Settings → Access Tokens: `https://huggingface.co/settings/tokens`
3. Create a token with **Read** permission

### Zoho Desk credentials (high-level)
1. Create a Zoho OAuth app at `https://api-console.zoho.com/`
2. Generate a refresh token with the required scopes
3. Find your org ID and department ID in Zoho Desk settings

---

## Security notes

- Do **not** commit `.env.local` to git.
- Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` or Zoho refresh token in the browser.
- Use Secret Manager / Cloud Run secrets for production.


