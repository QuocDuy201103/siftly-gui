# Hướng Dẫn Cấu Hình Environment Variables

## Tạo file `.env.local`

Tạo file `.env.local` trong thư mục `chat-bot` với nội dung sau:

```env
# ============================================
# Supabase Database Configuration
# ============================================
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# ============================================
# Supabase Realtime (Human Handoff live chat)
# - SUPABASE_URL + keys lấy từ Supabase Dashboard → Project Settings → API
# - Service role key CHỈ dùng ở server (webhook), không bao giờ đưa vào frontend
# ============================================
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

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
# Zoho Desk Configuration
# (Dùng cho Human Handoff - chuyển giao cho nhân viên CSKH)
# ============================================
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_DESK_API_URL=https://desk.zoho.com/api/v1
ZOHO_ORG_ID=your-zoho-org-id
ZOHO_CLIENT_ID=your-zoho-client-id
ZOHO_CLIENT_SECRET=your-zoho-client-secret
ZOHO_REFRESH_TOKEN=your-zoho-refresh-token

# (Optional) Protect webhook endpoint: chat-bot/app/api/zoho/webhook
ZOHO_WEBHOOK_SECRET=your-random-secret-string

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

### 4. Zoho Desk API Credentials

Zoho Desk được sử dụng để tự động tạo ticket khi chatbot không thể trả lời hoặc người dùng yêu cầu nói chuyện với nhân viên.

#### Bước 1: Tạo Zoho API Application

1. Đăng nhập vào Zoho Developer Console: https://api-console.zoho.com/
2. Click **Add Client** → Chọn **Server-based Applications**
3. Điền thông tin trong form "Create New Client":
   - **Client Type**: Giữ nguyên "Server-based Applications" (đã chọn sẵn)
   - **Client Name**: `Siftly Chatbot Handoff` (hoặc tên khác dễ nhận biết)
   - **Homepage URL**: 
     - Development: `http://localhost:5000` (hoặc port bạn đang sử dụng)
     - Production: `https://yourdomain.com` (URL thực tế của ứng dụng)
   - **Authorized Redirect URIs**: 
     - Development: `http://localhost:5000/zoho/callback` (thay 5000 bằng port của bạn)
     - Production: `https://yourdomain.com/zoho/callback`
     - ⚠️ **Lưu ý quan trọng**: 
       - URI này phải khớp chính xác với URI bạn dùng trong bước lấy refresh token
       - Nếu bạn đang dùng port khác (ví dụ: 5000, 3000, 8080), hãy thay đổi cho phù hợp
     - Có thể thêm nhiều URI bằng cách click nút "+" bên cạnh (ví dụ: thêm cả localhost:3000 và localhost:5000)
4. Click **CREATE** (nút màu xanh ở góc dưới bên trái)
5. Sau khi tạo thành công, copy **Client ID** và **Client Secret** từ trang chi tiết

#### Bước 2: Lấy Refresh Token

1. Tạo URL authorization với các thông tin sau:
   ```
   https://accounts.zoho.com/oauth/v2/auth?scope=Desk.tickets.CREATE,Desk.contacts.READ&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=YOUR_REDIRECT_URI
   ```
   - Thay `YOUR_CLIENT_ID` bằng Client ID từ bước 1
   - Thay `YOUR_REDIRECT_URI` bằng Redirect URI đã đăng ký (ví dụ: `http://localhost:5000/zoho/callback` nếu bạn dùng port 5000)
   - ⚠️ **Quan trọng**: Redirect URI trong URL này phải khớp chính xác với URI đã đăng ký trong form "Authorized Redirect URIs"

2. Mở URL trong trình duyệt và đăng nhập Zoho
3. Chấp nhận quyền truy cập
4. Sau khi redirect, copy `code` từ URL (ví dụ: `?code=1000.xxxxx...`)

5. Sử dụng `code` để lấy refresh token:
   ```bash
   curl -X POST https://accounts.zoho.com/oauth/v2/token \
     -d "grant_type=authorization_code" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=YOUR_REDIRECT_URI" \
     -d "code=CODE_FROM_STEP_4"
   ```

6. Response sẽ chứa `refresh_token` - copy token này

#### Bước 3: Lấy Organization ID

Có nhiều cách để lấy Organization ID:

