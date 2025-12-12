# Hướng Dẫn Setup Database Supabase

Hướng dẫn chi tiết từng bước để setup Supabase PostgreSQL database cho dự án này.

## Bước 1: Tạo Supabase Project

1. **Truy cập Supabase:**
   - Vào: https://supabase.com/
   - Click **"Start your project"** hoặc **"Sign in"** nếu đã có tài khoản

2. **Tạo Project mới:**
   - Click **"New Project"**
   - Chọn Organization (hoặc tạo mới)
   - Điền thông tin:
     - **Name**: `siftly` (hoặc tên bạn muốn)
     - **Database Password**: Tạo password mạnh (lưu lại để dùng sau)
     - **Region**: Chọn region gần bạn nhất
     - **Pricing Plan**: Chọn **Free** (hoặc Pro nếu cần)
   - Click **"Create new project"**
   - Đợi 2-3 phút để project được setup

3. **Lấy Connection String:**
   - Vào **Project Settings** (icon bánh răng ở sidebar)
   - Vào tab **Database**
   - Tìm phần **Connection string**
   - Chọn **URI** tab
   - Copy connection string, có dạng:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```
   - Thay `[YOUR-PASSWORD]` bằng password bạn đã tạo khi tạo project
   - Kết quả cuối cùng:
     ```
     postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
     ```

---

## Bước 2: Set DATABASE_URL

### Cách 1: Tạo file .env (Khuyến nghị)

1. **Tạo file `.env`** trong root directory của project:
   ```
   e:\AMY_Technology_LLC\1-siftly\.env
   ```

2. **Thêm DATABASE_URL và các biến khác vào file:**
   ```
   DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
   
   # Slack Webhook URL (optional)
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   
   # Google OAuth (cho Admin Login)
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   
   # Session Secret (tạo random string)
   SESSION_SECRET=your-random-session-secret-key-here
   
   # Allowed Admin Emails (optional, comma-separated)
   ALLOWED_ADMIN_EMAILS=admin@example.com
   ```

3. **Lưu file**

### Cách 2: Set Environment Variable trong Terminal

#### Windows (PowerShell):
```powershell
$env:DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres"
$env:SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

#### Windows (CMD):
```cmd
set DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
```

#### macOS/Linux:
```bash
export DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres"
```

---

## Bước 3: Cài đặt Dependencies

Đảm bảo các packages đã được cài đặt:

```bash
npm install
```

Kiểm tra `package.json` có:
- `drizzle-orm`: ^0.39.1
- `drizzle-kit`: ^0.31.4 (trong devDependencies)
- `postgres`: ^3.4.5

---

## Bước 4: Tạo Database Schema

Sau khi set DATABASE_URL, chạy lệnh để push schema lên database:

```bash
npm run db:push
```

Lệnh này sẽ:
- Đọc schema từ `shared/schema.ts`
- Tạo các bảng `users` và `contacts` trong Supabase
- Tự động tạo migrations nếu cần

---

## Bước 5: Kiểm tra Kết nối

1. **Chạy server:**
   ```bash
   npm run dev
   ```

2. **Kiểm tra log:**
   - Nếu thành công, bạn sẽ thấy:
     ```
     Supabase PostgreSQL connected successfully
     serving on port 5000
     ```
   
   - Nếu có lỗi, kiểm tra:
     - DATABASE_URL đã được set đúng chưa
     - Password trong connection string đúng chưa
     - Project Supabase đang active

---

## Bước 6: Verify Tables

Sau khi chạy `npm run db:push` và ứng dụng, các tables sẽ được tạo:

1. **Kiểm tra bằng Supabase Dashboard:**
   - Vào Supabase project
   - Click **Table Editor** ở sidebar
   - Bạn sẽ thấy 2 tables: `users` và `contacts`

2. **Kiểm tra bằng SQL Editor:**
   - Vào **SQL Editor** trong Supabase Dashboard
   - Chạy query:
     ```sql
     SELECT * FROM users;
     SELECT * FROM contacts;
     ```

---

## Troubleshooting

### Lỗi: "DATABASE_URL environment variable is not set"

**Nguyên nhân:** Environment variable chưa được set

**Giải pháp:**
- Tạo file `.env` với DATABASE_URL
- Hoặc set environment variable trong terminal

### Lỗi: "password authentication failed"

**Nguyên nhân:** Password trong connection string sai

**Giải pháp:**
- Kiểm tra lại password trong connection string
- Lấy lại password từ Supabase Dashboard → Settings → Database
- Hoặc reset password trong Supabase Dashboard

### Lỗi: "Connection timeout" hoặc "ECONNREFUSED"

**Nguyên nhân:** Không thể kết nối đến Supabase server

**Giải pháp:**
- Kiểm tra internet connection
- Kiểm tra Supabase project đang active (không bị pause)
- Kiểm tra connection string đúng format
- Kiểm tra firewall/network settings

### Lỗi: "relation does not exist"

**Nguyên nhân:** Tables chưa được tạo

**Giải pháp:**
```bash
npm run db:push
```

### Lỗi: "Cannot find module 'postgres'"

**Nguyên nhân:** Package chưa được cài đặt

