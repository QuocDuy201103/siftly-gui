## Siftly Next.js App — Deploy Guide (Cloud Run)

### 1) Env & Secrets
Create `app-next/.env.local` for local dev (do not commit):
```
DATABASE_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...                # 32 bytes base64
NEXTAUTH_URL=https://<your-web-url>
ALLOWED_ADMIN_EMAILS=admin@example.com
SLACK_WEBHOOK_URL=...
CHATBOT_BASE_URL=https://<chat-bot-url> # or http://localhost:4000 in dev
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
Generate `NEXTAUTH_SECRET` (PowerShell):
```
[System.Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Max 256}))
```

### 2) Local Dev
```
cd app-next
npm install
npm run dev
```
If using chatbot locally, run it on port 4000 and set `CHATBOT_BASE_URL=http://localhost:4000`.

### 3) Build (local)
```
cd app-next
npm run build
```

### 4) Docker (standalone Next)
Example Dockerfile (root-based, copies shared schemas):
```Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY app-next/package*.json ./app-next/
RUN cd app-next && npm ci
COPY app-next ./app-next
COPY shared ./shared
WORKDIR /app/app-next
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/app-next/.next/standalone ./
COPY --from=builder /app/app-next/.next/static ./.next/static
COPY --from=builder /app/app-next/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 5) Cloud Build (example)
Substitutions:
- `_IMAGE`: `<region>-docker.pkg.dev/<project>/siftly/app-next:latest`
- `_SERVICE_NAME`: `siftly-web`
- `_REGION`: e.g. `asia-southeast1`
- `_CHATBOT_BASE_URL`: deployed chatbot URL
- `_NEXTAUTH_URL`: https://<your-web-url>

Deploy with secrets:
```
gcloud builds submit --config cloudbuild.yaml --substitutions "_IMAGE=$IMAGE,_SERVICE_NAME=$SERVICE,_REGION=$REGION,_CHATBOT_BASE_URL=$CHATBOT_URL,_NEXTAUTH_URL=$WEB_URL" .
```
Then (if not deployed in build step):
```
gcloud run deploy $SERVICE \
  --image $IMAGE \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,CHATBOT_BASE_URL=$CHATBOT_URL,NEXTAUTH_URL=$WEB_URL" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SLACK_WEBHOOK_URL=SLACK_WEBHOOK_URL:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,ALLOWED_ADMIN_EMAILS=ALLOWED_ADMIN_EMAILS:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,NEXT_PUBLIC_SUPABASE_URL=NEXT_PUBLIC_SUPABASE_URL:latest,NEXT_PUBLIC_SUPABASE_ANON_KEY=NEXT_PUBLIC_SUPABASE_ANON_KEY:latest"
```

### 6) OAuth callback
Set in Google console:
```
https://<your-web-url>/api/auth/callback/google
```

### 7) Post-deploy checks
- Visit site root.
- `/admin/login` Google OAuth flow.
- Chat widget: should call `/api/chat` (proxied to `CHATBOT_BASE_URL`).
- Zoho webhook (if used): `/api/zoho/webhook` proxies to chatbot.
