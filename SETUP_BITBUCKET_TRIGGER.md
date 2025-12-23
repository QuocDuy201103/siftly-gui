# Setup Cloud Build Trigger từ Bitbucket

Hướng dẫn thiết lập Cloud Build trigger để tự động build và deploy khi có code push lên Bitbucket.

---

## Prerequisites

1. Đã có repository trên Bitbucket
2. Đã có GCP project với Cloud Build API enabled
3. Đã có Artifact Registry repository ở region `us-west1`
4. Đã có secrets trong Secret Manager

---

## Bước 1: Kết nối Bitbucket với GCP

1. **Mở Cloud Build Console:**
   - Vào: https://console.cloud.google.com/cloud-build/triggers
   - Chọn project: `siftly-backend-dev`

2. **Connect Repository:**
   - Click **"Connect Repository"**
   - Chọn **Bitbucket Cloud** hoặc **Bitbucket Server**
   - Authorize và chọn repository của bạn
   - Click **Connect**

---

## Bước 2: Tạo Trigger cho Chat-bot

1. **Tạo trigger mới:**
   - Click **"Create Trigger"**
   - **Name**: `siftly-chat-bot-trigger`
   - **Event**: Push to a branch
   - **Source**: Chọn repository đã connect
   - **Branch**: `^main$` (hoặc branch bạn muốn)

2. **Configuration:**
   - **Type**: Cloud Build configuration file
   - **Location**: Repository
   - **Cloud Build configuration file location**: `cloudbuild.chat-bot.yaml`

3. **Substitution variables:**
   ```
   _REGION=us-west1
   _SERVICE_NAME=siftly-chat-bot
   _IMAGE=us-west1-docker.pkg.dev/siftly-backend-dev/siftly/siftly-chat-bot:latest
   ```

4. **Service account**: Để mặc định hoặc chọn service account có quyền:
   - Cloud Run Admin
   - Secret Manager Secret Accessor
   - Artifact Registry Writer

5. Click **Create**

---

## Bước 3: Tạo Trigger cho Main App

1. **Tạo trigger mới:**
   - Click **"Create Trigger"**
   - **Name**: `siftly-web-trigger`
   - **Event**: Push to a branch
   - **Source**: Chọn repository đã connect
   - **Branch**: `^main$` (hoặc branch bạn muốn)

2. **Configuration:**
   - **Type**: Cloud Build configuration file
   - **Location**: Repository
   - **Cloud Build configuration file location**: `cloudbuild.yaml`

3. **Substitution variables:**
   ```
   _REGION=us-west1
   _SERVICE_NAME=siftly-web
   _IMAGE=us-west1-docker.pkg.dev/siftly-backend-dev/siftly/siftly-web:latest
   _CHATBOT_BASE_URL=https://siftly-chat-bot-29216080826.us-west1.run.app
   ```
   > **Lưu ý**: Thay `_CHATBOT_BASE_URL` bằng URL thực tế của chat-bot service

4. **Service account**: Để mặc định hoặc chọn service account có quyền

5. Click **Create**

---

## Bước 4: Test Trigger

1. **Push code lên Bitbucket:**
   ```bash
   git add .
   git commit -m "Test Cloud Build trigger"
   git push origin main
   ```

2. **Kiểm tra build:**
   - Vào: https://console.cloud.google.com/cloud-build/builds
   - Bạn sẽ thấy build tự động chạy
   - Xem logs để đảm bảo build thành công

---

## Cấu trúc Files

```
.
├── cloudbuild.yaml              # Build & deploy main app
├── cloudbuild.chat-bot.yaml     # Build & deploy chat-bot
├── Dockerfile                   # Dockerfile cho main app
└── Dockerfile.chat-bot          # Dockerfile cho chat-bot
```

---

## Lưu ý

1. **Thứ tự deploy:**
   - Nên deploy chat-bot trước, sau đó deploy main app
   - Main app cần `CHATBOT_BASE_URL` để proxy requests

2. **Update CHATBOT_BASE_URL:**
   - Nếu chat-bot URL thay đổi, cần update substitution variable trong trigger của main app

3. **Branch filtering:**
   - Có thể tạo trigger riêng cho các branch khác nhau (dev, staging, production)
   - Sử dụng regex pattern: `^dev$`, `^staging$`, `^main$`

4. **Manual trigger:**
   - Có thể chạy trigger thủ công từ Cloud Build Console
   - Hoặc dùng lệnh:
     ```bash
     gcloud builds triggers run siftly-chat-bot-trigger --branch main
     ```

---

## Troubleshooting

### Build fails với "permission denied"
- Kiểm tra service account có đủ quyền:
  - Cloud Run Admin
  - Secret Manager Secret Accessor
  - Artifact Registry Writer

### Build fails với "secret not found"
- Đảm bảo secrets đã được tạo trong Secret Manager
- Kiểm tra tên secret trong `cloudbuild.yaml` khớp với tên trong Secret Manager

### Deploy fails với "service not found"
- Service sẽ được tạo tự động lần đầu
- Nếu vẫn lỗi, kiểm tra service account có quyền Cloud Run Admin

---

## Tài liệu tham khảo

- Cloud Build Triggers: https://cloud.google.com/build/docs/triggers
- Bitbucket Integration: https://cloud.google.com/build/docs/bitbucket
- Cloud Run Deployment: https://cloud.google.com/run/docs/deploying

