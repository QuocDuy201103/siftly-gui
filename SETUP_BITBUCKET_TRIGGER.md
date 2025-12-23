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
   - **Event**: Push a new tag
   - **Source**: Select the connected repository
   - **Tag**: `.*` (matches all tags) or specific pattern like `^v.*$` (matches tags starting with "v")

2. **Configuration:**
   - **Type**: Cloud Build configuration file
   - **Location**: Repository
   - **Cloud Build configuration file location**: `cloudbuild.chat-bot.yaml`

3. **Substitution variables:**
   - Scroll down to **"Substitution variables"** section
   - Click **"Add variable"** for each variable:
     - **Variable**: `_REGION`, **Value**: `us-west1`
     - **Variable**: `_SERVICE_NAME`, **Value**: `siftly-chat-bot`
     - **Variable**: `_IMAGE`, **Value**: `us-west1-docker.pkg.dev/siftly-backend-dev/siftly/siftly-chat-bot:latest`
   
   > **Important**: Make sure to add ALL three variables. Missing `_IMAGE` will cause "invalid image name" error.

4. **Service account**: Use default or select a service account with permissions:
   - Cloud Run Admin
   - Secret Manager Secret Accessor
   - Artifact Registry Writer

5. Click **Create**

---

## Step 3: Create Trigger for Main App (Required)

> **Note**: This is the main trigger. You can create only this trigger if you prefer to deploy chat-bot manually.

1. **Create new trigger:**
   - Click **"Create Trigger"**
   - **Name**: `siftly-web-trigger`
   - **Event**: Push a new tag
   - **Source**: Select the connected repository
   - **Tag**: `.*` (matches all tags) or specific pattern like `^v.*$` (matches tags starting with "v")

2. **Configuration:**
   - **Type**: Cloud Build configuration file
   - **Location**: Repository
   - **Cloud Build configuration file location**: `cloudbuild.yaml`

3. **Substitution variables:**
   - Scroll down to **"Substitution variables"** section
   - Click **"Add variable"** for each variable:
     - **Variable**: `_REGION`, **Value**: `us-west1`
     - **Variable**: `_SERVICE_NAME`, **Value**: `siftly-web`
     - **Variable**: `_IMAGE`, **Value**: `us-west1-docker.pkg.dev/siftly-backend-dev/siftly/siftly-web:latest`
     - **Variable**: `_CHATBOT_BASE_URL`, **Value**: `https://siftly-chat-bot-29216080826.us-west1.run.app`
   
   > **Important**: 
   > - Make sure to add ALL four variables. Missing `_IMAGE` will cause "invalid image name" error.
   > - Replace `_CHATBOT_BASE_URL` with the actual chat-bot service URL

4. **Service account**: Use default or select a service account with permissions:
   - **Logs Writer** (`roles/logging.logWriter`) - Required for Cloud Logging
   - **Cloud Run Admin** (`roles/run.admin`) - Required for deployment
   - **Secret Manager Secret Accessor** (`roles/secretmanager.secretAccessor`) - Required for accessing secrets
   - **Artifact Registry Writer** (`roles/artifactregistry.writer`) - Required for pushing images
   - **Service Account User** (`roles/iam.serviceAccountUser`) - Required for Cloud Run service account usage
   
   > **Important**: If using a custom service account, make sure all these roles are granted. See Troubleshooting section if you get permission errors.

5. Click **Create**

---

## Step 4: Test Trigger

### Option A: Automatic Trigger (Recommended)

1. **Create and push a tag:**
   ```bash
   # Create a tag (e.g., v1.0.0)
   git tag v1.0.0
   
   # Push the tag to Bitbucket
   git push origin v1.0.0
   ```

2. **Check build:**
   - Go to: https://console.cloud.google.com/cloud-build/builds
   - You will see the build running automatically when the tag is pushed
   - Check logs to ensure build succeeds

### Option B: Manual Trigger (Testing)

1. **Create a tag first (if not exists):**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Run trigger manually:**
   - Go to: https://console.cloud.google.com/cloud-build/triggers
   - Click on your trigger (e.g., `siftly-chat-bot-trigger`)
   - Click **"Run trigger"** button
   - In the dialog:
     - Select **"Tag"** radio button
     - Enter the tag name (e.g., `v1.0.0`)
     - Click **"Run trigger"**

3. **Alternative: Use command line:**
   ```bash
   # Run with a specific tag
   gcloud builds triggers run siftly-chat-bot-trigger --tag v1.0.0
   ```

### Tag Naming Convention

Recommended tag format:
- **Version tags**: `v1.0.0`, `v1.0.1`, `v2.0.0`
- **Release tags**: `release-v1.0.0`, `prod-v1.0.0`
- **Pattern**: Use semantic versioning (major.minor.patch)

Example workflow:
```bash
# After testing, create a release tag
git tag v1.0.0
git push origin v1.0.0
# This will automatically trigger the build and deployment
```

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

2. **Can I only enable trigger for main app?**
   - **Yes, you can!** You only need to create the trigger for `siftly-web-trigger`
   - However, make sure:
     - Chat-bot service is already deployed (manually or via another method)
     - `_CHATBOT_BASE_URL` in substitution variables points to the correct chat-bot URL
     - If chat-bot URL changes, you'll need to manually update `_CHATBOT_BASE_URL` in the trigger
   - **Recommended**: Enable both triggers for full automation, but it's optional

