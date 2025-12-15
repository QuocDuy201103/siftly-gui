/**
 * Utility script to create embeddings for all help articles
 * Run with: npx tsx scripts/create-embeddings.ts
 */

// Load environment variables from .env.local or .env
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local from chat-bot directory first, then root, then .env
const chatBotEnvPath = resolve(process.cwd(), '.env.local')
const rootEnvPath = resolve(process.cwd(), '..', '.env.local')
const rootEnv = resolve(process.cwd(), '..', '.env')

config({ path: chatBotEnvPath })
if (!process.env.DATABASE_URL) {
  config({ path: rootEnvPath })
}
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), '.env') })
}
if (!process.env.DATABASE_URL) {
  config({ path: rootEnv })
}

import { connectDb } from '../lib/db'
import { helpArticles, articleEmbeddings } from '../../shared/schema'
import { generateEmbedding, chunkText } from '../lib/embeddings'
import { eq } from 'drizzle-orm'

async function createEmbeddingsForAllArticles() {
  try {
    console.log('Connecting to database...')
    const db = await connectDb()
    
    console.log('Fetching all help articles...')
    const articles = await db.select().from(helpArticles)
    
    if (articles.length === 0) {
      console.log('No articles found. Please add some help articles first.')
      return
    }
    
    console.log(`Found ${articles.length} articles. Creating embeddings...`)
    
    for (const article of articles) {
      // Check if embeddings already exist
      const existingEmbeddings = await db
        .select()
        .from(articleEmbeddings)
        .where(eq(articleEmbeddings.articleId, article.id))
      
      if (existingEmbeddings.length > 0) {
        console.log(`Skipping "${article.title}" - embeddings already exist`)
        continue
      }
      
      console.log(`Processing: ${article.title}`)
      
      // Chunk the content
      const chunks = chunkText(article.content)
      console.log(`  - Split into ${chunks.length} chunks`)
      
      // Create embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        try {
          console.log(`  - Creating embedding for chunk ${i + 1}/${chunks.length}...`)
          const embedding = await generateEmbedding(chunks[i])
          
          await db.insert(articleEmbeddings).values({
            articleId: article.id,
            content: chunks[i],
            embedding: embedding,
            chunkIndex: i,
          })
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`  - Error creating embedding for chunk ${i + 1}:`, error)
          throw error
        }
      }
      
      console.log(`✓ Completed: ${article.title}`)
    }
    
    console.log('\n✓ All embeddings created successfully!')
  } catch (error) {
    console.error('Error creating embeddings:', error)
    process.exit(1)
  }
}

// Run the script
createEmbeddingsForAllArticles()

