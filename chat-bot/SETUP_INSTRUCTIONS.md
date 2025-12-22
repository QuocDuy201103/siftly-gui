# RAG Chatbot Setup Instructions

## Overview

This RAG chatbot is integrated with:
- Next.js/TypeScript API routes
- Supabase Postgres + pgvector
- DeepSeek (generation)
- Embeddings (HuggingFace)
- Chat history stored in Supabase
- Confidence scoring with handoff logic
- Source citations

---

## Step 1: Install dependencies

```bash
cd chat-bot
npm install
```

## Step 2: Configure environment variables

Create `chat-bot/.env.local` (see `ENV_SETUP.md` for details).

## Step 3: Database setup

### 3.1 Enable pgvector

In Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3.2 Create tables

From `chat-bot/`:

```bash
npm run db:push
```

Or from repo root:

```bash
npm run db:push
```

You can also run the SQL manually from `chat-bot/setup-database.sql`.

## Step 4: Add help articles

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

## Step 5: Generate embeddings

```bash
cd chat-bot
npx tsx scripts/create-embeddings.ts
```

## Step 6: Run dev server

```bash
cd chat-bot
npm run dev
```

Runs at `http://localhost:3000`.

## Step 7: Test API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{ "message": "How do I reset my password?" }'
```

---

## Next steps

1. Add more help articles
2. Generate embeddings for all content
3. Tune thresholds in `lib/rag/pipeline.ts` and `lib/vector-search.ts`


