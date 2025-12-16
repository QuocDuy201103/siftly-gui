/**
 * Chat history service for saving and retrieving chat messages
 */

import { getDb } from "./db";
import { chatSessions, chatMessages, type NewChatSession, type NewChatMessage } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";

export interface ChatMessageInput {
  sessionId?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    articleId: string;
    url: string;
    title: string;
  }>;
  confidence?: number;
  requiresHuman?: boolean;
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  userId?: string,
  userName?: string,
  userEmail?: string
): Promise<string> {
  const db = getDb();
  
  const newSession: NewChatSession = {
    userId: userId || null,
    userName: userName || null,
    userEmail: userEmail || null,
  };
  
  const [session] = await db.insert(chatSessions).values(newSession).returning();
  return session.id;
}

/**
 * Update user info in a chat session
 */
export async function updateSessionUserInfo(
  sessionId: string,
  userName?: string,
  userEmail?: string
): Promise<void> {
  const db = getDb();
  const { eq } = await import('drizzle-orm');
  
  await db
    .update(chatSessions)
    .set({
      userName: userName !== undefined ? userName : undefined,
      userEmail: userEmail !== undefined ? userEmail : undefined,
      updatedAt: new Date(),
    })
    .where(eq(chatSessions.id, sessionId));
}

/**
 * Save a chat message to the database
 */
export async function saveChatMessage(input: ChatMessageInput): Promise<string> {
  const db = getDb();
  
  let sessionId = input.sessionId;
  
  // Create new session if not provided
  if (!sessionId) {
    sessionId = await createChatSession();
  }
  
  const newMessage: NewChatMessage = {
    sessionId,
    role: input.role,
    content: input.content,
    sources: input.sources ? JSON.stringify(input.sources) : null,
    confidence: input.confidence || null,
    requiresHuman: input.requiresHuman || false,
  };
  
  const [message] = await db.insert(chatMessages).values(newMessage).returning();
  return message.id;
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(sessionId: string, limit: number = 50) {
  const db = getDb();
  
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  
  return messages.reverse(); // Return in chronological order
}

/**
 * Get a session by session ID
 */
export async function getUserSession(sessionId: string) {
  const db = getDb();
  
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);
  
  return session || null;
}

/**
 * Get all sessions for a user (optional)
 */
export async function getUserSessions(userId: string) {
  const db = getDb();
  
  const sessions = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt));
  
  return sessions;
}

