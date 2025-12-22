/**
 * Script to import help documentation from docs file
 * Parses the docs file and creates help articles in the database
 * Usage: npx tsx scripts/import-docs.ts
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
import { sql } from 'drizzle-orm'

interface Article {
  title: string
  content: string
  url: string
  category: string
}

function parseDocsFile(content: string): Article[] {
  const articles: Article[] = []
  const lines = content.split('\n')
  
  let currentSection = 'Help Docs'
  let currentTitle = ''
  let currentContent: string[] = []
  let inArticle = false
  let inFAQSection = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Detect main sections (I., II.)
    if (line.match(/^[IVX]+\.\s+/)) {
      // Save previous article if exists
      if (currentTitle && currentContent.length > 0) {
        articles.push({
          title: currentTitle,
          content: currentContent.join('\n').trim(),
          url: generateUrl(currentTitle),
          category: currentSection,
        })
      }
      
      // Extract section name
      const sectionMatch = line.match(/^[IVX]+\.\s+(.+)/)
      if (sectionMatch) {
        currentSection = sectionMatch[1].trim()
        inFAQSection = currentSection.includes('FAQ')
      }
      
      currentTitle = ''
      currentContent = []
      inArticle = false
      continue
    }
    
    // Skip description lines after section headers
    if (i < 5 || (inFAQSection && i < 60)) {
      if (line.length > 0 && !line.match(/^\d+\./) && !line.endsWith('?')) {
        continue
      }
    }
    
    // Detect numbered articles (1., 2., 3.) or (1), 2) - these are help articles
    if (line.match(/^\d+[\.\)]\s+/)) {
      // Save previous article
      if (currentTitle && currentContent.length > 0) {
        articles.push({
          title: currentTitle,
          content: currentContent.join('\n').trim(),
          url: generateUrl(currentTitle),
          category: currentSection,
        })
      }
      
      // Extract title
      const titleMatch = line.match(/^\d+[\.\)]\s+(.+)/)
      if (titleMatch) {
        currentTitle = titleMatch[1].trim()
        currentContent = []
        inArticle = true
      }
      continue
    }
    
    // Skip FAQ section - questions don't have answers in the file
    if (inFAQSection) {
      continue
    }
    
    // Collect content for current article (only for help articles, not FAQ)
    if (inArticle && line.length > 0) {
      currentContent.push(line)
    }
  }
  
  // Save last article
  if (currentTitle && currentContent.length > 0 && !inFAQSection) {
    articles.push({
      title: currentTitle,
      content: currentContent.join('\n').trim(),
      url: generateUrl(currentTitle),
      category: currentSection,
    })
  }
  
  return articles
}

function generateUrl(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  return `https://siftly.com/help/${slug}`
}

async function importDocs() {
  try {
    const replaceMode = process.argv.includes('--replace') || process.env.REPLACE_DOCS === '1'

    console.log('Connecting to database...')
    const db = await connectDb()
    
    // Read the docs file
    const fs = await import('fs/promises')
    const path = await import('path')
    const docsPath = path.join(process.cwd(), 'docs')
    
    console.log('Reading docs file...')
    const content = await fs.readFile(docsPath, 'utf-8')
    
    console.log('Parsing documentation...')
    const articles = parseDocsFile(content)
    
    console.log(`\nFound ${articles.length} articles to import:\n`)
    articles.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.title} (${a.category})`)
    })
    
    console.log(`\nImporting articles...\n`)

    // Replace mode: remove previously imported docs (generated URLs) so a language/title change
    // doesn't leave old docs behind.
    if (replaceMode) {
      console.log('🧹 Replace mode enabled: removing previously imported docs (url starts with https://siftly.com/help/)...')

      // Delete embeddings first (FK / large table)
      await db.execute(sql`
        delete from article_embeddings
        where article_id in (
          select id from help_articles where url like 'https://siftly.com/help/%'
        )
      `)

      // Delete the help articles imported by this script
      await db.execute(sql`
        delete from help_articles
        where url like 'https://siftly.com/help/%'
      `)

      console.log('✓ Previous docs removed.\n')
    }
    
    // Import each article
    let imported = 0
    let updated = 0
    let skipped = 0
    
    for (const article of articles) {
      // Check if article already exists (using raw SQL to avoid type issues)
      const existingResult = await db.execute(
        sql`SELECT * FROM help_articles WHERE LOWER(TRIM(title)) = LOWER(TRIM(${article.title})) LIMIT 1`
      )
      
      const existing = (existingResult as any).rows || []
      if (existing.length > 0) {
        // Update existing article content + metadata, then clear embeddings so they can be regenerated
        const existingId = existing[0]?.id

        await db.execute(sql`
          update help_articles
          set content = ${article.content},
              url = ${article.url},
              category = ${article.category},
              updated_at = now()
          where id = ${existingId}
        `)

        await db.execute(sql`delete from article_embeddings where article_id = ${existingId}`)

        console.log(`↻ Updated: ${article.title} (ID: ${existingId})`)
        updated++
        continue
      }
      
      // Skip FAQ questions without content (they're just test questions)
      if (article.content.length < 10 && article.category.includes('FAQ')) {
        console.log(`⏭️  Skipping "${article.title}" - FAQ question without answer`)
        skipped++
        continue
      }
      
      try {
        // Use raw SQL to avoid type issues with different drizzle-orm versions
        const result = await db.execute(
          sql`INSERT INTO help_articles (title, content, url, category) 
              VALUES (${article.title}, ${article.content}, ${article.url}, ${article.category})
              RETURNING id, title`
        )
        
        const inserted = (result as any).rows?.[0] || result
        const id = inserted?.id || 'unknown'
        
        console.log(`✓ Imported: ${article.title} (ID: ${id})`)
        imported++
      } catch (error: any) {
        console.error(`✗ Error importing "${article.title}":`, error.message)
      }
    }
    
    console.log(`\n✅ Import complete!`)
    console.log(`   Imported: ${imported}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`\nNext step: Run create-embeddings.ts to generate embeddings (required if you updated/replaced docs)`)
  } catch (error: any) {
    console.error('Error importing docs:', error.message || error)
    process.exit(1)
  }
}

// Run the script
importDocs()

