# Hướng Dẫn Deploy Project Lên Vercel

Hướng dẫn chi tiết từng bước để deploy toàn bộ project (client + server) lên Vercel.

## 📋 Mục Lục

1. [Chuẩn Bị](#chuẩn-bị)
2. [Setup MongoDB Atlas](#setup-mongodb-atlas)
3. [Setup Google OAuth](#setup-google-oauth)
4. [Setup Slack Webhook](#setup-slack-webhook)
5. [Deploy Lên Vercel](#deploy-lên-vercel)
6. [Cấu Hình Environment Variables](#cấu-hình-environment-variables)
7. [Kiểm Tra và Test](#kiểm-tra-và-test)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Chuẩn Bị

### Yêu Cầu

- Tài khoản Vercel (đăng ký miễn phí tại: https://vercel.com)
- Tài khoản MongoDB Atlas (hoặc MongoDB database khác)
- Tài khoản Google Cloud (cho OAuth)
- Tài khoản Slack (cho webhook, optional)
- Git repository (GitHub, GitLab, hoặc Bitbucket)

### Cài Đặt Vercel CLI (Optional)

```bash
npm install -g vercel
```

Hoặc sử dụng Vercel Dashboard (khuyến nghị cho lần đầu).

---

## 🗄️ Setup MongoDB Atlas

### Bước 1: Tạo MongoDB Atlas Cluster

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký/Đăng nhập tài khoản
3. Click **"Build a Database"**
4. Chọn **FREE (M0)** tier
5. Chọn Cloud Provider và Region (gần bạn nhất)
6. Đặt tên cluster (ví dụ: `Cluster0`)
7. Click **"Create"**
8. Đợi 3-5 phút để cluster được tạo

### Bước 2: Tạo Database User

1. Vào tab **"Database Access"** (bên trái)
2. Click **"Add New Database User"**
3. Chọn **"Password"** authentication
4. Nhập:
   - Username: `siftly_user` (hoặc tên bạn muốn)
   - Password: Tạo password mạnh (lưu lại để dùng sau)
5. Database User Privileges: Chọn **"Read and write to any database"**
6. Click **"Add User"**

### Bước 3: Whitelist IP Address

1. Vào tab **"Network Access"** (bên trái)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0) - **Lưu ý:** Trong production, nên whitelist IP cụ thể của Vercel
4. Click **"Confirm"**

### Bước 4: Lấy Connection String

1. Vào tab **"Database"** (bên trái)
2. Click **"Connect"** trên cluster của bạn
3. Chọn **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy connection string, có dạng:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Thay `<username>` bằng username bạn đã tạo
7. Thay `<password>` bằng password bạn đã tạo
8. Thêm tên database vào cuối: `/siftly?retryWrites=true&w=majority`
9. Kết quả cuối cùng:
   ```
   mongodb+srv://siftly_user:your_password@cluster0.xxxxx.mongodb.net/siftly?retryWrites=true&w=majority
   ```

**Lưu lại connection string này để dùng ở bước sau.**

---

## 🔐 Setup Google OAuth

### Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Nếu chưa có OAuth consent screen:
   - Vào **OAuth consent screen**
   - Chọn **External** → **Create**
   - Điền thông tin cơ bản:
     - App name: `Siftly Admin`
     - User support email: Email của bạn
     - Developer contact: Email của bạn
   - Click **Save and Continue**
   - Thêm scopes: `email`, `profile`
   - Click **Save and Continue**
   - Thêm test users (nếu cần)
   - Click **Save and Continue**
6. Tạo OAuth Client ID:
   - Application type: **Web application**
   - Name: `Siftly Admin`
   - Authorized JavaScript origins:
     - `https://your-project.vercel.app` (sẽ cập nhật sau khi deploy)
   - Authorized redirect URIs:
     - `https://your-project.vercel.app/api/auth/google/callback` (sẽ cập nhật sau khi deploy)
   - Click **Create**
7. Copy **Client ID** và **Client Secret**

**Lưu lại Client ID và Client Secret để dùng ở bước sau.**

### Bước 2: Tạo Session Secret

Tạo một random string mạnh cho session secret:

```bash
# Trên macOS/Linux
openssl rand -base64 32

# Hoặc sử dụng online tool: https://randomkeygen.com/
```

**Lưu lại session secret này để dùng ở bước sau.**

---

## 📢 Setup Slack Webhook (Optional)

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

**Lưu lại Webhook URL này để dùng ở bước sau.**

---

## 🚀 Deploy Lên Vercel

### Cách 1: Deploy Qua Vercel Dashboard (Khuyến Nghị)

#### Bước 1: Push Code Lên Git Repository

1. Đảm bảo code đã được commit và push lên GitHub/GitLab/Bitbucket
2. Kiểm tra các file sau đã có trong repository:
   - `vercel.json`
   - `api/index.ts`
   - `package.json`
   - `server/` folder
   - `client/` folder

#### Bước 2: Import Project Vào Vercel

1. Truy cập: https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Chọn Git provider (GitHub/GitLab/Bitbucket)
4. Authorize Vercel nếu cần
5. Chọn repository của bạn
6. Click **"Import"**

#### Bước 3: Cấu Hình Build Settings

Vercel sẽ tự động detect cấu hình, nhưng bạn cần kiểm tra:

- **Framework Preset:** Other
- **Root Directory:** `./` (root của project)
- **Build Command:** `npm run build`
- **Output Directory:** `dist/public`
- **Install Command:** `npm install`

#### Bước 4: Thêm Environment Variables

Trong phần **"Environment Variables"**, thêm các biến sau:

| Key | Value | Mô tả |
|-----|-------|-------|
| `DATABASE_URL` | `mongodb+srv://...` | MongoDB connection string từ bước trước |
| `GOOGLE_CLIENT_ID` | `your_client_id` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `your_client_secret` | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | `https://your-project.vercel.app/api/auth/google/callback` | Callback URL (sẽ cập nhật sau) |
| `SESSION_SECRET` | `your_random_string` | Session secret từ bước trước |
| `ALLOWED_ADMIN_EMAILS` | `admin@example.com` | Email được phép login (optional, comma-separated) |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | Slack webhook URL (optional) |
| `NODE_ENV` | `production` | Environment |

**Lưu ý:** 
- `GOOGLE_CALLBACK_URL` sẽ cần cập nhật sau khi deploy xong (thay `your-project.vercel.app` bằng domain thực tế)
- Nếu không có `ALLOWED_ADMIN_EMAILS`, tất cả Google accounts đều có thể login
- `SLACK_WEBHOOK_URL` là optional, có thể bỏ qua nếu không cần

#### Bước 5: Deploy

1. Click **"Deploy"**
2. Đợi quá trình build và deploy hoàn tất (3-5 phút)
3. Sau khi deploy xong, bạn sẽ nhận được URL: `https://your-project.vercel.app`

### Cách 2: Deploy Qua Vercel CLI

#### Bước 1: Login Vercel

```bash
vercel login
```

#### Bước 2: Deploy

```bash
# Deploy lần đầu (sẽ hỏi các câu hỏi cấu hình)
vercel

# Deploy production
vercel --prod
```

#### Bước 3: Thêm Environment Variables

```bash
# Thêm từng biến
vercel env add DATABASE_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_CALLBACK_URL
vercel env add SESSION_SECRET
vercel env add ALLOWED_ADMIN_EMAILS
vercel env add SLACK_WEBHOOK_URL

# Hoặc thêm tất cả từ file .env (nếu có)
vercel env pull .env.production
```

---

## 🔧 Cấu Hình Environment Variables

### Sau Khi Deploy Xong

1. Lấy URL production của bạn (ví dụ: `https://siftly-app.vercel.app`)
2. Cập nhật các environment variables sau trong Vercel Dashboard:

#### 1. Cập Nhật GOOGLE_CALLBACK_URL

- Vào Vercel Dashboard → Project → Settings → Environment Variables
- Tìm `GOOGLE_CALLBACK_URL`
- Cập nhật thành: `https://your-actual-domain.vercel.app/api/auth/google/callback`
- Click **"Save"**

#### 2. Cập Nhật Google OAuth Redirect URI

- Vào Google Cloud Console → APIs & Services → Credentials
- Click vào OAuth Client ID của bạn
- Thêm vào **Authorized redirect URIs**:
  - `https://your-actual-domain.vercel.app/api/auth/google/callback`
- Click **"Save"**

#### 3. Redeploy

- Vào Vercel Dashboard → Project → Deployments
- Click **"..."** trên deployment mới nhất → **"Redeploy"**
- Hoặc push một commit mới để trigger auto-deploy

---

## ✅ Kiểm Tra và Test

### Bước 1: Kiểm Tra Homepage

1. Truy cập: `https://your-project.vercel.app`
2. Kiểm tra:
   - ✅ Trang chủ load được
   - ✅ Không có lỗi console
   - ✅ Images và assets load đúng

### Bước 2: Test Contact Form

1. Scroll xuống phần Contact Us
2. Click icon Contact Us (góc phải dưới)
3. Điền form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Company: `Test Company`
   - Message: `Test message`
   - Newsletter: Check hoặc không
4. Click **Submit**
5. Kiểm tra:
   - ✅ Form submit thành công
   - ✅ Modal đóng lại
   - ✅ Không có lỗi

### Bước 3: Test Admin Login

1. Truy cập: `https://your-project.vercel.app/admin/login`
2. Click **"Sign in with Google"**
3. Chọn Google account (phải trong `ALLOWED_ADMIN_EMAILS` nếu đã set)
4. Authorize
5. Kiểm tra:
   - ✅ Redirect về `/admin/contacts`
   - ✅ Hiển thị danh sách contacts
   - ✅ Không có lỗi

### Bước 4: Test Admin Panel

1. Trong trang `/admin/contacts`:
   - ✅ Sidebar hiển thị đúng
   - ✅ Top bar hiển thị user info
   - ✅ Contacts table hiển thị data
   - ✅ Search và filter hoạt động
   - ✅ Delete contact hoạt động

### Bước 5: Test Slack Notification (Nếu có)

1. Submit một contact form mới
2. Kiểm tra Slack channel:
   - ✅ Có thông báo mới
   - ✅ Hiển thị đúng thông tin contact

---

## 🔍 Troubleshooting

### Lỗi: "Build Failed"

**Nguyên nhân:** Build command hoặc dependencies có vấn đề

**Giải pháp:**
1. Kiểm tra logs trong Vercel Dashboard → Deployments → Build Logs
2. Đảm bảo `package.json` có đầy đủ dependencies
3. Kiểm tra `vercel.json` cấu hình đúng
4. Thử build local: `npm run build`

### Lỗi: "Cannot find module"

**Nguyên nhân:** Module chưa được install hoặc path sai

**Giải pháp:**
1. Kiểm tra `package.json` có module đó
2. Đảm bảo `npm install` chạy thành công
3. Kiểm tra import paths trong code

### Lỗi: "MongoDB connection failed"

**Nguyên nhân:** DATABASE_URL sai hoặc MongoDB chưa whitelist IP

**Giải pháp:**
1. Kiểm tra `DATABASE_URL` trong Vercel Environment Variables
2. Kiểm tra MongoDB Atlas → Network Access đã whitelist `0.0.0.0/0` (hoặc IP của Vercel)
3. Kiểm tra username/password trong connection string đúng

### Lỗi: "Google OAuth failed"

**Nguyên nhân:** Callback URL chưa được cấu hình đúng

**Giải pháp:**
1. Kiểm tra `GOOGLE_CALLBACK_URL` trong Vercel Environment Variables khớp với domain thực tế
2. Kiểm tra Google Cloud Console → OAuth Client → Authorized redirect URIs đã thêm đúng URL
3. Đảm bảo `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` đúng

### Lỗi: "Session not working"

**Nguyên nhân:** SESSION_SECRET chưa được set hoặc sai

**Giải pháp:**
1. Kiểm tra `SESSION_SECRET` trong Vercel Environment Variables
2. Tạo lại session secret mới nếu cần
3. Redeploy sau khi cập nhật

### Lỗi: "404 Not Found" cho routes

**Nguyên nhân:** Routing chưa được cấu hình đúng

**Giải pháp:**
1. Kiểm tra `vercel.json` có cấu hình `rewrites` đúng
2. Kiểm tra `api/index.ts` đã export handler đúng
3. Đảm bảo API routes bắt đầu với `/api/`

### Lỗi: "Static files not found"

**Nguyên nhân:** Build output directory sai

**Giải pháp:**
1. Kiểm tra `vite.config.ts` → `build.outDir` là `dist/public`
2. Kiểm tra Vercel Build Settings → Output Directory là `dist/public`
3. Kiểm tra `vercel.json` routes trỏ đúng path

### Lỗi: "CORS error"

**Nguyên nhân:** CORS chưa được cấu hình

**Giải pháp:**
1. Thêm CORS middleware vào Express app nếu cần
2. Kiểm tra API routes có trả về headers đúng

---

## 📝 Checklist Deploy

Trước khi deploy:
- [ ] Code đã được commit và push lên Git
- [ ] MongoDB Atlas cluster đã được tạo
- [ ] MongoDB connection string đã được lấy
- [ ] Google OAuth credentials đã được tạo
- [ ] Session secret đã được tạo
- [ ] Slack webhook URL đã được tạo (nếu cần)
- [ ] `vercel.json` đã được tạo
- [ ] `api/index.ts` đã được tạo

Trong quá trình deploy:
- [ ] Project đã được import vào Vercel
- [ ] Build settings đã được cấu hình đúng
- [ ] Tất cả environment variables đã được thêm
- [ ] Deploy đã hoàn tất thành công

Sau khi deploy:
- [ ] Homepage load được
- [ ] Contact form hoạt động
- [ ] Admin login hoạt động
- [ ] Admin panel hiển thị đúng
- [ ] MongoDB connection thành công
- [ ] Slack notification hoạt động (nếu có)
- [ ] Google OAuth callback URL đã được cập nhật
- [ ] Tất cả routes hoạt động đúng

---

## 🔄 Continuous Deployment

Vercel tự động deploy mỗi khi bạn push code lên Git repository:

1. Push code lên `main` branch → Auto deploy production
2. Push code lên branch khác → Tạo preview deployment
3. Merge PR → Auto deploy production

### Custom Domain

1. Vào Vercel Dashboard → Project → Settings → Domains
2. Thêm domain của bạn
3. Follow hướng dẫn để cấu hình DNS
4. Sau khi domain active, cập nhật:
   - `GOOGLE_CALLBACK_URL` trong Vercel Environment Variables
   - Authorized redirect URIs trong Google Cloud Console

---

## 📚 Tài Liệu Tham Khảo

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)

---

## 🆘 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra logs trong Vercel Dashboard → Deployments → Function Logs
2. Kiểm tra MongoDB Atlas → Logs
3. Kiểm tra Google Cloud Console → APIs & Services → OAuth consent screen
4. Xem lại các bước trong file này

**Chúc bạn deploy thành công! 🎉**
