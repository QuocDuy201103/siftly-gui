import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { saveChatMessage, createChatSession } from "@/lib/chat-history";

export const runtime = "nodejs";
export const maxDuration = 60;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

let dbInitialized = false;
async function ensureDbConnected() {
  if (!dbInitialized) {
    await connectDb();
    dbInitialized = true;
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbConnected();

    const { message, userName, userEmail } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Create session (with user info if available) and persist the first user message
    const sessionId = await createChatSession(undefined, userName, userEmail);
    await saveChatMessage({
      sessionId,
      role: "user",
      content: message,
      requiresHuman: true,
      confidence: 0,
    });

    return NextResponse.json({ sessionId }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("Chat session API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}


