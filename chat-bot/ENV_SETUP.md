# Hướng Dẫn Cấu Hình Environment Variables

## Tạo file `.env.local`

Tạo file `.env.local` trong thư mục `chat-bot` với nội dung sau:

```env
# ============================================
# Supabase Database Configuration
# ============================================
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# ============================================
# DeepSeek AI Configuration
# (Dùng cho chat completions - text generation)
# ============================================
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions

# ============================================
# HuggingFace Configuration
# (Dùng cho embeddings - BAAI/bge-m3)
# ============================================
HUGGINGFACE_API_KEY=your-huggingface-api-key-here
HUGGINGFACE_EMBEDDING_MODEL=BAAI/bge-m3
HUGGINGFACE_API_URL=https://router.huggingface.co/hf-inference/models/BAAI/bge-m3/pipeline/feature-extraction
EMBEDDING_DIMENSIONS=1024

# ============================================
# Optional Settings
# ============================================
NODE_ENV=development
# DEBUG_EMBEDDINGS=false  # Uncomment để debug embedding responses
```

## Cách Lấy API Keys

### 1. Supabase DATABASE_URL

1. Vào Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **Database**
4. Tìm **Connection string** → Chọn tab **URI**
5. Copy connection string và thay `[YOUR-PASSWORD]` bằng password của bạn

Format: `postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres`

### 2. DeepSeek API Key

1. Đăng ký/Đăng nhập tại: https://platform.deepseek.com/
2. Vào **Settings** → **API Keys**
3. Tạo API key mới hoặc copy key hiện có
4. Paste vào `DEEPSEEK_API_KEY`

### 3. HuggingFace API Key

1. Đăng ký/Đăng nhập tại: https://huggingface.co/
2. Vào **Settings** → **Access Tokens**: https://huggingface.co/settings/tokens
3. Click **New token**
4. Đặt tên token (ví dụ: "siftly-chatbot")
5. Chọn quyền **Read** (đủ cho embeddings)
6. Click **Generate token**
7. Copy token và paste vào `HUGGINGFACE_API_KEY`

⚠️ **Lưu ý**: Copy token ngay vì không thể xem lại sau khi đóng trang!

## Vị Trí File .env.local

File `.env.local` có thể đặt ở một trong các vị trí sau (script sẽ tự động tìm):

1. `chat-bot/.env.local` (khuyến nghị)
2. `../.env.local` (root directory)
3. `chat-bot/.env`
4. `../.env` (root directory)

## Kiểm Tra Cấu Hình

Sau khi tạo file `.env.local`, bạn có thể test bằng cách chạy:

```bash
cd chat-bot
npx tsx scripts/create-embeddings.ts
```

Nếu thiếu biến môi trường, script sẽ báo lỗi cụ thể.

## Troubleshooting

### Lỗi: "DATABASE_URL environment variable is not set"
→ Kiểm tra:
- File `.env.local` có tồn tại không?
- `DATABASE_URL` có được set đúng không?
- File có nằm đúng vị trí không?

### Lỗi: "HUGGINGFACE_API_KEY environment variable is not set"
→ Kiểm tra:
- Đã tạo HuggingFace token chưa?
- Token có quyền Read không?
- `HUGGINGFACE_API_KEY` có được set trong `.env.local` không?

### Lỗi: "DEEPSEEK_API_KEY environment variable is not set"
→ Kiểm tra:
- Đã tạo DeepSeek API key chưa?
- `DEEPSEEK_API_KEY` có được set trong `.env.local` không?

## Security Notes

⚠️ **QUAN TRỌNG**:
- **KHÔNG** commit file `.env.local` vào Git (đã có trong `.gitignore`)
- **KHÔNG** chia sẻ API keys công khai
- Sử dụng `.env.local` cho development
- Sử dụng environment variables trên hosting platform cho production

