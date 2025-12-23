# Migration Plan: React + Vite + Express to Next.js

## Overview

Convert the React + Vite + Express stack into a unified Next.js 14 application using the App Router. This will consolidate `client/` and `server/` into one Next.js app, and optionally merge with `chat-bot/`.

**Primary Goal:** Improve SEO with server-side rendering for public-facing pages.

---

## Architecture Changes

### Current Structure
```
├── client/          → React SPA (Vite)
├── server/          → Express API
├── chat-bot/        → Next.js (separate service)
└── shared/          → Drizzle schemas
```

### Target Structure
```
├── app/                    → Next.js App Router
│   ├── (public)/          → SSR pages (SEO-optimized)
│   │   ├── page.tsx       → Landing page (currently Siftly.tsx)
│   │   └── layout.tsx     → Public layout with ChatWidget
│   ├── admin/             → Admin section
│   │   ├── login/page.tsx → Login page
│   │   └── contacts/page.tsx → Contacts dashboard
│   ├── api/               → API Routes
│   │   ├── contact/route.ts
│   │   ├── contacts/route.ts
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── chat/route.ts           → (merge from chat-bot)
│   │   └── zoho/webhook/route.ts   → (merge from chat-bot)
│   ├── layout.tsx         → Root layout
│   └── not-found.tsx
├── components/            → UI components (move from client/src/components)
├── lib/                   → Utilities
│   ├── db.ts              → Database connection
│   ├── auth.ts            → NextAuth config
│   ├── storage.ts         → Database operations
│   └── slack.ts           → Slack notifications
├── shared/                → Keep as-is (Drizzle schemas)
└── public/                → Static assets
```

---

## Step-by-Step Implementation

### Phase 1: Project Setup

#### 1.1 Create New Next.js Project
```bash
# From website/ directory, create new Next.js app alongside existing code
npx create-next-app@latest app-next --typescript --tailwind --eslint --app --src-dir=false

# Or manually initialize in a new branch
```

#### 1.2 Install Dependencies
```bash
npm install next-auth @auth/drizzle-adapter
npm install drizzle-orm @neondatabase/serverless
npm install zod react-hook-form @hookform/resolvers
npm install @tanstack/react-query
npm install framer-motion recharts
npm install @radix-ui/react-* # (all shadcn dependencies)
```

#### 1.3 Configuration Files

**`next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployment
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com'], // Google profile pics
  },
}
module.exports = nextConfig
```

**`.env.local`** (copy from existing `.env`):
```env
DATABASE_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=... # Generate: openssl rand -base64 32
ALLOWED_ADMIN_EMAILS=...
SLACK_WEBHOOK_URL=...

# Chatbot env vars (if merging)
DEEPSEEK_API_KEY=...
HUGGINGFACE_API_KEY=...
```

---

### Phase 2: Authentication Migration

Replace Passport.js with NextAuth.js.

#### 2.1 Create Auth Configuration

**`lib/auth.ts`:**
```typescript
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Replicate ALLOWED_ADMIN_EMAILS logic from server/auth.ts:47-50
      const allowedEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(",") || [];
      if (allowedEmails.length > 0 && !allowedEmails.includes(user.email || "")) {
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
};
```

#### 2.2 Create Auth API Route

**`app/api/auth/[...nextauth]/route.ts`:**
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

### Phase 3: API Routes Migration

#### 3.1 Contact Form Endpoint

**`app/api/contact/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { insertContactSchema } from "@/shared/schema";
import { storage } from "@/lib/storage";
import { sendSlackNotification } from "@/lib/slack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertContactSchema.parse(body);
    const contact = await storage.createContact(validatedData);

    // Async Slack notification (mirrors server/routes.ts:24-26)
    sendSlackNotification(contact).catch(console.error);

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
```

#### 3.2 Protected Contacts Endpoints

**`app/api/contacts/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { storage } from "@/lib/storage";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await storage.getAllContacts();
  return NextResponse.json({ success: true, contacts });
}
```

