import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db'
import { getChatHistory, updateSessionUserInfo, getUserSession } from '@/lib/chat-history'
import { createHandoffTicket, getTicketBySessionId } from '@/lib/zoho-desk'

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

    const { sessionId, userName, userEmail, handoffReason } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Check if ticket already exists for this session
    const existingTicket = await getTicketBySessionId(sessionId)
    if (existingTicket) {
      return NextResponse.json({
        success: true,
        ticketId: existingTicket.ticketId,
        message: 'Ticket already exists for this session',
        alreadyExists: true,
      }, { headers: CORS_HEADERS })
    }

    // Update session with user info if provided
    if (userName || userEmail) {
      await updateSessionUserInfo(sessionId, userName, userEmail)
    }

    // Get chat history (last 10 messages for context)
    const chatHistory = await getChatHistory(sessionId, 10)
    
    // Get session info to retrieve user details
    const session = await getUserSession(sessionId)

    // Format chat history for handoff
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.createdAt?.toISOString(),
    }))

    // Determine handoff reason
    const reason = handoffReason || 
      (chatHistory.find(msg => msg.requiresHuman) 
        ? `Low Confidence - ${Math.round((chatHistory.find(msg => msg.requiresHuman)?.confidence || 0) * 100)}%`
        : 'User requested human')

    // Create handoff context
    const handoffContext = {
      sessionId,
      userName: userName || session?.userName || undefined,
      userEmail: userEmail || session?.userEmail || undefined,
      handoffReason: reason,
      chatHistory: formattedHistory,
    }

    // Create ticket in Zoho Desk
    const ticket = await createHandoffTicket(handoffContext)

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      message: 'Ticket created successfully in Zoho Desk',
    }, { headers: CORS_HEADERS })
  } catch (error: any) {
    console.error('Handoff API error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

