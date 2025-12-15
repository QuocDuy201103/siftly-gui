/**
 * Test script to find the correct DeepSeek Embedding API endpoint and format
 * Usage: npx tsx scripts/test-embedding-api.ts
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

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

async function testEndpoint(url: string, body: any, description: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (!apiKey) {
    console.error("❌ DEEPSEEK_API_KEY is not set")
    return false
  }
  
  console.log(`\n🔍 Testing: ${description}`)
  console.log(`   URL: ${url}`)
  console.log(`   Body: ${JSON.stringify(body, null, 2)}`)
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
    
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    const responseText = await response.text()
    
    if (!response.ok) {
      console.log(`   ❌ Error:`)
      try {
        const errorJson = JSON.parse(responseText)
        console.log(`   ${JSON.stringify(errorJson, null, 2)}`)
      } catch {
        console.log(`   ${responseText || 'Empty response'}`)
      }
      return false
    }
    
    const data = JSON.parse(responseText)
    console.log(`   ✅ Success!`)
    console.log(`   Response keys: ${Object.keys(data).join(', ')}`)
    
    const embedding = data.data?.[0]?.embedding || data.embedding || data.data?.[0]
    
    if (embedding && Array.isArray(embedding)) {
      console.log(`   ✅ Embedding dimensions: ${embedding.length}`)
      console.log(`   ✅ First 3 values: [${embedding.slice(0, 3).join(', ')}, ...]`)
      console.log(`\n🎉 WORKING CONFIGURATION FOUND!`)
      console.log(`   URL: ${url}`)
      console.log(`   Model: ${body.model}`)
      console.log(`   Dimensions: ${embedding.length}`)
      return true
    } else {
      console.log(`   ⚠️  Response structure:`)
      console.log(`   ${JSON.stringify(data, null, 2).substring(0, 500)}`)
    }
  } catch (error: any) {
    console.log(`   ❌ Exception: ${error.message}`)
  }
  
  return false
}

async function testAll() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (!apiKey) {
    console.error("❌ DEEPSEEK_API_KEY is not set")
    process.exit(1)
  }
  
  console.log("Testing DeepSeek Embedding API...")
  console.log(`API Key: ${apiKey.substring(0, 10)}...`)
  
  const testText = "This is a test text for embedding."
  
  // Test different endpoints
  const endpoints = [
    "https://api.deepseek.com/embeddings",
    "https://api.deepseek.com/v1/embeddings",
    "https://api.deepseek.com/embedding",
    "https://api.deepseek.com/v1/embedding",
  ]
  
  // Test different models
  const models = [
    "deepseek-embedding",
    "deepseek-embedding-v2",
    "deepseek-embedding-pro-v1",
    "deepseek-embedding-base-v1",
    "deepseek-embedding-large",
    "text-embedding-ada-002", // OpenAI format, just in case
  ]
  
  // Test different request formats
  const formats = [
    { input: testText }, // Standard format
    { text: testText },  // Alternative format
    { texts: [testText] }, // Array format
    { input: [testText] }, // Array input
  ]
  
  for (const endpoint of endpoints) {
    for (const model of models) {
      for (const format of formats) {
        const body = { model, ...format }
        const description = `${endpoint} with model ${model} and format ${Object.keys(format)[0]}`
        
        const success = await testEndpoint(endpoint, body, description)
        if (success) {
          console.log(`\n✅ Use this configuration in your .env.local:`)
          console.log(`DEEPSEEK_EMBEDDING_API_URL=${endpoint}`)
          console.log(`DEEPSEEK_EMBEDDING_MODEL=${model}`)
          console.log(`DEEPSEEK_EMBEDDING_DIMENSIONS=<dimensions from above>`)
          return
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }
  
  console.log(`\n❌ None of the configurations worked.`)
  console.log(`\nPossible reasons:`)
  console.log(`1. DeepSeek Embedding API might not be publicly available yet`)
  console.log(`2. Your API key might not have access to embedding API`)
  console.log(`3. Endpoint or format might be different`)
  console.log(`\n💡 Suggestion: Use OpenAI embeddings as fallback or check DeepSeek documentation`)
}

testAll().catch(console.error)

