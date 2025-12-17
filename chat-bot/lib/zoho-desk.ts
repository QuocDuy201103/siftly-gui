/**
 * Zoho Desk Integration Module
 * Handles OAuth 2.0 token management and ticket creation
 */

import { getDb } from "./db";
import { zohoTokens, zohoTickets, type NewZohoToken, type NewZohoTicket, type ZohoTicket } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Zoho Desk API Configuration - Read from env at runtime
function getZohoConfig() {
  return {
    accountsUrl: process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com",
    deskApiUrl: process.env.ZOHO_DESK_API_URL || "https://desk.zoho.com/api/v1",
    orgId: process.env.ZOHO_ORG_ID || "",
    clientId: process.env.ZOHO_CLIENT_ID || "",
    clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || "",
    departmentId: process.env.ZOHO_DEPARTMENT_ID || "",
  };
}

interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
  token_type: string;
}

interface ZohoTicketResponse {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  [key: string]: any;
}

interface ZohoCommentResponse {
  id: string;
  content?: string;
  [key: string]: any;
}

interface HandoffContext {
  sessionId: string;
  userName?: string;
  userEmail?: string;
  handoffReason: string;
  chatHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
  }>;
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(): Promise<string> {
  const db = getDb();

  // Get the latest token from database
  const [tokenRecord] = await db
    .select()
    .from(zohoTokens)
    .orderBy(zohoTokens.createdAt)
    .limit(1);

  // Check if token exists and is still valid (with 5 minute buffer)
  if (tokenRecord && new Date(tokenRecord.expiresAt) > new Date(Date.now() + 5 * 60 * 1000)) {
    return tokenRecord.accessToken;
  }

  // Token expired or doesn't exist, refresh it
  const config = getZohoConfig();
  return await refreshAccessToken(tokenRecord?.refreshToken || config.refreshToken);
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const config = getZohoConfig();
  
  // Use provided refreshToken or fallback to env
  const tokenToUse = refreshToken || config.refreshToken;
  
  if (!tokenToUse || tokenToUse.trim() === "") {
    // Debug: Log what we got
    const debugInfo = {
      providedToken: refreshToken ? `${refreshToken.substring(0, 10)}...` : 'empty',
      envToken: config.refreshToken ? `${config.refreshToken.substring(0, 10)}...` : 'empty',
      envTokenLength: config.refreshToken?.length || 0,
    };
    console.error('Zoho token debug:', debugInfo);
    throw new Error("Zoho refresh token is not configured. Please set ZOHO_REFRESH_TOKEN in environment variables.");
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error("Zoho Client ID or Client Secret is not configured. Please set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in environment variables.");
  }

  const tokenUrl = `${config.accountsUrl}/oauth/v2/token`;
  const params = new URLSearchParams({
    refresh_token: tokenToUse,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh Zoho token: ${response.status} ${errorText}`);
    }

    const tokenData: ZohoTokenResponse = await response.json();

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Save token to database (replace existing)
    const db = getDb();
    
    // Delete old tokens
    await db.delete(zohoTokens);

    // Insert new token
    const newToken: NewZohoToken = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Use new refresh token if provided
      expiresAt,
    };

    await db.insert(zohoTokens).values(newToken);

    return tokenData.access_token;
  } catch (error) {
    console.error("Error refreshing Zoho token:", error);
    throw error;
  }
}

/**
 * Create a ticket in Zoho Desk for human handoff
 */
export async function createHandoffTicket(context: HandoffContext): Promise<ZohoTicketResponse> {
  const accessToken = await getValidAccessToken();

  // Format chat history for ticket description
  const chatHistoryText = context.chatHistory
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const ticketSubject = context.handoffReason.includes("Low Confidence")
    ? `Chatbot Handoff - Low Confidence (${context.sessionId.slice(0, 8)})`
    : `Chatbot Handoff - User Request (${context.sessionId.slice(0, 8)})`;

  const ticketDescription = [
    "Siftly Chatbot Human Handoff",
    "----------------------------------------",
    `Handoff reason: ${context.handoffReason}`,
    "",
    "User information:",
    `- Name: ${context.userName || "Not provided"}`,
    `- Email: ${context.userEmail || "Not provided"}`,
    `- Session ID: ${context.sessionId}`,
    "",
    "Chat history:",
    chatHistoryText || "(no prior messages)",
    "",
    "----------------------------------------",
    "Note: This ticket was automatically created by the chatbot handoff system.",
  ].join("\n");

  const config = getZohoConfig();
  
  // Prepare ticket data
  const ticketData: any = {
    subject: ticketSubject,
    description: ticketDescription,
    email: context.userEmail || "noreply@example.com", // Zoho requires email
    contact: {
      firstName: context.userName?.split(" ")[0] || "Chatbot",
      lastName: context.userName?.split(" ").slice(1).join(" ") || "User",
      email: context.userEmail || "noreply@example.com",
    },
    priority: "Medium",
    status: "Open",
    channel: "Chat",
  };
  
  // Add departmentId if configured (required by Zoho Desk)
  if (config.departmentId) {
    ticketData.departmentId = config.departmentId;
  }

  // Try multiple approaches for orgId
  // Approach 1: Try without orgId (some tokens include org info)
  const ticketUrl = `${config.deskApiUrl}/tickets`;
  
  const headers: Record<string, string> = {
    "Authorization": `Zoho-oauthtoken ${accessToken}`,
    "Content-Type": "application/json",
  };
  
  console.log(`🔍 Creating ticket...`);
  console.log(`   URL: ${ticketUrl}`);
  if (config.departmentId) {
    console.log(`   Department ID: ${config.departmentId}`);
  } else {
    console.log(`   ⚠️  No Department ID configured - may fail if required`);
  }
  
  try {
    const response = await fetch(ticketUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(ticketData),
    });

    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`⚠️  Request failed: ${errorText}`);
      
      // Parse error to see what's missing
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, use as is
      }
      
      // Check if departmentId is missing
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const missingFields = errorData.errors
          .filter((err: any) => err.errorType === "missing")
          .map((err: any) => err.fieldName);
        
        if (missingFields.length > 0) {
          console.log(`⚠️  Missing required fields: ${missingFields.join(", ")}`);
          console.log(`💡 Zoho Desk requires departmentId. You may need to:`);
          console.log(`   1. Get departmentId from Zoho Desk API`);
          console.log(`   2. Or configure ZOHO_DEPARTMENT_ID in environment variables`);
        }
      }
      
      throw new Error(`Failed to create Zoho ticket: ${response.status} ${errorText}`);
    }

    const ticketResponse: ZohoTicketResponse = await response.json();

    // Save ticket reference to database
    const db = getDb();
    const newTicket: NewZohoTicket = {
      ticketId: ticketResponse.id,
      sessionId: context.sessionId,
      handoffReason: context.handoffReason,
    };

    await db.insert(zohoTickets).values(newTicket);

    return ticketResponse;
  } catch (error) {
    console.error("Error creating Zoho ticket:", error);
    throw error;
  }
}

/**
 * Add a message to an existing Zoho Desk ticket.
 * Zoho payloads vary by account/config, so we try comments first, then threads as fallback.
 */
export async function addMessageToTicket(params: {
  ticketId: string;
  content: string;
  isPublic?: boolean;
}): Promise<ZohoCommentResponse> {
  const accessToken = await getValidAccessToken();
  const config = getZohoConfig();

  const headers: Record<string, string> = {
    Authorization: `Zoho-oauthtoken ${accessToken}`,
    "Content-Type": "application/json",
  };
  // Many Zoho Desk APIs require orgId header
  if (config.orgId) {
    headers.orgId = config.orgId;
  }

  const publicFlag = params.isPublic ?? true;

  const tryEndpoints: Array<{ url: string; body: any }> = [
    // Common patterns across Zoho Desk setups
    { url: `${config.deskApiUrl}/tickets/${params.ticketId}/comments`, body: { content: params.content, isPublic: publicFlag } },
    { url: `${config.deskApiUrl}/tickets/${params.ticketId}/threads`, body: { content: params.content, isPublic: publicFlag } },
    { url: `${config.deskApiUrl}/tickets/${params.ticketId}/responses`, body: { content: params.content, isPublic: publicFlag } },
    { url: `${config.deskApiUrl}/tickets/${params.ticketId}/reply`, body: { content: params.content } },
    { url: `${config.deskApiUrl}/tickets/${params.ticketId}/sendReply`, body: { content: params.content } },
  ];

  const errors: string[] = [];
  for (const { url, body } of tryEndpoints) {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return (await res.json()) as ZohoCommentResponse;
    }

    const text = await res.text();
    errors.push(`POST ${url} -> ${res.status} ${text}`);

    // If unauthorized, scopes are likely missing (common when token only has CREATE)
    if (res.status === 401) {
      break;
    }
  }

  const joined = errors.join(" | ");
  const hint =
    joined.includes("401")
      ? " (Hint: your Zoho OAuth token likely lacks ticket update/reply scopes. Re-generate refresh token with Desk.tickets.UPDATE or Desk.tickets.ALL plus Desk.tickets.READ.)"
      : "";

  throw new Error(`Failed to add message to Zoho ticket ${params.ticketId}: ${joined || "Unknown error"}${hint}`);
}

/**
 * Get ticket by session ID
 */
export async function getTicketBySessionId(sessionId: string) {
  const db = getDb();
  const [ticket] = await db
    .select()
    .from(zohoTickets)
    .where(eq(zohoTickets.sessionId, sessionId))
    .limit(1);

  return (ticket as ZohoTicket) || null;
}

/**
 * Initialize Zoho tokens (run once to set up initial tokens)
 * This should be called after getting the initial refresh token from Zoho OAuth flow
 */
export async function initializeZohoTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const db = getDb();

  // Delete old tokens
  await db.delete(zohoTokens);

  // Insert new token
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const newToken: NewZohoToken = {
    accessToken,
    refreshToken,
    expiresAt,
  };

  await db.insert(zohoTokens).values(newToken);
}

