
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function resetTable() {
    try {
        console.log('Dropping article_embeddings table...');
        await sql`DROP TABLE IF EXISTS article_embeddings`;

        console.log('Recreating article_embeddings table with vector(384)...');
        await sql`
      CREATE TABLE IF NOT EXISTS article_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(384) NOT NULL,
        chunk_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

        // Create index
        console.log('Creating HNSW index...');
        await sql`
      CREATE INDEX IF NOT EXISTS article_embeddings_embedding_idx 
      ON article_embeddings 
      USING hnsw (embedding vector_cosine_ops);
    `;

        console.log('✅ Article embeddings table reset successfully!');
    } catch (error) {
        console.error('Error resetting table:', error);
    } finally {
        await sql.end();
    }
}

resetTable();