**Giải pháp:**
```bash
npm install postgres drizzle-orm drizzle-kit
```

---

## Cấu trúc Database

### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Table: `contacts`
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Lưu ý Bảo mật

1. **Không commit file `.env`** vào Git
   - File `.env` đã có trong `.gitignore`
   - Không chia sẻ connection string công khai

2. **Bảo vệ Database Credentials:**
   - Sử dụng strong password cho database
   - Không hardcode credentials trong code
   - Sử dụng environment variables
   - Sử dụng Supabase Row Level Security (RLS) nếu cần

3. **Network Security:**
   - Supabase tự động bảo vệ với SSL/TLS
   - Connection string đã bao gồm SSL
   - Không cần whitelist IP như MongoDB Atlas

4. **Backup:**
   - Supabase Free tier có daily backups tự động
   - Có thể export data từ Supabase Dashboard
   - Sử dụng `pg_dump` để backup thủ công nếu cần

---

## Tài liệu Tham khảo

- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

## Checklist Setup

- [ ] Supabase project đã được tạo
- [ ] Database password đã được lưu lại
- [ ] Connection string đã được lấy
- [ ] DATABASE_URL đã được set (file .env hoặc environment variable)
- [ ] Dependencies đã được cài đặt (`npm install`)
- [ ] Schema đã được push (`npm run db:push`)
- [ ] Server chạy thành công (`npm run dev`)
- [ ] Log hiển thị "Supabase PostgreSQL connected successfully"
- [ ] Tables đã được tạo trong Supabase Dashboard
- [ ] Test submit form Contact Us thành công

---

## Setup Slack Webhook (Optional)

Để nhận thông báo khi có form contact mới, bạn cần setup Slack Webhook:

### Bước 1: Tạo Slack App

1. Truy cập: https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Đặt tên app (ví dụ: "Siftly Contact Notifications")
4. Chọn workspace của bạn
5. Click **"Create App"**

### Bước 2: Tạo Incoming Webhook

1. Trong app settings, vào **"Incoming Webhooks"** (bên trái)
2. Bật **"Activate Incoming Webhooks"**
3. Click **"Add New Webhook to Workspace"**
4. Chọn channel bạn muốn nhận thông báo
5. Click **"Allow"**
6. Copy **Webhook URL** (có dạng: `https://hooks.slack.com/services/...`)

### Bước 3: Thêm vào .env

Thêm vào file `.env`:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Bước 4: Test

Sau khi setup, mỗi khi có form contact mới:
- Dữ liệu sẽ được lưu vào database
- Thông báo sẽ được gửi đến Slack channel đã chọn

**Lưu ý:** Nếu không set `SLACK_WEBHOOK_URL`, ứng dụng vẫn hoạt động bình thường, chỉ không gửi thông báo Slack.

---

## Setup Google OAuth cho Admin Login

Để bảo vệ trang admin, bạn cần setup Google OAuth:

### Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Nếu chưa có OAuth consent screen:
   - Vào **OAuth consent screen**
   - Chọn **External** → **Create**
   - Điền thông tin cơ bản (App name, User support email, Developer contact)
   - Click **Save and Continue**
   - Thêm scopes: `email`, `profile`
   - Thêm test users (nếu cần)
   - Click **Save and Continue**
6. Tạo OAuth Client ID:
   - Application type: **Web application**
   - Name: `Siftly Admin`
   - Authorized JavaScript origins:
     - `http://localhost:5000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
   - Click **Create**
7. Copy **Client ID** và **Client Secret**

### Bước 2: Thêm vào file .env

Thêm các biến sau vào file `.env`:

```
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Session Secret (tạo random string)
SESSION_SECRET=your-random-session-secret-key-here

# Allowed Admin Emails (optional, comma-separated)
# Nếu không set, tất cả Google accounts đều có thể login
ALLOWED_ADMIN_EMAILS=admin@example.com,another@example.com
```

### Bước 3: Test Login

1. Restart server: `npm run dev`
2. Truy cập: `http://localhost:5000/admin/login`
3. Click **Sign in with Google**
4. Chọn Google account và authorize
5. Sau khi login thành công, bạn sẽ được redirect đến `/admin/contacts`

### Lưu ý:

- **ALLOWED_ADMIN_EMAILS**: Nếu set, chỉ những email này mới có thể login. Nếu không set, tất cả Google accounts đều có thể login.
- **SESSION_SECRET**: Nên dùng random string mạnh trong production. Có thể generate bằng: `openssl rand -base64 32`
- **GOOGLE_CALLBACK_URL**: Phải khớp với redirect URI đã set trong Google Cloud Console

---

## Migration từ MongoDB

Nếu bạn đang migrate từ MongoDB, các thay đổi chính:

1. **Schema**: Từ Mongoose schemas sang Drizzle schemas
2. **Connection**: Từ MongoDB connection string sang PostgreSQL connection string
3. **Queries**: Từ Mongoose queries sang Drizzle queries
4. **ID**: Từ `_id` (ObjectId) sang `id` (UUID)

Sau khi migrate:
- Chạy `npm run db:push` để tạo tables
- Dữ liệu cũ cần được migrate thủ công nếu có

---

**Chúc bạn setup thành công! 🎉**
