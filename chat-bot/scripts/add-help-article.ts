/**
 * Utility script to add a help article
 * Usage: npx tsx scripts/add-help-article.ts "Title" "Content" "https://example.com/article" "category"
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
import { helpArticles } from '../../shared/schema'

async function addHelpArticle(
  title: string,
  content: string,
  url: string,
  category?: string
) {
  try {
    console.log('Connecting to database...')
    const db = await connectDb()
    
    console.log('Adding help article...')
    const [article] = await db.insert(helpArticles).values({
      title,
      content,
      url,
      category: category || null,
    }).returning()
    
    console.log(`✓ Article added successfully!`)
    console.log(`  ID: ${article.id}`)
    console.log(`  Title: ${article.title}`)
    console.log(`  URL: ${article.url}`)
    console.log(`\nNext step: Run create-embeddings.ts to generate embeddings for this article`)
  } catch (error) {
    console.error('Error adding article:', error)
    process.exit(1)
  }
}

// Get arguments from command line
const args = process.argv.slice(2)
if (args.length < 3) {
  console.error('Usage: npx tsx scripts/add-help-article.ts "Title" "Content" "URL" [category]')
  process.exit(1)
}

const [title, content, url, category] = args
addHelpArticle(title, content, url, category)

