import express, { type Express } from "express";
import passport from "passport";
import { sessionConfig } from "../server/auth";
import { registerRoutes } from "../server/routes";

let app: Express | null = null;

// Vercel serverless function handler
// Using any types for Vercel Request/Response compatibility
export default async function handler(req: any, res: any): Promise<void> {
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

    // Register routes (only API routes, no static file serving)
    // Vercel will handle static files from outputDirectory
    // Ignore Server return value - not needed in serverless environment
    await registerRoutes(app);
  }

  // Handle request
  return new Promise<void>((resolve) => {
    app!(req, res, () => {
      resolve();
    });
  });
}
