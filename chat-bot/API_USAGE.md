# API Usage Guide

## Endpoints

### 1) POST `/api/chat`

Non-streaming chat endpoint (returns the full response).

**Request:**

```http
POST /api/chat
Content-Type: application/json

{
  "message": "How do I reset my password?",
  "sessionId": "optional-existing-session-id",
  "userId": "optional-user-id"
}
```

**Response:**

```json
{
  "response": "To reset your password...",
  "sources": [
    { "articleId": "uuid", "url": "https://example.com", "title": "Password Reset Guide" }
  ],
  "confidence": 0.85,
  "requiresHuman": false,
  "clarificationNeeded": false,
  "sessionId": "session-uuid-here"
}
```

### 2) POST `/api/chat/stream`

Streaming endpoint using Server-Sent Events (SSE).

**Response format:**

```
data: {"type":"chunk","content":"Hello"}
data: {"type":"chunk","content":" world"}
data: {"type":"done","sources":[...],"sessionId":"..."}
```

**Error format:**

```
data: {"type":"error","error":"Error message here"}
```

---

## Error handling

Status codes:
- `200`: success
- `400`: bad request (missing/invalid input)
- `500`: internal server error

Error response:

```json
{ "error": "Error message here" }
```

---

## Session management

- If you do not provide `sessionId`, the server creates a new session automatically.
- Store `sessionId` from responses and reuse it to keep conversation context.
- Sessions and chat history are stored in the database.