**`app/api/contacts/[id]/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { storage } from "@/lib/storage";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await storage.deleteContact(params.id);
  if (deleted) {
    return NextResponse.json({ success: true, message: "Contact deleted" });
  }
  return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
}
```

---

### Phase 4: Page Migration

#### 4.1 Files to Migrate

| Source | Destination | Changes Required |
|--------|-------------|------------------|
| `client/src/pages/Siftly.tsx` | `app/(public)/page.tsx` | Convert to Server Component, add metadata |
| `client/src/pages/AdminLogin.tsx` | `app/admin/login/page.tsx` | Use NextAuth signIn() |
| `client/src/pages/AdminContacts.tsx` | `app/admin/contacts/page.tsx` | Use NextAuth session |
| `client/src/pages/not-found.tsx` | `app/not-found.tsx` | Minor adjustments |
| `client/src/components/*` | `components/*` | Update imports |

#### 4.2 Landing Page (SEO-Optimized)

**`app/(public)/page.tsx`:**
```typescript
import { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

// This is the key for SEO
export const metadata: Metadata = {
  title: "Siftly - Contact Management Platform",
  description: "Manage customer contacts with AI-powered chatbot integration",
  openGraph: {
    title: "Siftly",
    description: "Contact Management Platform",
    // Add OG image, etc.
  },
};

// Server Component - SEO friendly
export default function HomePage() {
  return <LandingPage />;
}
```

**`components/LandingPage.tsx`:**
```typescript
"use client"; // Client component for interactivity

// Move content from client/src/pages/Siftly.tsx here
// Keep form handling, animations, etc.
```

#### 4.3 Admin Login Page

**`app/admin/login/page.tsx`:**
```typescript
"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div>
      {error && <div className="error">Authentication failed</div>}
      <button onClick={() => signIn("google", { callbackUrl: "/admin/contacts" })}>
        Sign in with Google
      </button>
    </div>
  );
}
```

#### 4.4 Protected Admin Layout

**`app/admin/layout.tsx`:**
```typescript
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
```

---

### Phase 5: Components Migration

#### 5.1 shadcn/ui Components

