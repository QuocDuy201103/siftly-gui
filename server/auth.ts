import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Request, Response, NextFunction } from "express";

// Extend Express Request type to include user and isAuthenticated
declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      name?: string;
      picture?: string;
    }
  }
}

// Configure session
export const sessionConfig = session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user email is allowed (you can add allowed emails in .env)
        const allowedEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(",") || [];
        
        if (allowedEmails.length > 0 && !allowedEmails.includes(profile.emails?.[0]?.value || "")) {
          return done(null, false, { message: "Email not authorized" });
        }

        // Return user profile
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
        };

        return done(null, user);
      } catch (error) {
        return done(error as any, false);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser<Express.User>((user, done) => {
  done(null as any, user);
});

// Deserialize user from session
passport.deserializeUser<Express.User>((user, done) => {
  done(null as any, user);
});

// Middleware to check if user is authenticated
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, error: "Unauthorized" });
};
