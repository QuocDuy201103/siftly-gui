# Human Handoff Integration in `ChatWidget`

## What’s implemented

### 1) Interface updates
- Added `requiresHuman` to the `Message` interface
- Added state for managing the handoff flow

### 2) Handoff detection
- Automatically detects `requiresHuman: true` in the chat response
- Stores handoff context: `sessionId`, `reason`, `confidence`

### 3) User info collection form
- Shows a form when handoff is needed
- Collects user name + email
- Validates email format
- Friendly UI with animations

### 4) Ticket creation
- Calls `POST /api/chat/handoff` when the user submits the form
- Shows a loading state while creating a ticket
- Handles errors and displays clear status messages

### 5) Result messages
- Shows ticket number on success
- Adds a chat message with the ticket details
- Shows clear error messages on failure

---

## UI behavior

### Handoff form
- **Location**: rendered at the bottom of the widget (above the input)
- **Theme**: blue highlight to stand out
- **Validation**:
  - email format validation
  - requires both name + email
- **Buttons**:
  - “Create support ticket” (primary)
  - “Skip” (secondary)

### Visual indicators
- Badge such as “Human support required” when `requiresHuman: true`
- Loading spinner while creating a ticket
- Clear success/error messages

---

## How to test

### 1) Low confidence handoff
1. Open the chat widget
2. Ask an unrelated question (example: “What is the weather?”)
3. When confidence is low, the handoff form appears
4. Fill name + email
5. Create a ticket
6. Verify the ticket appears in Zoho Desk

### 2) Keyword-triggered handoff
1. Send: “I want to talk to a human”
2. The handoff form should appear immediately
3. Fill info and create the ticket

### 3) Validation
1. Trigger handoff
2. Try submitting an invalid email (example: `test@`)
3. Confirm the error message appears
4. Submit a valid email

### 4) Error handling
1. Temporarily stop the chatbot backend
2. Trigger handoff and submit the form
3. Confirm the error message is shown

---

## Configuration

### API endpoints
The widget calls relative paths on the same origin:
- `/api/chat`
- `/api/chat/session`
- `/api/chat/handoff`
- `/api/chat/handoff/message`

In production, the main app proxies these routes to the `chat-bot` service.

### Required environment variables
For the `chat-bot` service (server-side):
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_ORG_ID`
- `ZOHO_DEPARTMENT_ID`

### Realtime (show agent replies inside the widget)

1) **Create realtime table + settings**  
Run `chat-bot/setup-realtime.sql` in Supabase SQL editor.

2) **Frontend (browser) config**  
The widget needs:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

In Cloud Run, the main app exposes `/api/public-config` so the SPA can load these at runtime.

3) **Webhook server config (`chat-bot`)**
In `chat-bot/.env.local`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ZOHO_WEBHOOK_SECRET=your-random-secret-string
```

4) **Zoho Desk Webhook**
Point Zoho webhook to:
- `POST /api/zoho/webhook`
and include:
- Header `X-Zoho-Webhook-Secret: <ZOHO_WEBHOOK_SECRET>` (or `?secret=...`)

When the agent replies in Zoho Desk, webhook inserts into `handoff_messages` → Supabase Realtime pushes → the widget displays replies without a reload.


