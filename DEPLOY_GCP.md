# Deploy lên GCP (Cloud Run) – Siftly

Repo này có **2 runtime**:
- **App chính (root)**: Express + build Vite SPA (serve từ `dist/public`) + Admin OAuth/Contacts API.
- **Chatbot (`chat-bot/`)**: Next.js API (`/api/chat*`, `/api/zoho/webhook`) + (có thể) serve SPA từ `chat-bot/public`.

Khuyến nghị deploy **2 Cloud Run services** và để app chính **proxy** các route `/api/chat*` sang service `chat-bot` (đã có trong `server/routes.ts`).

---

## 0) Chuẩn bị

1) Cài `gcloud` CLI, đăng nhập:

```bash
gcloud auth login
gcloud auth application-default login
```

2) Chọn project + region (ví dụ `asia-southeast1`):

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region asia-southeast1
```

3) Enable APIs:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

---

## 1) Deploy `chat-bot` (Next.js) lên Cloud Run

### 1.1 Tạo secrets (khuyến nghị)

Khuyến nghị: import thẳng từ file `.env.local` của bạn bằng script PowerShell (Windows-friendly).

**Nếu bạn đang dùng Windows PowerShell (mặc định, `powershell.exe`)**:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\chat-bot\.env.local
```

**Nếu bạn đã cài PowerShell 7 (`pwsh`)**:

```powershell
pwsh -File .\scripts\gcp\import-env-to-secrets.ps1 -EnvFile .\chat-bot\.env.local
```

Script sẽ tự:
- Bỏ qua comments/blank lines
- Create secret nếu chưa có, hoặc add version nếu đã có
- In ra chuỗi `--set-secrets ...` để bạn copy vào lệnh `gcloud run deploy`

### 1.2 Deploy từ source

Chạy từ thư mục root repo.

**Lưu ý Windows PowerShell**:
- **Không dùng** `\` để xuống dòng (đó là cú pháp bash)
- PowerShell dùng **backtick** `` ` `` để xuống dòng, hoặc bạn chạy **1 dòng**.
- `--set-secrets` phải có dạng `ENV_VAR=SECRET_ID:latest` (không để trống).
- Trong PowerShell, **phải bọc quotes** cho chuỗi `--set-secrets` (và thường cả `--set-env-vars`) vì dấu `,` có thể bị PowerShell tách arguments.

**PowerShell (nhiều dòng)**:

```powershell
gcloud run deploy siftly-chat-bot `
  --source chat-bot `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,SUPABASE_URL=SUPABASE_URL:latest,VITE_SUPABASE_URL=VITE_SUPABASE_URL:latest,VITE_SUPABASE_ANON_KEY=VITE_SUPABASE_ANON_KEY:latest,DEEPSEEK_API_KEY=DEEPSEEK_API_KEY:latest,DEEPSEEK_API_URL=DEEPSEEK_API_URL:latest,HUGGINGFACE_API_KEY=HUGGINGFACE_API_KEY:latest,HUGGINGFACE_EMBEDDING_MODEL=HUGGINGFACE_EMBEDDING_MODEL:latest,HUGGINGFACE_API_URL=HUGGINGFACE_API_URL:latest,EMBEDDING_DIMENSIONS=EMBEDDING_DIMENSIONS:latest,ZOHO_ACCOUNTS_URL=ZOHO_ACCOUNTS_URL:latest,ZOHO_DESK_API_URL=ZOHO_DESK_API_URL:latest,ZOHO_ORG_ID=ZOHO_ORG_ID:latest,ZOHO_CLIENT_ID=ZOHO_CLIENT_ID:latest,ZOHO_CLIENT_SECRET=ZOHO_CLIENT_SECRET:latest,ZOHO_REFRESH_TOKEN=ZOHO_REFRESH_TOKEN:latest,ZOHO_DEPARTMENT_ID=ZOHO_DEPARTMENT_ID:latest,ZOHO_WEBHOOK_SECRET=ZOHO_WEBHOOK_SECRET:latest"
```
$PROJECT_ID = (gcloud config get-value project).Trim()
$IMAGE = "asia-southeast1-docker.pkg.dev/$PROJECT_ID/siftly/siftly-chat-bot:latest"

gcloud builds submit --region=asia-southeast1 --config .\cloudbuild.chat-bot.yaml --substitutions "_IMAGE=$IMAGE" .

gcloud run deploy siftly-chat-bot `
  --image $IMAGE `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,SUPABASE_URL=SUPABASE_URL:latest,VITE_SUPABASE_URL=VITE_SUPABASE_URL:latest,VITE_SUPABASE_ANON_KEY=VITE_SUPABASE_ANON_KEY:latest,DEEPSEEK_API_KEY=DEEPSEEK_API_KEY:latest,DEEPSEEK_API_URL=DEEPSEEK_API_URL:latest,HUGGINGFACE_API_KEY=HUGGINGFACE_API_KEY:latest,HUGGINGFACE_EMBEDDING_MODEL=HUGGINGFACE_EMBEDDING_MODEL:latest,HUGGINGFACE_API_URL=HUGGINGFACE_API_URL:latest,EMBEDDING_DIMENSIONS=EMBEDDING_DIMENSIONS:latest,ZOHO_ACCOUNTS_URL=ZOHO_ACCOUNTS_URL:latest,ZOHO_DESK_API_URL=ZOHO_DESK_API_URL:latest,ZOHO_ORG_ID=ZOHO_ORG_ID:latest,ZOHO_CLIENT_ID=ZOHO_CLIENT_ID:latest,ZOHO_CLIENT_SECRET=ZOHO_CLIENT_SECRET:latest,ZOHO_REFRESH_TOKEN=ZOHO_REFRESH_TOKEN:latest,ZOHO_DEPARTMENT_ID=ZOHO_DEPARTMENT_ID:latest,ZOHO_WEBHOOK_SECRET=ZOHO_WEBHOOK_SECRET:latest"
