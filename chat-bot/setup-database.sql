-- Setup script for RAG Chatbot Database
-- Run this in Supabase SQL Editor after creating your project

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verify pgvector is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 3. The tables will be created by drizzle-kit when you run: npm run db:push
-- But here's the SQL if you want to create them manually:

-- Help Articles Table
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Article Embeddings Table (with pgvector)
CREATE TABLE IF NOT EXISTS article_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(384) NOT NULL, -- all-MiniLM-L6-v2 uses 384 dimensions
  chunk_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for vector similarity search (HNSW index for better performance)
CREATE INDEX IF NOT EXISTS article_embeddings_embedding_idx 
ON article_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  confidence REAL,
  requires_human BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Zoho OAuth Tokens Table (for secure token storage)
CREATE TABLE IF NOT EXISTS zoho_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Zoho Tickets Table (track handoff tickets)
CREATE TABLE IF NOT EXISTS zoho_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL UNIQUE,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  handoff_reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS article_embeddings_article_id_idx ON article_embeddings(article_id);
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS zoho_tickets_session_id_idx ON zoho_tickets(session_id);
CREATE INDEX IF NOT EXISTS zoho_tickets_ticket_id_idx ON zoho_tickets(ticket_id);

