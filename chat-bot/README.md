# RAG Chatbot with Supabase + DeepSeek

This is a Retrieval-Augmented Generation (RAG) chatbot built with:
- **Next.js / TypeScript** API routes
- **Supabase PostgreSQL** + **pgvector** for vector search
- **DeepSeek** for text generation
- **HuggingFace** (e.g. `BAAI/bge-m3`) for embeddings (1024 dimensions)

## Features

- **Answers grounded in retrieved sources**: the model answers using content from your help articles.
- **Citations**: responses include links to the source articles.
- **Confidence scoring**
  - Confidence < 0.5 → route to human
  - Confidence 0.5–0.75 → ask a clarifying question
  - Confidence > 0.75 → answer directly
- **Chat history** stored in Supabase

---

## Setup

### 1) Install dependencies

```bash
cd chat-bot
npm install
```

### 2) Configure environment variables

Create `chat-bot/.env.local`:

```env
# Supabase / Postgres
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# DeepSeek
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions

# HuggingFace embeddings (BAAI/bge-m3)
HUGGINGFACE_API_KEY=your-huggingface-api-key
HUGGINGFACE_EMBEDDING_MODEL=BAAI/bge-m3
HUGGINGFACE_API_URL=https://router.huggingface.co/hf-inference/models/BAAI/bge-m3/pipeline/feature-extraction
EMBEDDING_DIMENSIONS=1024

# App
NODE_ENV=development
```

### 3) Database setup

#### Step 1: Enable pgvector in Supabase

In Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Step 2: Create tables

Option A (recommended, Drizzle):

```bash
# from repo root
npm run db:push
```

Option B (manual SQL):
- Open `setup-database.sql`
- Copy/paste into Supabase SQL editor

### 4) Create embeddings for help articles

After help articles exist in the DB, generate embeddings:

```bash
cd chat-bot
npx tsx scripts/create-embeddings.ts
```

---

## API endpoints

### POST `/api/chat`

Non-streaming chat.

### POST `/api/chat/stream`

Streaming chat via Server-Sent Events (SSE).

---

## Development

```bash
npm run dev
```

Server runs on `http://localhost:3000`.

## Production

```bash
npm run build
npm start
```

---

## Notes

- Confidence thresholds are configurable in `lib/rag/pipeline.ts`.
- Similarity threshold is configurable in `lib/vector-search.ts`.


