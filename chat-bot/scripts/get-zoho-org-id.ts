/**
 * Helper script to get Zoho Organization ID
 * 
 * Usage:
 *   npx tsx scripts/get-zoho-org-id.ts
 * 
 * This script will help you find your Zoho Organization ID
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
const chatBotEnvPath = resolve(process.cwd(), '.env.local')
const rootEnvPath = resolve(process.cwd(), '..', '.env.local')
const chatBotEnv = resolve(process.cwd(), '.env')
const rootEnv = resolve(process.cwd(), '..', '.env')

const envPaths = [chatBotEnvPath, rootEnvPath, chatBotEnv, rootEnv]
for (const envPath of envPaths) {
  const result = config({ path: envPath })
  if (result.parsed && Object.keys(result.parsed).length > 0) {
    break
  }
}
config() // Try default location

async function getOrgId() {
  console.log('🔍 Zoho Organization ID Helper\n')
  
  const accessToken = process.env.ZOHO_ACCESS_TOKEN
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET

  // Method 1: Try to get from API if we have tokens
  if (refreshToken && clientId && clientSecret) {
    console.log('📡 Attempting to get Organization ID from API...\n')
    
    try {
      // First, get access token
      const tokenUrl = `https://accounts.zoho.com/oauth/v2/token`
      const tokenParams = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      })

      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      })

      if (!tokenResponse.ok) {
        throw new Error(`Failed to get access token: ${tokenResponse.statusText}`)
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token

      // Try to get organization info from multiple endpoints
      console.log('📡 Trying to get Organization ID from API...\n')
      
      // Method 1: Try organizations endpoint
      try {
        const orgUrl = 'https://desk.zoho.com/api/v1/organizations'
        const orgResponse = await fetch(orgUrl, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        })

        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          console.log('✅ Method 1 - Organizations endpoint:')
          if (orgData.data && orgData.data.length > 0) {
            orgData.data.forEach((org: any, index: number) => {
              console.log(`   Organization ${index + 1}:`)
              console.log(`     ID: ${org.id}`)
              console.log(`     Name: ${org.name || 'N/A'}`)
            })
            console.log(`\n💡 Use the first Organization ID: ${orgData.data[0].id}\n`)
          } else {
            console.log('   No organizations found in response\n')
          }
        } else {
          const errorText = await orgResponse.text()
          console.log(`   ❌ Failed: ${orgResponse.status} ${errorText}\n`)
        }
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`)
      }

      // Method 2: Try to get from account info
      try {
        const accountUrl = 'https://desk.zoho.com/api/v1/accounts'
        const accountResponse = await fetch(accountUrl, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        })

        if (accountResponse.ok) {
          const accountData = await accountResponse.json()
          console.log('✅ Method 2 - Accounts endpoint:')
          console.log(`   Response: ${JSON.stringify(accountData, null, 2).substring(0, 200)}...\n`)
        } else {
          const errorText = await accountResponse.text()
          console.log(`   ❌ Failed: ${accountResponse.status} ${errorText}\n`)
        }
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`)
      }

      // Method 3: Try to create a test ticket (will show orgId in error if wrong)
      try {
        const testTicketUrl = 'https://desk.zoho.com/api/v1/tickets'
        const testResponse = await fetch(testTicketUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: 'Test',
            description: 'Test',
            email: 'test@example.com',
          }),
        })

        if (testResponse.ok) {
          console.log('✅ Method 3 - Test ticket creation: SUCCESS (no orgId needed!)\n')
        } else {
          const errorText = await testResponse.text()
          console.log(`   ⚠️  Test failed: ${testResponse.status}`)
          console.log(`   Error: ${errorText}\n`)
          
          // Check if error mentions orgId
          if (errorText.includes('orgId')) {
            console.log('   💡 This error suggests orgId might not be needed or is incorrect\n')
          }
        }
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`)
      }
    } catch (error: any) {
      console.error('❌ Failed to get Organization ID from API:', error.message)
      console.log('\n')
    }
  } else {
    console.log('ℹ️  No Zoho credentials found. Skipping API method.\n')
  }

  // Method 2: Manual instructions
  console.log('📋 Manual Methods to Get Organization ID:\n')
  
  console.log('Method 1: From Zoho Desk Settings')
  console.log('   1. Login to Zoho Desk: https://desk.zoho.com/')
  console.log('   2. Click Settings (gear icon) → Developer Space → API')
  console.log('   3. Find "Organization ID" in the page\n')

  console.log('Method 2: From URL')
  console.log('   1. Login to Zoho Desk')
  console.log('   2. Check the URL in your browser')
  console.log('   3. Look for numbers in the URL (e.g., /portal/123456789/tickets)')
  console.log('   4. The number is your Organization ID\n')

  console.log('Method 3: From API Response')
  console.log('   1. Make any API call to Zoho Desk')
  console.log('   2. Check response headers or body for Organization ID\n')

  console.log('Method 4: Check Current .env.local')
  if (process.env.ZOHO_ORG_ID) {
    console.log(`   ✅ Found in .env.local: ${process.env.ZOHO_ORG_ID}\n`)
  } else {
    console.log('   ❌ Not found in .env.local\n')
  }

  console.log('💡 After getting Organization ID, add it to .env.local:')
  console.log('   ZOHO_ORG_ID=your-org-id-here\n')
}

getOrgId()
  .then(() => {
    console.log('✨ Done')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

