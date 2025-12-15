import { pgTable, text, boolean, timestamp, uuid, jsonb, real, integer, customType } from "drizzle-orm/pg-core";
import { z } from "zod";

// Custom vector type for pgvector
// DeepSeek embedding uses 1024 dimensions (default)
// To use 1536 dimensions (e.g., for OpenAI), update this and the database schema
const EMBEDDING_DIMENSIONS = 1024; // DeepSeek default, change to 1536 for OpenAI if needed

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return `vector(${EMBEDDING_DIMENSIONS})`;
  },
  toDriver(value: number[]): string {
    // Convert array to PostgreSQL vector format: [1,2,3] -> '[1,2,3]'
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    // Parse PostgreSQL vector format: '[1,2,3]' -> [1,2,3]
    if (typeof value === 'string') {
      // Remove brackets and split by comma
      const cleaned = value.trim().replace(/^\[|\]$/g, '');
      return cleaned.split(',').map(Number);
    }
    // If already an array, return as is
    return Array.isArray(value) ? value : [];
  },
});

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const insertContactSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(1),
  newsletter: z.boolean().default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Drizzle PostgreSQL Schemas
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message").notNull(),
  newsletter: boolean("newsletter").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Help Articles Schema
export const helpArticles = pgTable("help_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  url: text("url").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Article Embeddings Schema (for pgvector)
export const articleEmbeddings = pgTable("article_embeddings", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").notNull().references(() => helpArticles.id, { onDelete: "cascade" }),
  content: text("content").notNull(), // Chunk of article content
  embedding: vector("embedding").notNull(), // OpenAI-compatible embedding dimensions (1536)
  chunkIndex: integer("chunk_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Sessions Schema
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"), // Optional: can be null for anonymous users
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat Messages Schema
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  sources: jsonb("sources"), // Array of source article IDs and URLs
  confidence: real("confidence"), // Retrieval confidence score (0-1)
  requiresHuman: boolean("requires_human").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for chat
export const insertChatMessageSchema = z.object({
  sessionId: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  sources: z.array(z.object({
    articleId: z.string().uuid(),
    url: z.string(),
    title: z.string(),
  })).optional(),
  confidence: z.number().min(0).max(1).optional(),
  requiresHuman: z.boolean().default(false),
});

export const insertHelpArticleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  url: z.string().url(),
  category: z.string().optional(),
});

// Types inferred from Drizzle schemas
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type HelpArticle = typeof helpArticles.$inferSelect;
export type NewHelpArticle = typeof helpArticles.$inferInsert;
export type ArticleEmbedding = typeof articleEmbeddings.$inferSelect;
export type NewArticleEmbedding = typeof articleEmbeddings.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
