import { NextRequest, NextResponse } from 'next/server'
import { generateRAGResponse } from '@/lib/rag/pipeline'
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
  return new Response(null, { status: 204, headers: CORS_HEADERS });
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
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: CORS_HEADERS }
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
    console.time('RAG Pipeline');
    const ragResponse = await generateRAGResponse(
      message,
      history,
      currentSessionId
    )
    console.timeEnd('RAG Pipeline');

    return NextResponse.json({
      response: ragResponse.response,
      sources: ragResponse.sources,
      confidence: ragResponse.confidence,
      requiresHuman: ragResponse.requiresHuman,
      clarificationNeeded: ragResponse.clarificationNeeded,
      sessionId: currentSessionId,
    }, { headers: CORS_HEADERS })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

