/**
 * Test query with different thresholds to find optimal value
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), '..', '.env.local') })
}

import { connectDb, getPostgresClient } from '../lib/db'
import { generateEmbedding } from '../lib/embeddings'

async function testWithThreshold() {
  try {
    console.log('Connecting to database...')
    await connectDb()
    const client = getPostgresClient()
    
    const testQuery = 'What AI technology does Siftly use to process email?'
    console.log(`\nTest query: "${testQuery}"`)
    
    const queryEmbedding = await generateEmbedding(testQuery)
    const vectorString = `[${queryEmbedding.join(',')}]`
    
    // Test with different thresholds
    const thresholds = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
    
    for (const threshold of thresholds) {
      const rawResults = await client`
        SELECT 
          ae.article_id as "articleId",
          ae.content,
          1 - (${vectorString}::vector <=> ae.embedding) as similarity,
          ha.title
        FROM article_embeddings ae
        INNER JOIN help_articles ha ON ae.article_id = ha.id
        WHERE 1 - (${vectorString}::vector <=> ae.embedding) >= ${threshold}
        ORDER BY ae.embedding <=> ${vectorString}::vector
        LIMIT 5
      `
      
      console.log(`\n--- Threshold: ${threshold} ---`)
      console.log(`Results: ${rawResults.length}`)
      
      if (rawResults.length > 0) {
        rawResults.forEach((r: any, i: number) => {
          console.log(`  ${i + 1}. [${r.similarity.toFixed(4)}] ${r.title}`)
          console.log(`     ${r.content.substring(0, 100)}...`)
        })
      }
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testWithThreshold()

