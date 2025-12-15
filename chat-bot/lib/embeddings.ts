/**
 * Embedding service for generating vector embeddings
 * Uses HuggingFace BAAI/bge-m3 model (1024 dimensions)
 * Compatible with pgvector
 */

const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_EMBEDDING_MODEL || "BAAI/bge-m3";
// New HuggingFace router API format: https://router.huggingface.co/hf-inference/models/{model}/pipeline/{pipeline}
const HUGGINGFACE_API_URL = process.env.HUGGINGFACE_API_URL || `https://router.huggingface.co/hf-inference/models/${HUGGINGFACE_MODEL}/pipeline/feature-extraction`;
// BAAI/bge-m3 has 1024 dimensions
// This should match the vector dimensions in the database schema
export const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS || "1024");

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY environment variable is not set. Get your API key from https://huggingface.co/settings/tokens");
  }

  try {
    // HuggingFace Inference API format
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HuggingFace API error (${response.status} ${response.statusText})`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage += `: ${errorJson.error || errorJson.message || JSON.stringify(errorJson)}`;
      } catch {
        errorMessage += `: ${errorText || 'Unknown error'}`;
      }
      
      // If model is loading, wait and retry
      if (response.status === 503) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
        console.warn(`Model is loading. Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return generateEmbedding(text); // Retry
      }
      
      console.error('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Log response structure for debugging
    if (process.env.DEBUG_EMBEDDINGS) {
      console.log('Embedding API response:', JSON.stringify(data, null, 2));
    }
    
    // HuggingFace returns array directly: [[0.1, 0.2, ...]] or [0.1, 0.2, ...]
    let embedding: number[];
    
    if (Array.isArray(data)) {
      // If nested array, take first element
      if (Array.isArray(data[0])) {
        embedding = data[0];
      } else {
        embedding = data;
      }
    } else if (data.embeddings && Array.isArray(data.embeddings)) {
      embedding = data.embeddings[0] || data.embeddings;
    } else {
      console.error('Invalid embedding response structure:', data);
      throw new Error(`Invalid embedding response from HuggingFace API. Expected array, got: ${typeof data}`);
    }
    
    if (!embedding || !Array.isArray(embedding)) {
      console.error('Invalid embedding response structure:', data);
      throw new Error(`Invalid embedding response from HuggingFace API. Expected array, got: ${typeof embedding}`);
    }
    
    // Validate dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      console.warn(`Warning: Embedding dimensions mismatch. Expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}. Update EMBEDDING_DIMENSIONS if needed.`);
    }
    
    return embedding;
  } catch (error) {
    console.error("Embedding generation error:", error);
    throw error;
  }
}

/**
 * Chunk text into smaller pieces for embedding
 * Each chunk should be max ~8000 tokens (roughly 6000 characters)
 */
export function chunkText(text: string, maxChunkSize: number = 6000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]\s+/);
  
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ". " : "") + sentence;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

