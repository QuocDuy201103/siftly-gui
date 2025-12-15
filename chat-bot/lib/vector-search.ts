/**
 * Vector search service using pgvector in Supabase
 * Performs similarity search to find relevant help articles
 */

import { getDb } from "./db";
import { generateEmbedding } from "./embeddings";
import postgres from "postgres";

export interface SearchResult {
  articleId: string;
  title: string;
  url: string;
  content: string;
  similarity: number;
}

const SIMILARITY_THRESHOLD = 0.3; // Minimum cosine similarity score (lowered for better recall)
const MAX_RESULTS = 5;

/**
 * Search for relevant articles using vector similarity
 * Returns results with confidence scores
 * Uses raw SQL for pgvector operations (more reliable than drizzle ORM)
 */
export async function searchSimilarArticles(
  query: string,
  limit: number = MAX_RESULTS
): Promise<{ results: SearchResult[]; confidence: number }> {
  // Import getPostgresClient from db module
  const { getPostgresClient, connectDb } = await import("./db");
  
  // Ensure database is connected
  await connectDb();
  
  const client = getPostgresClient();
  
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Convert embedding array to PostgreSQL vector format string
    // pgvector requires: '[0.1,0.2,0.3]' format (with brackets)
    // postgres.js serializes array without brackets, so we need to format manually
    const vectorString = `[${queryEmbedding.join(',')}]`;
    
    // Use parameterized query with properly formatted vector string
    // Cast the string to vector type in PostgreSQL
    const rawResults = await client`
      SELECT 
        ae.article_id as "articleId",
        ae.content,
        ae.chunk_index as "chunkIndex",
        1 - (${vectorString}::vector <=> ae.embedding) as similarity,
        ha.id,
        ha.title,
        ha.url
      FROM article_embeddings ae
      INNER JOIN help_articles ha ON ae.article_id = ha.id
      WHERE 1 - (${vectorString}::vector <=> ae.embedding) >= ${SIMILARITY_THRESHOLD}
      ORDER BY ae.embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    // postgres client returns array directly
    const results = Array.isArray(rawResults) ? rawResults : [];
    const confidence = results.length > 0
      ? results.reduce((sum: number, r: any) => sum + (r.similarity || 0), 0) / results.length
      : 0;

    // Format results
    const formattedResults: SearchResult[] = results.map((r: any) => ({
      articleId: r.articleId || r.id,
      title: r.title,
      url: r.url,
      content: r.content,
      similarity: r.similarity || 0,
    }));

    return {
      results: formattedResults,
      confidence,
    };
  } catch (error) {
    console.error("Vector search error:", error);
    // Return empty results on error
    return { results: [], confidence: 0 };
  }
}

