# Hướng Dẫn Setup RAG Chatbot

## Tổng Quan

Hệ thống RAG Chatbot đã được tích hợp với:
- ✅ Next.js/TypeScript API routes
- ✅ Supabase PostgreSQL với pgvector
- ✅ DeepSeek AI cho text generation
- ✅ OpenAI cho embeddings
- ✅ Chat history lưu trong Supabase
- ✅ Confidence scoring và routing logic
- ✅ Citations (links đến help articles)

## Bước 1: Cài Đặt Dependencies

```bash
cd chat-bot
npm install
```

## Bước 2: Cấu Hình Environment Variables

Tạo file `.env.local` trong thư mục `chat-bot`:

```env
# Supabase Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# DeepSeek AI (for chat completions)
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions

# HuggingFace (for embeddings - BAAI/bge-m3)
HUGGINGFACE_API_KEY=your-huggingface-api-key-here
HUGGINGFACE_EMBEDDING_MODEL=BAAI/bge-m3
HUGGINGFACE_API_URL=https://router.huggingface.co/hf-inference/models/BAAI/bge-m3/pipeline/feature-extraction
EMBEDDING_DIMENSIONS=1024

# Optional
NODE_ENV=development
```

### Lấy API Keys:

1. **Supabase DATABASE_URL**:
   - Vào Supabase Dashboard → Settings → Database
   - Copy Connection string (URI format)
   - Thay `[YOUR-PASSWORD]` bằng password của bạn

2. **DeepSeek API Key**:
   - Đăng ký tại: https://platform.deepseek.com/
   - Vào Settings → API Keys để tạo key

3. **HuggingFace API Key**:
   - Đăng ký tại: https://huggingface.co/
   - Vào Settings → Access Tokens: https://huggingface.co/settings/tokens
   - Tạo token mới với quyền **Read**

📖 Xem chi tiết trong file `ENV_SETUP.md`

## Bước 3: Setup Database

### 3.1. Enable pgvector Extension

1. Vào Supabase Dashboard → SQL Editor
2. Chạy:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3.2. Tạo Tables

Từ thư mục `chat-bot`:
```bash
npm run db:push
```

Hoặc từ root directory của project:
```bash
cd ..
npm run db:push
```

Hoặc chạy SQL thủ công từ file `chat-bot/setup-database.sql`

## Bước 4: Thêm Help Articles

### Cách 1: Sử dụng script (Khuyến nghị)

```bash
cd chat-bot
npx tsx scripts/add-help-article.ts "Title" "Content here..." "https://example.com/article" "category"
```

### Cách 2: Insert trực tiếp vào database

```sql
INSERT INTO help_articles (title, content, url, category)
VALUES (
  'How to Reset Password',
  'To reset your password, go to the login page and click Forgot Password...',
  'https://example.com/password-reset',
  'Account'
);
```

## Bước 5: Tạo Embeddings

Sau khi có help articles, tạo embeddings:

```bash
cd chat-bot
npx tsx scripts/create-embeddings.ts
```

Script này sẽ:
- Lấy tất cả help articles
- Chunk content thành các phần nhỏ
- Tạo embeddings cho mỗi chunk
- Lưu vào `article_embeddings` table

## Bước 6: Chạy Development Server

```bash
cd chat-bot
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

## Bước 7: Test API

### Test với curl:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I reset my password?"
  }'
```

### Test streaming:

```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I reset my password?"
  }'
```

## Cấu Trúc Files

```
chat-bot/
├── app/
│   └── api/
│       └── chat/
│           ├── route.ts          # Non-streaming endpoint
│           └── stream/
│               └── route.ts      # Streaming endpoint
├── lib/
│   ├── db.ts                     # Database connection
│   ├── embeddings.ts             # Embedding generation
│   ├── vector-search.ts          # Vector similarity search
│   ├── deepseek.ts               # DeepSeek AI integration
│   ├── chat-history.ts           # Chat history management
│   └── rag/
│       └── pipeline.ts           # RAG pipeline logic
├── scripts/
│   ├── add-help-article.ts       # Add help article utility
│   └── create-embeddings.ts      # Create embeddings utility
├── setup-database.sql            # SQL setup script
├── README.md                     # Documentation
├── API_USAGE.md                  # API usage guide
└── package.json
```

## RAG Pipeline Flow

1. **User gửi message** → Lưu vào `chat_messages`
2. **Generate query embedding** → OpenAI text-embedding-ada-002
3. **Vector search** → Tìm articles tương tự với pgvector
4. **Calculate confidence** → Average similarity score
5. **Decision:**
   - Confidence < 0.5 → Route to human
   - Confidence 0.5-0.75 → Ask clarifying question
   - Confidence > 0.75 → Generate answer
6. **Generate response** → DeepSeek AI với context
7. **Add citations** → Format response với source links
8. **Save response** → Lưu vào `chat_messages`

## Confidence Thresholds

Có thể điều chỉnh trong `lib/rag/pipeline.ts`:

```typescript
const CONFIDENCE_THRESHOLD = 0.75      // Minimum để answer trực tiếp
const LOW_CONFIDENCE_THRESHOLD = 0.5    // Dưới đây → route to human
```

Và trong `lib/vector-search.ts`:

```typescript
const SIMILARITY_THRESHOLD = 0.7        // Minimum similarity score
```

## Troubleshooting

### Lỗi: "pgvector extension not found"
→ Chạy `CREATE EXTENSION vector;` trong Supabase SQL Editor

### Lỗi: "No results from vector search"
→ Kiểm tra:
1. Đã tạo embeddings chưa? (`npx tsx scripts/create-embeddings.ts`)
2. Có help articles trong database không?
3. Giảm `SIMILARITY_THRESHOLD` nếu cần

### Lỗi: "Embedding dimension mismatch"
→ DeepSeek embedding mặc định là 1024 dimensions
→ Nếu dùng model khác, cần update `vector(1024)` trong schema và database
→ Có thể set `DEEPSEEK_EMBEDDING_DIMENSIONS` trong env nếu model của bạn khác

### Lỗi: "Cannot find module 'next/server'"
→ Chạy `npm install` trong thư mục `chat-bot`

## Next Steps

1. ✅ Setup hoàn tất
2. Thêm nhiều help articles
3. Tạo embeddings cho tất cả articles
4. Test với các câu hỏi khác nhau
5. Tùy chỉnh confidence thresholds nếu cần
6. Tích hợp vào frontend (xem `API_USAGE.md`)

## Production Deployment

1. Set environment variables trên hosting platform
2. Build: `npm run build`
3. Start: `npm start`
4. Đảm bảo Supabase connection string đúng
5. Enable pgvector extension trong production database

