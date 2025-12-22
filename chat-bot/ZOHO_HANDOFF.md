# Zoho Desk Human Handoff Guide

## Overview

Human handoff automatically routes a conversation from the chatbot to a Zoho Desk agent when:

1. **Low confidence**: confidence score < 60%
2. **User requests a human**: the message contains keywords like:
   - “talk to a human”, “agent”, “support”
   - “speak to someone”

## Handoff flow

### Step 1: Trigger detection

When a user message arrives:
- The RAG pipeline computes confidence
- Keywords are checked
- If confidence < 60% OR a keyword matches → trigger handoff

### Step 2: Collect user info

The system collects:
- user name + email (if provided)
- handoff reason
- recent chat history context

### Step 3: Create a Zoho Desk ticket

`POST /api/chat/handoff`:
1. Checks if a ticket already exists for the session
2. Updates session user info
3. Loads chat history
4. Creates a Zoho Desk ticket with full context

---

## API endpoints

### POST `/api/chat/handoff`

Creates a Zoho Desk ticket.

**Request:**

```json
{
  "sessionId": "uuid-of-session",
  "userName": "Jane Doe",
  "userEmail": "user@example.com",
  "handoffReason": "Low Confidence - 52%"
}
```

**Response:**

```json
{
  "success": true,
  "ticketId": "123456789",
  "ticketNumber": "TKT-001",
  "message": "Ticket created successfully in Zoho Desk"
}
```

If the ticket already exists:

```json
{
  "success": true,
  "ticketId": "123456789",
  "message": "Ticket already exists for this session",
  "alreadyExists": true
}
```

---

## Zoho configuration

See `ENV_SETUP.md` for required variables. At minimum:

```env
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_DESK_API_URL=https://desk.zoho.com/api/v1
ZOHO_ORG_ID=...
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
ZOHO_DEPARTMENT_ID=...
```

## OAuth token handling

- Access tokens are short-lived
- The system refreshes tokens automatically using the refresh token
- Tokens are stored in DB tables like `zoho_tokens`

---

## Realtime agent replies inside the web widget

When an agent replies in Zoho Desk, Zoho should call:

- `POST /api/zoho/webhook`

The webhook inserts into Supabase table `handoff_messages` with:
- `session_id`
- `author_type = "agent"`
- `content`

The web widget subscribes (Supabase Realtime) to new rows and shows the reply instantly.

### Webhook security (optional)

Set:

```env
ZOHO_WEBHOOK_SECRET=your-random-secret-string
```

Then Zoho must send:
- Header `X-Zoho-Webhook-Secret: <ZOHO_WEBHOOK_SECRET>`, or
- Query param `?secret=<ZOHO_WEBHOOK_SECRET>`

---

## Troubleshooting

- **“Zoho refresh token is not configured”**: set `ZOHO_REFRESH_TOKEN`.
- **“Failed to refresh Zoho token”**: verify refresh token, client id/secret, scopes.
- **Ticket creation fails**: ensure `Desk.tickets.CREATE` scope and correct org/department IDs.


