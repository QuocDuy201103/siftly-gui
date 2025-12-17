import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getPostgresClient } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Zoho-Webhook-Secret",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Many webhook providers validate the callback URL with GET/HEAD before saving.
// Return 200 so Zoho can save the webhook successfully.
export async function GET() {
  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

let dbInitialized = false;
async function ensureDbConnected() {
  if (!dbInitialized) {
    await connectDb();
    dbInitialized = true;
  }
}

function getTicketId(payload: any): string | null {
  const keys = [
    "ticketId",
    "ticket_id",
    "ticketID",
    "ticket",
    "ticket.id",
    "data.ticketId",
    "data.ticket_id",
    "data.ticket.id",
    "resourceId",
    "resource_id",
    "entityId",
    "entity_id",
    "id",
  ];

  const tryPath = (obj: any, path: string): unknown => {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (!cur || typeof cur !== "object") return undefined;
      cur = (cur as any)[p];
    }
    return cur;
  };

  for (const k of keys) {
    const v = k.includes(".") ? tryPath(payload, k) : payload?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }

  // Deep search common id keys (Zoho payloads vary by event)
  const deepKeys = new Set(["ticketId", "ticket_id", "ticketID", "resourceId", "resource_id", "entityId", "entity_id"]);
  const seen = new Set<any>();
  const stack: any[] = [payload];
  let steps = 0;

  while (stack.length && steps < 5000) {
    steps++;
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) stack.push(item);
      continue;
    }

    for (const [k, v] of Object.entries(node)) {
      if (deepKeys.has(k)) {
        if (typeof v === "string" && v.trim()) return v.trim();
        if (typeof v === "number") return String(v);
      }
      if (v && typeof v === "object") stack.push(v);
    }
  }

  return null;
}

function getMessageContent(payload: any): string {
  const candidates = [
    payload?.content,
    payload?.message,
    payload?.text,
    payload?.plainText,
    payload?.comment?.content,
    payload?.comment?.plainText,
    payload?.thread?.content,
    payload?.thread?.plainText,
    payload?.thread?.summary,
    payload?.data?.content,
    payload?.data?.plainText,
    payload?.data?.comment?.content,
    payload?.data?.thread?.content,
    payload?.data?.thread?.plainText,
    payload?.data?.thread?.summary,
    payload?.response?.content,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }

  // Deep search for common body fields (Zoho payloads vary a lot by event type)
  const contentKeys = new Set([
    "content",
    "plainText",
    "plain_text",
    "message",
    "text",
    "summary",
    "body",
    "description",
    "comment",
    "reply",
  ]);

  const seen = new Set<any>();
  const stack: any[] = [payload];
  let steps = 0;

  while (stack.length && steps < 8000) {
    steps++;
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) stack.push(item);
      continue;
    }

    for (const [k, v] of Object.entries(node)) {
      if (contentKeys.has(k) && typeof v === "string" && v.trim()) {
        // Prefer "real" message-ish text, ignore very short fields
        if (v.trim().length >= 2) return v;
      }
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return "";
}

function decodeHtmlEntities(input: string): string {
  // Minimal HTML entity decoding (enough for Zoho payloads)
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_m, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : _m;
    });
}

function stripZohoHtml(raw: string): string {
  let s = raw;

  // Cut quoted history (common in email-style replies)
  const quoteMarker = s.search(/----\s*on\s+/i);
  if (quoteMarker >= 0) s = s.slice(0, quoteMarker);

  // Remove known holders / embedded blocks (survey/signature/meta)
  s = s.replace(/<div[^>]*title="survey_holder::start"[\s\S]*?title="survey_holder::end"[^>]*>[\s\S]*?<\/div>/gi, "");
  s = s.replace(/<div[^>]*id="ZDeskInteg"[\s\S]*?<\/div>/gi, "");
  s = s.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "");

  // Preserve line breaks
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/div>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n");

  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, "");

  // Decode entities and normalize whitespace
  s = decodeHtmlEntities(s);
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

export async function POST(req: NextRequest) {
  try {
    const configuredSecret = process.env.ZOHO_WEBHOOK_SECRET;
    if (configuredSecret) {
      const incomingSecret = req.headers.get("x-zoho-webhook-secret");
      const url = new URL(req.url);
      const querySecret = url.searchParams.get("secret");
      if (incomingSecret !== configuredSecret && querySecret !== configuredSecret) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401, headers: CORS_HEADERS }
        );
      }
    }

    await ensureDbConnected();

    const payload = await req.json();
    const ticketId = getTicketId(payload);
    if (!ticketId) {
      console.warn("Zoho webhook: Missing ticketId. Top-level keys:", Object.keys(payload || {}));
      return NextResponse.json(
        { error: "Missing ticketId" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const sql = getPostgresClient();
    const rows = await sql<{ session_id: string }[]>`
      select session_id
      from zoho_tickets
      where ticket_id = ${String(ticketId)}
      limit 1
    `;

    const sessionId = rows?.[0]?.session_id;
    if (!sessionId) {
      return NextResponse.json(
        { error: "Unknown ticketId (not mapped to a session)" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const rawContent = getMessageContent(payload).trim();
    const content = rawContent.includes("<") ? stripZohoHtml(rawContent) : rawContent;
    if (!content) {
      console.warn("Zoho webhook: Empty content. ticketId:", ticketId);
      return NextResponse.json(
        { ok: true, skipped: true, reason: "Empty content" },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const supabase = getSupabaseAdmin();
    const insertRes = await supabase.from("handoff_messages").insert({
      session_id: sessionId,
      ticket_id: String(ticketId),
      author_type: "agent",
      content,
      raw_payload: payload,
    });

    if (insertRes.error) {
      throw new Error(insertRes.error.message);
    }

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("Zoho webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}


