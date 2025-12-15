import { NextRequest, NextResponse } from 'next/server'
import { generateRAGResponse } from '@/lib/rag/pipeline'
import { connectDb } from '@/lib/db'
import { getChatHistory, createChatSession } from '@/lib/chat-history'
import type { ChatMessage } from '@/lib/deepseek'

export const runtime = 'nodejs'
export const maxDuration = 60

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
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
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

    // Generate RAG response
    const ragResponse = await generateRAGResponse(
      message,
      history,
      currentSessionId
    )

    return NextResponse.json({
      response: ragResponse.response,
      sources: ragResponse.sources,
      confidence: ragResponse.confidence,
      requiresHuman: ragResponse.requiresHuman,
      clarificationNeeded: ragResponse.clarificationNeeded,
      sessionId: currentSessionId,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

