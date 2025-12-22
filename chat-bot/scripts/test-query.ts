/**
 * Test query to debug vector search
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), '..', '.env.local') })
}

import { connectDb } from '../lib/db'
import { generateEmbedding } from '../lib/embeddings'
import { searchSimilarArticles } from '../lib/vector-search'

async function testQuery() {
  try {
    console.log('Connecting to database...')
    await connectDb()
    
    const testQuery = 'What AI technology does Siftly use to process email?'
    console.log(`\nTest query: "${testQuery}"`)
    console.log('Generating embedding...')
    
    const embedding = await generateEmbedding(testQuery)
    console.log(`Embedding generated: ${embedding.length} dimensions`)
    console.log(`First 5 values: ${embedding.slice(0, 5).join(', ')}`)
    
    console.log('\nSearching for similar articles...')
    const results = await searchSimilarArticles(testQuery)
    
    console.log(`\nResults found: ${results.results.length}`)
    console.log(`Confidence: ${results.confidence}`)
    
    results.results.forEach((result, index) => {
      console.log(`\n--- Result ${index + 1} ---`)
      console.log(`Title: ${result.title}`)
      console.log(`Similarity: ${result.similarity}`)
      console.log(`Content preview: ${result.content.substring(0, 200)}...`)
    })
    
    if (results.results.length === 0) {
      console.log('\n⚠️  No results found. This could be because:')
      console.log('  1. Similarity threshold is too high (currently 0.7)')
      console.log('  2. No embeddings in database')
      console.log('  3. Query embedding doesn\'t match article embeddings')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error testing query:', error)
    process.exit(1)
  }
}

testQuery()