**PowerShell (1 dòng)**:

```powershell
gcloud run deploy siftly-chat-bot --source chat-bot --allow-unauthenticated --set-env-vars NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1 --set-secrets <PASTE_FROM_SCRIPT_OUTPUT>
```

### 1.3 Nếu build fail với `Can't resolve '../../shared/schema'`

Do `chat-bot` đang import `../../shared/*` nên deploy kiểu `--source chat-bot` sẽ **không có thư mục `shared/`** trong build context.

Cách ổn định nhất: build image bằng Dockerfile từ **repo root** (có copy cả `shared/`) rồi deploy bằng `--image`.

1) Tạo Artifact Registry repo (1 lần):

```powershell
gcloud artifacts repositories create siftly --repository-format=docker --location asia-southeast1
```

2) Build + push image:

```powershell
$PROJECT_ID = (gcloud config get-value project).Trim()
$IMAGE = "asia-southeast1-docker.pkg.dev/$PROJECT_ID/siftly/siftly-chat-bot:latest"
gcloud builds submit --region=asia-southeast1 --config .\cloudbuild.chat-bot.yaml --substitutions "_IMAGE=$IMAGE" .
```

3) Deploy Cloud Run từ image (vẫn dùng secrets như cũ):

```powershell
gcloud run deploy siftly-chat-bot `
  --image $IMAGE `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" `
  --set-secrets "<PASTE_FROM_SCRIPT_OUTPUT>"
```

Sau khi deploy xong, bạn sẽ có URL kiểu:
- `https://siftly-chat-bot-xxxxx-<region>.a.run.app`

---

## 2) Deploy app chính (root) lên Cloud Run

App chính serve web + `/api/auth/*`, `/api/contact`, `/api/contacts/*`.
Các route chatbot `/api/chat*` và `/api/zoho/webhook` sẽ được **proxy** sang `chat-bot` theo env `CHATBOT_BASE_URL`.

### 2.1 Tạo secrets cần cho app chính

Thường dùng:
- `DATABASE_URL` (nếu app chính cũng connect DB)
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (phải trỏ về URL Cloud Run của app chính)

### 2.2 Deploy từ source

**PowerShell (nhiều dòng)**:

```powershell
$CHATBOT_URL = "https://siftly-chat-bot-29216080826.asia-southeast1.run.app"
gcloud run deploy siftly-web `
  --source . `
  --region asia-southeast1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,CHATBOT_BASE_URL=$CHATBOT_URL" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,VITE_SUPABASE_URL=VITE_SUPABASE_URL:latest,VITE_SUPABASE_ANON_KEY=VITE_SUPABASE_ANON_KEY:latest,SLACK_WEBHOOK_URL=SLACK_WEBHOOK_URL:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,GOOGLE_CALLBACK_URL=GOOGLE_CALLBACK_URL:latest,ALLOWED_ADMIN_EMAILS=ALLOWED_ADMIN_EMAILS:latest"
```

**PowerShell (1 dòng)**:

```powershell
gcloud run deploy siftly-web --source . --allow-unauthenticated --set-env-vars NODE_ENV=production,CHATBOT_BASE_URL=https://<YOUR_CHAT_BOT_URL> --set-secrets DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,GOOGLE_CALLBACK_URL=GOOGLE_CALLBACK_URL:latest
```

### 2.3 Set Google OAuth callback đúng

Trong Google Cloud Console (OAuth client), callback nên là:
- `https://<siftly-web-url>/api/auth/google/callback`

Và set env `GOOGLE_CALLBACK_URL` tương ứng (hoặc để code tự dùng giá trị env bạn set).
$NEW = "https://siftly-web-29216080826.asia-southeast1.run.app/api/auth/google/callback"
$NEW | gcloud secrets versions add GOOGLE_CALLBACK_URL --data-file=-

---

## 3) Kiểm tra nhanh sau deploy

- Mở URL `siftly-web` → UI load bình thường.
- Vào `/admin/login` → thử Google OAuth.
- Mở chat widget → gọi `/api/chat` **trên cùng domain** của `siftly-web` (sẽ proxy sang `chat-bot`).
- Nếu dùng Zoho webhook: cấu hình webhook bắn vào:
  - `https://<siftly-web-url>/api/zoho/webhook` (proxy) **hoặc**
  - `https://<siftly-chat-bot-url>/api/zoho/webhook` (gọi trực tiếp)

---

## 4) Notes thường gặp

- **Cloud Run tự set `PORT=8080`**; app đã listen theo `process.env.PORT` nên OK.
- **Vite env (`VITE_...`) là build-time**. Repo đã chuyển chat API sang **relative path `/api/...`** để không cần build-time URL.
- Nếu bạn muốn private services: bỏ `--allow-unauthenticated` và đặt IAM/invoker riêng.