**Cách 1: Từ Zoho Desk Settings (Khuyến nghị)**
1. Đăng nhập vào Zoho Desk: https://desk.zoho.com/
2. Vào **Settings** (biểu tượng bánh răng ở góc trên bên phải)
3. Cuộn xuống phần **Developer Space** → Click **API**
4. Tìm **Organization ID** trong trang này (thường hiển thị dạng số hoặc chuỗi)
5. Copy Organization ID này

**Cách 2: Từ URL Zoho Desk**
1. Đăng nhập vào Zoho Desk: https://desk.zoho.com/
2. Kiểm tra URL trong trình duyệt, Organization ID thường nằm trong URL
3. Ví dụ: `https://desk.zoho.com/portal/123456789/tickets` → Organization ID là `123456789`

**Cách 3: Từ API Response**
1. Sử dụng một API call bất kỳ đến Zoho Desk API
2. Organization ID thường được trả về trong response headers hoặc response body
3. Hoặc kiểm tra trong URL của API endpoint

**Cách 4: Từ Zoho Developer Console**
1. Vào Zoho Developer Console: https://api-console.zoho.com/
2. Chọn ứng dụng bạn vừa tạo
3. Trong trang chi tiết, có thể tìm thấy Organization ID

**Lưu ý:**
- Organization ID có thể là số (ví dụ: `123456789`) hoặc chuỗi (ví dụ: `org123456789`)
- Format có thể khác nhau tùy theo region (US, EU, IN, AU, v.v.)
- Nếu bạn dùng Zoho Desk EU, URL sẽ là `https://desk.zoho.eu/`
- Nếu bạn dùng Zoho Desk IN, URL sẽ là `https://desk.zoho.in/`

#### Bước 4: Cấu hình trong .env.local

Thêm các biến sau vào `.env.local`:

```env
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_DESK_API_URL=https://desk.zoho.com/api/v1
ZOHO_ORG_ID=your-org-id-here
ZOHO_CLIENT_ID=your-client-id-here
ZOHO_CLIENT_SECRET=your-client-secret-here
ZOHO_REFRESH_TOKEN=your-refresh-token-here
ZOHO_DEPARTMENT_ID=your-department-id-here  # Optional but recommended
```

⚠️ **Lưu ý quan trọng về Refresh Token:**
- Refresh Token có thể được sử dụng để lấy Access Token mới
- Access Token chỉ có hiệu lực trong 1 giờ
- Hệ thống sẽ tự động refresh token khi cần
- **KHÔNG BAO GIỜ** commit refresh token vào Git

#### Bước 4: Lấy Department ID (Khuyến nghị)

Zoho Desk yêu cầu `departmentId` khi tạo ticket. Có 2 cách:

**Cách 1: Từ Zoho Desk UI**
1. Đăng nhập vào Zoho Desk: https://desk.zoho.com/
2. Vào **Settings** → **Departments**
3. Click vào department bạn muốn sử dụng
4. Kiểm tra URL hoặc ID trong trang chi tiết
5. Copy Department ID

**Cách 2: Từ API**
1. Sử dụng script helper: `npx tsx scripts/get-zoho-org-id.ts`
2. Hoặc gọi API: `GET https://desk.zoho.com/api/v1/departments`
3. Tìm Department ID trong response

**Lưu ý:**
- Department ID có thể là số hoặc chuỗi
- Nếu không có Department ID, ticket creation sẽ fail
- Thêm `ZOHO_DEPARTMENT_ID` vào `.env.local`

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

### Lỗi: "Zoho refresh token is not configured"
→ Kiểm tra:
- Đã tạo Zoho API application chưa?
- Đã lấy refresh token chưa?
- `ZOHO_REFRESH_TOKEN` có được set trong `.env.local` không?
- `ZOHO_ORG_ID`, `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET` có được set đúng không?

### Lỗi: "Failed to refresh Zoho token"
→ Kiểm tra:
- Refresh token có còn hợp lệ không?
- Client ID và Client Secret có đúng không?
- Zoho API có đang hoạt động không?

## Security Notes

⚠️ **QUAN TRỌNG**:
- **KHÔNG** commit file `.env.local` vào Git (đã có trong `.gitignore`)
- **KHÔNG** chia sẻ API keys công khai
- Sử dụng `.env.local` cho development
- Sử dụng environment variables trên hosting platform cho production

