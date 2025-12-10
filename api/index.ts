import type { Request, Response } from "express";
import express, { type Express } from "express";
import passport from "passport";
import { sessionConfig } from "../server/auth";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/vite";

let app: Express | null = null;

// Vercel serverless function handler
export default async function handler(
  req: Request,
  res: Response
): Promise<void> {
  // Initialize app on first request
  if (!app) {
    app = express();

    // Session and Passport middleware (must be before routes)
    app.use(sessionConfig);
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Connect to MongoDB
    try {
      const { connectDb } = await import("../server/db");
      await connectDb();
    } catch (error) {
      console.error("Failed to connect to database:", error);
    }

    // Register routes
    await registerRoutes(app);

    // Serve static files in production
    serveStatic(app);
  }

  // Handle request
  return new Promise<void>((resolve) => {
    app!(req, res, () => {
      resolve();
    });
  });
}
