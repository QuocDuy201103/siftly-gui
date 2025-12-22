import type { Express } from "express";
import { createServer, type Server } from "http";
import { Readable } from "stream";
import passport from "passport";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { sendSlackNotification } from "./slack";
import { requireAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      
      // Gửi thông báo đến Slack (không block response)
      sendSlackNotification(contact).catch((error) => {
        console.error("Slack notification error:", error);
      });
      
      res.status(201).json({ success: true, contact });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: "Internal server error" });
      }
    }
  });

  // Public (browser-safe) runtime config for the SPA.
  // Note: SUPABASE_ANON_KEY is safe to expose; it is meant for client-side use.
  app.get("/api/public-config", (_req, res) => {
    res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || null,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || null,
    });
  });

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/admin/login?error=auth_failed" }),
    (req, res) => {
      res.redirect("/admin/contacts");
    }
  );

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Check auth status
  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ success: true, authenticated: true, user: req.user });
    } else {
      res.json({ success: true, authenticated: false });
    }
  });

  // Get all contacts (Admin) - Protected
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.status(200).json({ success: true, contacts });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: "Internal server error" });
      }
    }
  });

  // Delete contact (Admin) - Protected
  app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteContact(id);
      if (deleted) {
        res.status(200).json({ success: true, message: "Contact deleted successfully" });
      } else {
        res.status(404).json({ success: false, error: "Contact not found" });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: "Internal server error" });
      }
    }
  });

  /**
   * Chatbot proxy
   * - Client app calls /api/chat* on the same origin.
   * - In dev/prod we forward these requests to the Next.js `chat-bot` service.
   *
   * Configure on Cloud Run:
   *   CHATBOT_BASE_URL=https://<chat-bot-service-url>
   *
   * Local dev default:
   *   http://localhost:3000
   */
  const chatbotBaseUrl = (process.env.CHATBOT_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const chatbotProxyPaths = [
    "/api/chat",
    "/api/chat/stream",
    "/api/chat/session",
    "/api/chat/handoff",
    "/api/chat/handoff/message",
    "/api/zoho/webhook",
  ] as const;

  app.use(chatbotProxyPaths, async (req, res) => {
    const targetUrl = `${chatbotBaseUrl}${req.originalUrl}`;

    // Clone headers and remove hop-by-hop / conflicting ones
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "undefined") continue;
      if (Array.isArray(v)) headers[k] = v.join(",");
      else headers[k] = v;
    }
    delete headers.host;
    delete headers["content-length"];

    // express.json() already parsed bodies for us; re-encode for upstream
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const body =
      hasBody && typeof req.body !== "undefined" && req.body !== null
        ? typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body)
        : undefined;

    // Ensure JSON content-type when we're sending a JSON body
    if (body && !headers["content-type"]) {
      headers["content-type"] = "application/json";
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    // Copy status + headers
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      // Avoid setting transfer-encoding manually; Node will handle it
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    // Stream response body (supports SSE for /api/chat/stream)
    const nodeStream = Readable.fromWeb(upstream.body as any);
    nodeStream.pipe(res);
  });

  const httpServer = createServer(app);

  return httpServer;
}
