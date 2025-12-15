# RAG Chatbot với Supabase và DeepSeek AI

Chatbot RAG (Retrieval-Augmented Generation) sử dụng:
- **Next.js/TypeScript** cho API routes
- **Supabase PostgreSQL** với **pgvector** cho vector search
- **DeepSeek AI** cho text generation
- **HuggingFace BAAI/bge-m3** cho embeddings (1024 dimensions)

## Tính năng

✅ **Answering từ retrieved sources**: Model chỉ trả lời dựa trên thông tin từ các bài viết help đã retrieve  
✅ **Citations**: Luôn hiển thị links đến help articles  
✅ **Confidence scoring**: 
   - Confidence < 0.5 → Route to human
   - Confidence 0.5-0.75 → Ask clarifying question
   - Confidence > 0.75 → Answer directly
✅ **Chat history**: Lưu tất cả conversations vào Supabase

## Setup

### 1. Cài đặt Dependencies

```bash
cd chat-bot
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục `chat-bot`:

```env
# Supabase Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# DeepSeek AI Configuration
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions

# HuggingFace Embeddings (BAAI/bge-m3)
HUGGINGFACE_API_KEY=your-huggingface-api-key
HUGGINGFACE_EMBEDDING_MODEL=BAAI/bge-m3
HUGGINGFACE_API_URL=https://router.huggingface.co/hf-inference/models/BAAI/bge-m3/pipeline/feature-extraction
EMBEDDING_DIMENSIONS=1024
# Get API key from: https://huggingface.co/settings/tokens

# Application
NODE_ENV=development
```

### 3. Setup Database

#### Bước 1: Enable pgvector trong Supabase

1. Vào Supabase Dashboard → SQL Editor
2. Chạy lệnh:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Bước 2: Tạo Tables

Có 2 cách:

**Cách 1: Sử dụng Drizzle (Khuyến nghị)**
```bash
# Từ root directory của project
npm run db:push
```

**Cách 2: Chạy SQL thủ công**
1. Mở file `setup-database.sql`
2. Copy toàn bộ SQL
3. Paste vào Supabase SQL Editor và chạy

### 4. Tạo Embeddings cho Help Articles

Sau khi có help articles trong database, bạn cần tạo embeddings. Tạo script utility:

```typescript
// scripts/create-embeddings.ts
import { connectDb } from '../lib/db'
import { helpArticles, articleEmbeddings } from '../../shared/schema'
import { generateEmbedding, chunkText } from '../lib/embeddings'
import { eq } from 'drizzle-orm'

async function createEmbeddingsForAllArticles() {
  const db = await connectDb()
  const articles = await db.select().from(helpArticles)
  
  for (const article of articles) {
    const chunks = chunkText(article.content)
    
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i])
      
      await db.insert(articleEmbeddings).values({
        articleId: article.id,
        content: chunks[i],
        embedding: embedding,
        chunkIndex: i,
      })
    }
    
    console.log(`Created embeddings for: ${article.title}`)
  }
}

createEmbeddingsForAllArticles()
```

## API Endpoints

### POST `/api/chat`

Non-streaming chat endpoint.

**Request:**
```json
{
  "message": "How do I reset my password?",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "response": "To reset your password...",
  "sources": [
    {
      "articleId": "uuid",
      "url": "https://...",
      "title": "Password Reset Guide"
    }
  ],
  "confidence": 0.85,
  "requiresHuman": false,
  "clarificationNeeded": false,
  "sessionId": "session-uuid"
}
```

### POST `/api/chat/stream`

Streaming chat endpoint (Server-Sent Events).

**Request:** Same as above

**Response:** SSE stream với format:
```
data: {"type":"chunk","content":"To"}
data: {"type":"chunk","content":" reset"}
...
data: {"type":"done","sources":[...],"sessionId":"..."}
```

## Database Schema

### `help_articles`
Lưu trữ các bài viết help/support.

### `article_embeddings`
Lưu trữ embeddings (vectors) của các chunks từ help articles.
- `embedding`: vector(1536) - pgvector column
- Có HNSW index cho fast similarity search

### `chat_sessions`
Lưu trữ các chat sessions.

### `chat_messages`
Lưu trữ tất cả messages trong mỗi session.
- `sources`: JSONB array của article references
- `confidence`: Retrieval confidence score (0-1)
- `requiresHuman`: Flag nếu cần human support

## RAG Pipeline Flow

1. **User sends message** → Saved to `chat_messages`
2. **Generate query embedding** → Using OpenAI text-embedding-ada-002
3. **Vector search** → Find similar articles using pgvector cosine similarity
4. **Calculate confidence** → Average similarity score
5. **Decision logic:**
   - Low confidence (< 0.5) → Route to human
   - Medium confidence (0.5-0.75) → Ask clarifying question
   - High confidence (> 0.75) → Generate answer with DeepSeek AI
6. **Generate response** → DeepSeek AI với context từ retrieved articles
7. **Format with citations** → Add source links
8. **Save response** → To `chat_messages` với sources và confidence

## Development

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

## Production

```bash
npm run build
npm start
```

## Notes

- **Embeddings**: Sử dụng HuggingFace BAAI/bge-m3 model (1024 dimensions) qua Inference API. Model này hỗ trợ đa ngôn ngữ và xử lý văn bản dài tốt.
- **Vector Search**: Sử dụng cosine similarity với HNSW index cho performance tốt.
- **Confidence Thresholds**: Có thể điều chỉnh trong `lib/rag/pipeline.ts`:
  - `CONFIDENCE_THRESHOLD = 0.75`
  - `LOW_CONFIDENCE_THRESHOLD = 0.5`
- **Similarity Threshold**: Trong `lib/vector-search.ts`, `SIMILARITY_THRESHOLD = 0.7`

## Troubleshooting

### pgvector extension not found
- Đảm bảo đã chạy `CREATE EXTENSION vector;` trong Supabase SQL Editor

### Embedding dimension mismatch
- DeepSeek embedding = 1024 dimensions (mặc định)
- Có thể thay đổi qua env variable `DEEPSEEK_EMBEDDING_DIMENSIONS`
- Nếu dùng model khác, cần update `vector(1024)` trong schema và database

### Vector search returns no results
- Kiểm tra xem đã tạo embeddings cho articles chưa
- Giảm `SIMILARITY_THRESHOLD` nếu cần
- Kiểm tra embedding generation có thành công không

