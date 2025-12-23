# RAG Chatbot with Supabase + DeepSeek

This is a Retrieval-Augmented Generation (RAG) chatbot built with:
- **Next.js / TypeScript** API routes
- **Supabase PostgreSQL** + **pgvector** for vector search
- **DeepSeek** for text generation
- **HuggingFace** (e.g. `BAAI/bge-m3`) for embeddings (1024 dimensions)

## Table of Contents

- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Usage](#api-usage)
- [Zoho Desk Human Handoff](#zoho-desk-human-handoff)
- [Development](#development)
- [Production](#production)
- [Configuration Notes](#configuration-notes)

---

## Features

- **Answers grounded in retrieved sources**: the model answers using content from your help articles.
- **Citations**: responses include links to the source articles.
- **Confidence scoring**
  - Confidence < 0.5 → route to human
  - Confidence 0.5–0.75 → ask a clarifying question
  - Confidence > 0.75 → answer directly
- **Chat history** stored in Supabase
- **Human handoff** integration with Zoho Desk for live agent support

---

## Setup Instructions

### Step 1: Install dependencies

```bash
cd chat-bot
npm install
```

### Step 2: Configure environment variables

Create `chat-bot/.env.local` (see [Environment Variables](#environment-variables) section for details).

### Step 3: Database setup

#### 3.1 Enable pgvector

In Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 3.2 Create tables

Option A (recommended, Drizzle):

```bash
# from repo root
npm run db:push
```

Option B (manual SQL):
- Open `setup-database.sql`
- Copy/paste into Supabase SQL editor

### Step 4: Add help articles

Option A (recommended, script):

```bash
cd chat-bot
npx tsx scripts/add-help-article.ts "Title" "Content here..." "https://example.com/article" "category"
```

Option B (manual SQL):

```sql
INSERT INTO help_articles (title, content, url, category)
VALUES ('How to Reset Password', '...', 'https://example.com/password-reset', 'Account');
```

### Step 5: Generate embeddings

After help articles exist in the DB, generate embeddings:

```bash
cd chat-bot
npx tsx scripts/create-embeddings.ts
```

### Step 6: Run dev server

```bash
cd chat-bot
npm run dev
```

Server runs on `http://localhost:3000`.

### Step 7: Test API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{ "message": "How do I reset my password?" }'
```

---

## Environment Variables

### Create `chat-bot/.env.local`

Create a `.env.local` file inside `chat-bot/`:

```env
DATABASE_URL=

# Supabase Realtime (Human Handoff live chat)
# - SUPABASE_URL + keys lấy từ Supabase Dashboard → Project Settings → API
# - Service role key CHỈ dùng ở server (webhook), không bao giờ đưa vào frontend
# ============================================
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=


# DeepSeek AI
DEEPSEEK_API_KEY=
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions


HUGGINGFACE_API_KEY=
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
HUGGINGFACE_API_URL=https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction
EMBEDDING_DIMENSIONS=384


# Zoho Desk Configuration
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_DESK_API_URL=https://desk.zoho.com/api/v1
ZOHO_ORG_ID=
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_DEPARTMENT_ID=


# (Optional) Protect webhook endpoint: chat-bot/app/api/zoho/webhook
ZOHO_WEBHOOK_SECRET=
```

### How to get API keys

#### Supabase `DATABASE_URL`
1. Open Supabase Dashboard: `https://supabase.com/dashboard`
2. Select your project
3. Settings → Database
4. Connection string → URI
5. Replace `[YOUR-PASSWORD]` with your DB password

#### DeepSeek API Key
1. Login at `https://platform.deepseek.com/`
2. Settings → API Keys
3. Create/copy an API key

#### HuggingFace API Key
1. Login at `https://huggingface.co/`
2. Settings → Access Tokens: `https://huggingface.co/settings/tokens`
3. Create a token with **Read** permission

#### Zoho Desk credentials (high-level)
1. Create a Zoho OAuth app at `https://api-console.zoho.com/`
2. Generate a refresh token with the required scopes
3. Find your org ID and department ID in Zoho Desk settings

### Security notes

- Do **not** commit `.env.local` to git.
- Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` or Zoho refresh token in the browser.
- Use Secret Manager / Cloud Run secrets for production.

---

## API Usage

### Endpoints

#### 1) POST `/api/chat`

Non-streaming chat endpoint (returns the full response).

**Request:**

```http
POST /api/chat
Content-Type: application/json

{
  "message": "How do I reset my password?",
  "sessionId": "optional-existing-session-id",
  "userId": "optional-user-id"
}
```

**Response:**

```json
{
  "response": "To reset your password...",
  "sources": [
    { "articleId": "uuid", "url": "https://example.com", "title": "Password Reset Guide" }
  ],
  "confidence": 0.85,
  "requiresHuman": false,
  "clarificationNeeded": false,
  "sessionId": "session-uuid-here"
}
```

#### 2) POST `/api/chat/stream`

Streaming endpoint using Server-Sent Events (SSE).

**Response format:**

```
data: {"type":"chunk","content":"Hello"}
data: {"type":"chunk","content":" world"}
data: {"type":"done","sources":[...],"sessionId":"..."}
```

**Error format:**

```
data: {"type":"error","error":"Error message here"}
```

### Error handling

Status codes:
- `200`: success
- `400`: bad request (missing/invalid input)
- `500`: internal server error

Error response:

```json
{ "error": "Error message here" }
```

### Session management

- If you do not provide `sessionId`, the server creates a new session automatically.
- Store `sessionId` from responses and reuse it to keep conversation context.
- Sessions and chat history are stored in the database.

---

## Zoho Desk Human Handoff

### Overview

Human handoff automatically routes a conversation from the chatbot to a Zoho Desk agent when:

1. **Low confidence**: confidence score < 60%
2. **User requests a human**: the message contains keywords like:
   - "talk to a human", "agent", "support", "staff", "representative", "live agent"
   - "speak to someone"

### Handoff flow

#### Step 1: Trigger detection

When a user message arrives:
- The RAG pipeline computes confidence
- Keywords are checked
- If confidence < 60% OR a keyword matches → trigger handoff

#### Step 2: Collect user info

The system collects:
- user name + email (if provided)
- handoff reason
- recent chat history context

#### Step 3: Create a Zoho Desk ticket

`POST /api/chat/handoff`:
1. Checks if a ticket already exists for the session
2. Updates session user info
3. Loads chat history
4. Creates a Zoho Desk ticket with full context

### API endpoint: POST `/api/chat/handoff`

Creates a Zoho Desk ticket.

**Request:**

```json
{
  "sessionId": "uuid-of-session",
  "userName": "Jane Doe",
  "userEmail": "user@example.com",
  "handoffReason": "Low Confidence - 52%"
}
```

**Response:**

```json
{
  "success": true,
  "ticketId": "123456789",
  "ticketNumber": "TKT-001",
  "message": "Ticket created successfully in Zoho Desk"
}
```

If the ticket already exists:

```json
{
  "success": true,
  "ticketId": "123456789",
  "message": "Ticket already exists for this session",
  "alreadyExists": true
}
```

### Zoho configuration

See [Environment Variables](#environment-variables) section for required variables. At minimum:

```env
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_DESK_API_URL=https://desk.zoho.com/api/v1
ZOHO_ORG_ID=...
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
ZOHO_DEPARTMENT_ID=...
```

### OAuth token handling

- Access tokens are short-lived
- The system refreshes tokens automatically using the refresh token
- Tokens are stored in DB tables like `zoho_tokens`

### Realtime agent replies inside the web widget

When an agent replies in Zoho Desk, Zoho should call:

- `POST /api/zoho/webhook`

The webhook inserts into Supabase table `handoff_messages` with:
- `session_id`
- `author_type = "agent"`
- `content`

The web widget subscribes (Supabase Realtime) to new rows and shows the reply instantly.

#### Webhook security (optional)

Set:

```env
ZOHO_WEBHOOK_SECRET=your-random-secret-string
```

Then Zoho must send:
- Header `X-Zoho-Webhook-Secret: <ZOHO_WEBHOOK_SECRET>`, or
- Query param `?secret=<ZOHO_WEBHOOK_SECRET>`

### Troubleshooting

- **"Zoho refresh token is not configured"**: set `ZOHO_REFRESH_TOKEN`.
- **"Failed to refresh Zoho token"**: verify refresh token, client id/secret, scopes.
- **Ticket creation fails**: ensure `Desk.tickets.CREATE` scope and correct org/department IDs.

---

## Development

```bash
npm run dev
```

Server runs on `http://localhost:3000`.

---

## Production

```bash
npm run build
npm start
```

---

## Configuration Notes

- Confidence thresholds are configurable in `lib/rag/pipeline.ts`.
- Similarity threshold is configurable in `lib/vector-search.ts`.
- Handoff keywords can be customized in `lib/rag/pipeline.ts`.

### Next steps

1. Add more help articles
2. Generate embeddings for all content
3. Tune thresholds in `lib/rag/pipeline.ts` and `lib/vector-search.ts`