2. **Update CHATBOT_BASE_URL:**
   - If chat-bot URL changes, need to update substitution variable in main app trigger

3. **Tag filtering:**
   - Can create separate triggers for different tag patterns
   - Use regex pattern:
     - `^v.*$` - Matches tags starting with "v" (e.g., v1.0.0, v2.0.0)
     - `^release-.*$` - Matches tags starting with "release-" (e.g., release-v1.0.0)
     - `^prod-.*$` - Matches production tags
     - `.*` - Matches all tags

4. **Manual trigger:**
   - Can run trigger manually from Cloud Build Console
   - When running manually, you need to specify either:
     - **Commit hash**: Select "Commit hash" radio button and enter a commit SHA (e.g., `abc123def456...`)
     - **Tag**: Select "Tag" radio button and enter a tag name (e.g., `v1.0.0`)
   - **Recommended**: Use "Commit hash" for manual testing - you can find it in your Bitbucket repository under commits
   - Or use command line:
     ```bash
     # Run with branch (uses latest commit on that branch)
     gcloud builds triggers run siftly-chat-bot-trigger --branch main
     
     # Run with specific commit
     gcloud builds triggers run siftly-chat-bot-trigger --commit-sha abc123def456...
     ```

---

## Troubleshooting

### Build fails with "permission denied" or "does not have permission to write logs"

**Error message**: "The service account running this build does not have permission to write logs to Cloud Logging"

**Solution**: Grant the required IAM roles to the service account:

1. **Identify the service account:**
   - Check the error message for the service account email (e.g., `codemagic-build-service@siftly-backend-dev.iam.gserviceaccount.com`)
   - Or check in trigger settings → Service account

2. **Grant required roles:**
   ```bash
   # Replace SERVICE_ACCOUNT_EMAIL with your actual service account
   SERVICE_ACCOUNT="codemagic-build-service@siftly-backend-dev.iam.gserviceaccount.com"
   
   # Grant Logs Writer role (for Cloud Logging)
   gcloud projects add-iam-policy-binding siftly-backend-dev \
     --member="serviceAccount:$SERVICE_ACCOUNT" \
     --role="roles/logging.logWriter"
   
   # Grant Cloud Run Admin (for deployment)
   gcloud projects add-iam-policy-binding siftly-backend-dev \
     --member="serviceAccount:$SERVICE_ACCOUNT" \
     --role="roles/run.admin"
   
   # Grant Secret Manager Secret Accessor (for accessing secrets)
   gcloud projects add-iam-policy-binding siftly-backend-dev \
     --member="serviceAccount:$SERVICE_ACCOUNT" \
     --role="roles/secretmanager.secretAccessor"
   
   # Grant Artifact Registry Writer (for pushing images)
   gcloud projects add-iam-policy-binding siftly-backend-dev \
     --member="serviceAccount:$SERVICE_ACCOUNT" \
     --role="roles/artifactregistry.writer"
   
   # Grant Service Account User (for Cloud Run)
   gcloud projects add-iam-policy-binding siftly-backend-dev \
     --member="serviceAccount:$SERVICE_ACCOUNT" \
     --role="roles/iam.serviceAccountUser"
   ```

3. **Or use Cloud Console:**
   - Go to: https://console.cloud.google.com/iam-admin/iam
   - Find the service account
   - Click "Edit" (pencil icon)
   - Click "Add Another Role"
   - Add these roles:
     - **Logs Writer** (`roles/logging.logWriter`)
     - **Cloud Run Admin** (`roles/run.admin`)
     - **Secret Manager Secret Accessor** (`roles/secretmanager.secretAccessor`)
     - **Artifact Registry Writer** (`roles/artifactregistry.writer`)
     - **Service Account User** (`roles/iam.serviceAccountUser`)
   - Click "Save"

4. **Retry the build** after granting permissions

### Build fails with "secret not found"
- Ensure secrets are created in Secret Manager
- Check secret names in `cloudbuild.yaml` match names in Secret Manager

### Build fails with "invalid image name" or "could not parse reference"
- **Cause**: Substitution variable `_IMAGE` is missing or empty in trigger configuration
- **Solution**: 
  1. Go to Cloud Build Triggers: https://console.cloud.google.com/cloud-build/triggers
  2. Click on your trigger to edit it
  3. Scroll to **"Substitution variables"** section
  4. Make sure `_IMAGE` variable is set with correct format:
     - For chat-bot: `us-west1-docker.pkg.dev/siftly-backend-dev/siftly/siftly-chat-bot:latest`
     - For main app: `us-west1-docker.pkg.dev/siftly-backend-dev/siftly/siftly-web:latest`
  5. Also verify `_REGION` and `_SERVICE_NAME` are set
  6. Save the trigger and try again

### Deploy fails with "service not found"
- Service will be created automatically on first deployment
- If still fails, check service account has Cloud Run Admin permission

---

## References

- Cloud Build Triggers: https://cloud.google.com/build/docs/triggers
- Bitbucket Integration: https://cloud.google.com/build/docs/bitbucket
- Cloud Run Deployment: https://cloud.google.com/run/docs/deploying
