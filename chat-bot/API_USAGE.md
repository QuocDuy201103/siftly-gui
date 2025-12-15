# API Usage Guide

## Endpoints

### 1. POST `/api/chat`

Non-streaming chat endpoint. Trả về response hoàn chỉnh.

**Request:**
```typescript
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
  "response": "To reset your password, follow these steps:\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email...\n\n**Sources:**\n[1] Password Reset Guide - https://example.com/password-reset",
  "sources": [
    {
      "articleId": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://example.com/password-reset",
      "title": "Password Reset Guide"
    }
  ],
  "confidence": 0.85,
  "requiresHuman": false,
  "clarificationNeeded": false,
  "sessionId": "session-uuid-here"
}
```

**Response khi confidence thấp:**
```json
{
  "response": "I found some articles that might be relevant: Password Reset, Account Security. However, I want to make sure I understand your question correctly. Could you provide more specific details about what you need help with?",
  "sources": [...],
  "confidence": 0.65,
  "requiresHuman": false,
  "clarificationNeeded": true,
  "sessionId": "session-uuid-here"
}
```

**Response khi cần human support:**
```json
{
  "response": "I'm not sure I have enough information to answer your question accurately. Would you like me to connect you with a human support agent who can help you better?",
  "sources": [],
  "confidence": 0.35,
  "requiresHuman": true,
  "clarificationNeeded": false,
  "sessionId": "session-uuid-here"
}
```

### 2. POST `/api/chat/stream`

Streaming chat endpoint (Server-Sent Events). Response được stream về từng chunk.

**Request:** Giống như `/api/chat`

**Response:** SSE stream format:
```
data: {"type":"chunk","content":"To"}

data: {"type":"chunk","content":" reset"}

data: {"type":"chunk","content":" your"}

data: {"type":"chunk","content":" password"}

...

data: {"type":"done","sources":[{"articleId":"...","url":"...","title":"..."}],"sessionId":"..."}
```

**Error response:**
```
data: {"type":"error","error":"Error message here"}
```

## Frontend Integration Examples

### React Hook Example

```typescript
import { useState, useCallback } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ articleId: string; url: string; title: string }>
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true)
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId,
        }),
      })

      const data = await response.json()
      
      // Save session ID for next messages
      if (data.sessionId) {
        setSessionId(data.sessionId)
      }

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
      }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  return { messages, sendMessage, isLoading }
}
```

### Streaming Example

```typescript
export async function sendMessageStream(
  message: string,
  sessionId: string | null,
  onChunk: (chunk: string) => void,
  onComplete: (sources: any[], newSessionId: string) => void
) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Failed to get response reader')
  }

  let buffer = ''
  let sources: any[] = []
  let newSessionId = sessionId || ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        
        if (data.type === 'chunk') {
          onChunk(data.content)
        } else if (data.type === 'done') {
          sources = data.sources || []
          newSessionId = data.sessionId || newSessionId
        } else if (data.type === 'error') {
          throw new Error(data.error)
        }
      }
    }
  }

  onComplete(sources, newSessionId)
}
```

### React Component Example

```tsx
import { useState } from 'react'
import { useChat } from './useChat'

export function ChatInterface() {
  const { messages, sendMessage, isLoading } = useChat()
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    await sendMessage(input)
    setInput('')
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="sources">
                <strong>Sources:</strong>
                {msg.sources.map((source, i) => (
                  <a key={i} href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

## Error Handling

Tất cả endpoints trả về status codes:
- `200`: Success
- `400`: Bad Request (missing message, invalid format)
- `500`: Internal Server Error

Error response format:
```json
{
  "error": "Error message here"
}
```

## Session Management

- Session ID được tự động tạo nếu không cung cấp
- Lưu session ID từ response để tiếp tục conversation
- Mỗi session lưu toàn bộ chat history trong database
- Có thể truyền `userId` để liên kết sessions với user (optional)

## Best Practices

1. **Luôn lưu sessionId**: Lưu session ID từ response để maintain conversation context
2. **Hiển thị sources**: Luôn hiển thị citations để user có thể verify thông tin
3. **Handle low confidence**: Khi `requiresHuman: true` hoặc `clarificationNeeded: true`, cung cấp UI để user có thể:
   - Request human support
   - Provide more details
4. **Error handling**: Luôn handle errors và hiển thị user-friendly messages
5. **Loading states**: Hiển thị loading indicator khi đang gửi message

