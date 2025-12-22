/**
 * Test script for Zoho Desk Handoff feature
 * 
 * Usage:
 *   npx tsx scripts/test-handoff.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { connectDb } from '../lib/db';
import { createHandoffTicket, getValidAccessToken } from '../lib/zoho-desk';
import { createChatSession, saveChatMessage } from '../lib/chat-history';

// Load environment variables from multiple possible locations
const chatBotEnvPath = resolve(process.cwd(), '.env.local')
const rootEnvPath = resolve(process.cwd(), '..', '.env.local')
const chatBotEnv = resolve(process.cwd(), '.env')
const rootEnv = resolve(process.cwd(), '..', '.env')

// Try to load from all possible locations
let envLoaded = false
const envPaths = [chatBotEnvPath, rootEnvPath, chatBotEnv, rootEnv]

for (const envPath of envPaths) {
  const result = config({ path: envPath })
  if (result.parsed && Object.keys(result.parsed).length > 0) {
    console.log(`📁 Loaded env from: ${envPath}`)
    envLoaded = true
    break
  }
}

if (!envLoaded) {
  console.warn('⚠️  No .env file found. Trying default locations...')
  // Try loading without path (will look for .env in current directory)
  config()
}

// Debug: Check if Zoho env vars are loaded (without showing values)
console.log('\n🔍 Checking environment variables:')
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`)
console.log(`   ZOHO_REFRESH_TOKEN: ${process.env.ZOHO_REFRESH_TOKEN ? '✅ Set' : '❌ Not set'}`)
console.log(`   ZOHO_CLIENT_ID: ${process.env.ZOHO_CLIENT_ID ? '✅ Set' : '❌ Not set'}`)
console.log(`   ZOHO_CLIENT_SECRET: ${process.env.ZOHO_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}`)
console.log(`   ZOHO_ORG_ID: ${process.env.ZOHO_ORG_ID ? '✅ Set' : '❌ Not set'}\n`)

async function testHandoff() {
  try {
    // Check required env vars before proceeding
    const requiredVars = [
      'ZOHO_REFRESH_TOKEN',
      'ZOHO_CLIENT_ID',
      'ZOHO_CLIENT_SECRET',
      'ZOHO_ORG_ID'
    ];
    
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(v => console.error(`   - ${v}`));
      console.log('\n💡 Please check:');
      console.log('   1. File .env.local exists in chat-bot/ or root directory');
      console.log('   2. All Zoho variables are set correctly');
      console.log('   3. Variable names match exactly (case-sensitive)');
      console.log('\n📝 Example .env.local content:');
      console.log('   ZOHO_REFRESH_TOKEN=1000.xxxxx...');
      console.log('   ZOHO_CLIENT_ID=1000.xxxxx...');
      console.log('   ZOHO_CLIENT_SECRET=xxxxx...');
      console.log('   ZOHO_ORG_ID=xxxxx...\n');
      return;
    }

    console.log('🔌 Connecting to database...');
    await connectDb();
    console.log('✅ Database connected\n');

    // Test 1: Check Zoho token
    console.log('🔑 Testing Zoho token refresh...');
    
    // Debug: Check actual values (without showing full tokens)
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    
    console.log(`   Refresh Token: ${refreshToken ? `${refreshToken.substring(0, 15)}... (length: ${refreshToken.length})` : '❌ Not set'}`);
    console.log(`   Client ID: ${clientId ? `${clientId.substring(0, 15)}...` : '❌ Not set'}`);
    console.log(`   Client Secret: ${clientSecret ? '✅ Set (hidden)' : '❌ Not set'}`);
    console.log(`   Org ID: ${process.env.ZOHO_ORG_ID || '❌ Not set'}\n`);
    
    try {
      const token = await getValidAccessToken();
      console.log('✅ Access token retrieved successfully');
      console.log(`   Token preview: ${token.substring(0, 20)}...\n`);
    } catch (error: any) {
      console.error('❌ Failed to get access token:', error.message);
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Verify ZOHO_REFRESH_TOKEN is correct and not empty');
      console.log('   2. Check if refresh token has expired');
      console.log('   3. Verify ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET are correct');
      console.log('   4. Make sure ZOHO_ORG_ID is set correctly');
      console.log('   5. Check .env.local file - no spaces around = sign\n');
      return;
    }

    // Test 2: Create a test session and messages
    console.log('💬 Creating test chat session...');
    const sessionId = await createChatSession(
      'test-user',
      'Test User',
      'test@example.com'
    );
    console.log(`✅ Session created: ${sessionId}\n`);

    // Add some test messages
    console.log('📝 Adding test messages...');
    await saveChatMessage({
      sessionId,
      role: 'user',
      content: 'Tell me about the email summarization feature',
    });

    await saveChatMessage({
      sessionId,
      role: 'assistant',
      content: 'Email summarization lets you...',
      confidence: 0.45, // Low confidence to trigger handoff
      requiresHuman: true,
    });

    await saveChatMessage({
      sessionId,
      role: 'user',
      content: 'I want to talk to a human support agent',
    });

    console.log('✅ Test messages added\n');

    // Test 3: Create handoff ticket
    console.log('🎫 Creating handoff ticket in Zoho Desk...');
    try {
      const ticket = await createHandoffTicket({
        sessionId,
        userName: 'Test User',
        userEmail: 'test@example.com',
        handoffReason: 'Low Confidence - 45%',
        chatHistory: [
          {
            role: 'user',
            content: 'Tell me about the email summarization feature',
          },
          {
            role: 'assistant',
            content: 'Email summarization lets you...',
          },
          {
            role: 'user',
            content: 'I want to talk to a human support agent',
          },
        ],
      });

      console.log('✅ Ticket created successfully!');
      console.log(`   Ticket ID: ${ticket.id}`);
      console.log(`   Ticket Number: ${ticket.ticketNumber}`);
      console.log(`   Subject: ${ticket.subject}`);
      console.log(`   Status: ${ticket.status}\n`);
    } catch (error: any) {
      console.error('❌ Failed to create ticket:', error.message);
      console.log('\n💡 Common issues:');
      console.log('   - Check ZOHO_ORG_ID is correct');
      console.log('   - Verify API permissions (Desk.tickets.CREATE)');
      console.log('   - Check if email format is valid');
      return;
    }

    console.log('✅ All tests passed!');
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testHandoff()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

