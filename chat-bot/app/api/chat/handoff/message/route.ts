import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getTicketBySessionId, addMessageToTicket } from "@/lib/zoho-desk";
import { saveChatMessage } from "@/lib/chat-history";

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

    const { sessionId, ticketId, content } = await req.json();
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const resolvedTicketId =
      (ticketId && String(ticketId)) || (await getTicketBySessionId(sessionId))?.ticketId;

    if (!resolvedTicketId) {
      return NextResponse.json(
        { error: "No Zoho ticket mapped for this session" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Save message to DB for context
    await saveChatMessage({ sessionId, role: "user", content, requiresHuman: true });

    // Post to Zoho ticket (public comment/thread)
    try {
      await addMessageToTicket({ ticketId: resolvedTicketId, content, isPublic: true });
    } catch (err: any) {
      const message = err?.message || "Failed to send message to Zoho";
      const needsZohoReauth =
        typeof message === "string" && (message.includes("401") || message.toLowerCase().includes("unauthoriz"));

      // Don't break the user flow; message is saved to DB and can still be handled via email.
      return NextResponse.json(
        {
          ok: false,
          ticketId: resolvedTicketId,
          error: message,
          needsZohoReauth,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("Handoff message API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}


