# Setup Cloud Build Trigger from Bitbucket

Guide to set up Cloud Build trigger for automatic build and deployment when code is pushed to Bitbucket.

---

## Prerequisites

1. Have a repository on Bitbucket
2. Have a GCP project with Cloud Build API enabled
3. Have an Artifact Registry repository in region `us-west1`
4. Have secrets in Secret Manager

---

## Step 1: Connect Bitbucket to GCP

1. **Open Cloud Build Console:**
   - Go to: https://console.cloud.google.com/cloud-build/triggers
   - Select project: `siftly-backend-dev`

2. **Connect Repository:**
   - Click **"Connect Repository"**
   - Select **Bitbucket Cloud** or **Bitbucket Server**
   - Authorize and select your repository
   - Click **Connect**

---

## Step 2: Create Trigger for Chat-bot

1. **Create new trigger:**
   - Click **"Create Trigger"**
   - **Name**: `siftly-chat-bot-trigger`
   - **Event**: Push to a branch
   - **Source**: Select the connected repository
   - **Branch**: `^main$` (or your desired branch)

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

4. **Service account**: Use default or select a service account with permissions:
   - Cloud Run Admin
   - Secret Manager Secret Accessor
   - Artifact Registry Writer

5. Click **Create**

---

## Step 3: Create Trigger for Main App

1. **Create new trigger:**
   - Click **"Create Trigger"**
   - **Name**: `siftly-web-trigger`
   - **Event**: Push to a branch
   - **Source**: Select the connected repository
   - **Branch**: `^main$` (or your desired branch)

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
   > **Note**: Replace `_CHATBOT_BASE_URL` with the actual chat-bot service URL

4. **Service account**: Use default or select a service account with permissions

5. Click **Create**

---

## Step 4: Test Trigger

1. **Push code to Bitbucket:**
   ```bash
   git add .
   git commit -m "Test Cloud Build trigger"
   git push origin main
   ```

2. **Check build:**
   - Go to: https://console.cloud.google.com/cloud-build/builds
   - You will see the build running automatically
   - Check logs to ensure build succeeds

---

## File Structure

```
.
├── cloudbuild.yaml              # Build & deploy main app
├── cloudbuild.chat-bot.yaml     # Build & deploy chat-bot
├── Dockerfile                   # Dockerfile for main app
└── Dockerfile.chat-bot          # Dockerfile for chat-bot
```

---

## Notes

1. **Deployment order:**
   - Should deploy chat-bot first, then deploy main app
   - Main app needs `CHATBOT_BASE_URL` to proxy requests

2. **Update CHATBOT_BASE_URL:**
   - If chat-bot URL changes, need to update substitution variable in main app trigger

3. **Branch filtering:**
   - Can create separate triggers for different branches (dev, staging, production)
   - Use regex pattern: `^dev$`, `^staging$`, `^main$`

4. **Manual trigger:**
   - Can run trigger manually from Cloud Build Console
   - Or use command:
     ```bash
     gcloud builds triggers run siftly-chat-bot-trigger --branch main
     ```

---

## Troubleshooting

### Build fails with "permission denied"
- Check service account has sufficient permissions:
  - Cloud Run Admin
  - Secret Manager Secret Accessor
  - Artifact Registry Writer

### Build fails with "secret not found"
- Ensure secrets are created in Secret Manager
- Check secret names in `cloudbuild.yaml` match names in Secret Manager

### Deploy fails with "service not found"
- Service will be created automatically on first deployment
- If still fails, check service account has Cloud Run Admin permission

---

## References

- Cloud Build Triggers: https://cloud.google.com/build/docs/triggers
- Bitbucket Integration: https://cloud.google.com/build/docs/bitbucket
- Cloud Run Deployment: https://cloud.google.com/run/docs/deploying