The `components/ui/*` files can be copied directly. Update `components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### 5.2 ChatWidget Integration

**`app/(public)/layout.tsx`:**
```typescript
import { ChatWidget } from "@/components/ChatWidget";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
```

---

### Phase 6: Database & Utilities

#### 6.1 Copy and Update

| Source | Destination | Changes |
|--------|-------------|---------|
| `server/db.ts` | `lib/db.ts` | No changes needed |
| `server/storage.ts` | `lib/storage.ts` | No changes needed |
| `server/slack.ts` | `lib/slack.ts` | No changes needed |
| `shared/schema.ts` | `shared/schema.ts` | Keep as-is |

---

### Phase 7: ChatBot Integration (Optional)

If merging `chat-bot/` into the main app:

#### 7.1 Copy API Routes
```
chat-bot/app/api/chat/     → app/api/chat/
chat-bot/app/api/zoho/     → app/api/zoho/
chat-bot/lib/*             → lib/chatbot/
```

#### 7.2 Merge Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "@huggingface/inference": "...",
    "openai": "..."
  }
}
```

---

### Phase 8: Deployment Updates

#### 8.1 New Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

#### 8.2 Update `cloudbuild.yaml`

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/siftly-web', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/siftly-web']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'siftly-web'
      - '--image=gcr.io/$PROJECT_ID/siftly-web'
      - '--region=us-central1'
      - '--platform=managed'
```

---

## Migration Checklist

### Pre-Migration
- [ ] Create new Git branch: `feature/nextjs-migration`
- [ ] Backup current `.env` values
- [ ] Document current API endpoints for testing

### Phase 1: Setup
- [ ] Initialize Next.js project structure
- [ ] Install all dependencies
- [ ] Configure `next.config.js`
- [ ] Set up Tailwind & shadcn/ui

### Phase 2: Auth
- [ ] Install next-auth
- [ ] Create `lib/auth.ts` with Google provider
- [ ] Create `app/api/auth/[...nextauth]/route.ts`
- [ ] Test login/logout flow

### Phase 3: API Routes
- [ ] Migrate `POST /api/contact`
- [ ] Migrate `GET /api/contacts` (protected)
- [ ] Migrate `DELETE /api/contacts/:id` (protected)
- [ ] Migrate `GET /api/public-config` (if still needed)
- [ ] Test all API endpoints

### Phase 4: Pages
- [ ] Migrate landing page with SSR metadata
- [ ] Migrate admin login page
- [ ] Migrate admin contacts page
- [ ] Migrate 404 page
- [ ] Add proper layouts

### Phase 5: Components
- [ ] Copy all `components/ui/*` files
- [ ] Migrate `ChatWidget.tsx`
- [ ] Update all import paths
- [ ] Add "use client" where needed

### Phase 6: Database
- [ ] Copy `db.ts`, `storage.ts`, `slack.ts`
- [ ] Verify Drizzle connection works
- [ ] Test database operations

### Phase 7: ChatBot (Optional)
- [ ] Merge chat-bot API routes
- [ ] Merge chat-bot lib files
- [ ] Test chat functionality

### Phase 8: Deployment
- [ ] Update Dockerfile for Next.js standalone
- [ ] Update `cloudbuild.yaml`
- [ ] Test local Docker build
- [ ] Deploy to staging
- [ ] Verify SEO with Google Search Console

### Post-Migration
- [ ] Delete old `client/` directory
- [ ] Delete old `server/` directory
- [ ] Update README.md
- [ ] Remove old Vite config files

---

## Key Differences Reference

| Aspect | Current (Express) | New (Next.js) |
|--------|-------------------|---------------|
| Auth | Passport.js + express-session | NextAuth.js |
| Session Storage | connect-pg-simple | NextAuth JWT or DB adapter |
| API Protection | `requireAuth` middleware | `getServerSession()` check |
| Routing | Wouter (client-side) | App Router (file-based) |
| SSR | None (SPA) | Full SSR on public pages |
| Build | Vite + esbuild | Next.js compiler |

---

## Testing SEO After Migration

### 1. Verify SSR is Working
```bash
curl -s https://your-domain.com | grep -o '<title>.*</title>'
```

### 2. Check Meta Tags
- View page source (not DevTools) to see server-rendered HTML
- Verify `<meta name="description">`, Open Graph tags are present

### 3. Google Tools
- Use [Google Rich Results Test](https://search.google.com/test/rich-results)
- Submit sitemap to Google Search Console
- Use "URL Inspection" tool to verify Google can render pages

### 4. Lighthouse Audit
```bash
npx lighthouse https://your-domain.com --view
```
Check SEO score and follow recommendations.

---

## Rollback Plan

If issues arise during migration:

1. Keep the old `client/` and `server/` directories until migration is verified
2. Maintain separate Git branch until ready to merge
3. Cloud Run allows instant rollback to previous revision:
   ```bash
   gcloud run services update-traffic siftly-web --to-revisions=REVISION_NAME=100
   ```

---

## Estimated Effort

| Phase | Complexity |
|-------|------------|
| Phase 1: Setup | Low |
| Phase 2: Auth | Medium |
| Phase 3: API Routes | Low |
| Phase 4: Pages | Medium |
| Phase 5: Components | Low |
| Phase 6: Database | Low |
| Phase 7: ChatBot | Medium (optional) |
| Phase 8: Deployment | Medium |

---

## Questions to Resolve Before Starting

1. **Merge chat-bot?** Keep as separate service or consolidate?
2. **Session storage:** Use NextAuth JWT (simpler) or database sessions (more secure)?
3. **Domain changes:** Any URL structure changes needed?
4. **Environment:** Staging environment available for testing?
