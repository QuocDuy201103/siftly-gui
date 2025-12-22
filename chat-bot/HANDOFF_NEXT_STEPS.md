# Next Steps — Human Handoff Integration

## Completed

1. Database schema updated with `zoho_tokens`, `zoho_tickets`, and user info fields on `chat_sessions`
2. Zoho Desk integration module (OAuth 2.0 + refresh token)
3. RAG pipeline updated to detect handoff triggers (confidence + keywords)
4. API endpoint `/api/chat/handoff`
5. Test scripts verified ticket creation works

---

## Next steps

### 1) Frontend integration (most important)

Update the frontend to:
- Detect `requiresHuman: true`
- Collect user name + email
- Call `POST /api/chat/handoff`

### 2) Collect user info earlier

Option A (recommended): ask for name/email at the start of chat and store it in the session.  
Option B: ask only when a handoff is required.

### 3) UX improvements

- Clear messaging when handoff is triggered
- Show the ticket number to the user
- Loading state while creating a ticket
- Graceful error handling

### 4) Improve ticket content

In `lib/zoho-desk.ts`, you can add:
- device/browser metadata
- richer session metadata
- better chat history formatting
- tags/categories

### 5) Monitoring & analytics

- Log handoff events
- Track metrics (handoff count, reasons, agent response time)
- Alerts for abnormal spikes

### 6) Production testing

- Test with real users
- Test edge cases (missing email, session timeout, Zoho downtime)
- Load testing for concurrent handoffs

### 7) Security & privacy

- Encrypt tokens at rest (production)
- Validate emails before sending to Zoho
- Consider rate limiting

### 8) Documentation

- API docs
- Agent playbook for handling tickets
- Troubleshooting guide


