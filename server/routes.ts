import type { Express } from "express";
import { createServer, type Server } from "http";
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

  const httpServer = createServer(app);

  return httpServer;
}
