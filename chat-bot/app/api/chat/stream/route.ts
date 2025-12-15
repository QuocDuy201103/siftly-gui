import { NextRequest } from 'next/server'
import { streamRAGResponse } from '@/lib/rag/pipeline'
import { connectDb } from '@/lib/db'
import { getChatHistory, createChatSession } from '@/lib/chat-history'
import type { ChatMessage } from '@/lib/deepseek'

export const runtime = 'nodejs'
export const maxDuration = 60

// CORS helper
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

// Initialize database connection
let dbInitialized = false

async function ensureDbConnected() {
  if (!dbInitialized) {
    await connectDb()
    dbInitialized = true
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbConnected()

    const { message, sessionId, userId } = await request.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      )
    }

    // Get or create session
    let currentSessionId = sessionId
    if (!currentSessionId) {
      currentSessionId = await createChatSession(userId)
    }

    // Get chat history for context
    const chatHistory = await getChatHistory(currentSessionId)
    const history: ChatMessage[] = chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // Create a readable stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let sources: any[] | undefined

          for await (const chunk of streamRAGResponse(message, history, currentSessionId)) {
            if (chunk.done && chunk.sources) {
              sources = chunk.sources
              // Send final message with sources
              const finalData = JSON.stringify({
                type: 'done',
                sources,
                sessionId: currentSessionId,
              })
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
            } else if (chunk.content) {
              // Send content chunk
              const data = JSON.stringify({
                type: 'chunk',
                content: chunk.content,
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          controller.close()
        } catch (error: any) {
          const errorData = JSON.stringify({
            type: 'error',
            error: error.message || 'Stream error',
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...CORS_HEADERS,
      },
    })
  } catch (error: any) {
    console.error('Stream chat API error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    )
  }
}

