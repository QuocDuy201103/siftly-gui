/**
 * Helper script to get Zoho Department ID
 * 
 * Usage:
 *   npx tsx scripts/get-zoho-department-id.ts
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
config()

async function getDepartmentId() {
  console.log('🔍 Zoho Department ID Helper\n')
  
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET

  if (!refreshToken || !clientId || !clientSecret) {
    console.error('❌ Missing Zoho credentials')
    console.log('   Please set: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET\n')
    return
  }

  try {
    // Get access token
    console.log('🔑 Getting access token...')
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
    console.log('✅ Access token retrieved\n')

    // Get departments
    console.log('📋 Fetching departments from Zoho Desk...\n')
    const deptUrl = 'https://desk.zoho.com/api/v1/departments'
    const deptResponse = await fetch(deptUrl, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
      },
    })

    if (!deptResponse.ok) {
      const errorText = await deptResponse.text()
      throw new Error(`Failed to get departments: ${deptResponse.status} ${errorText}`)
    }

    const deptData = await deptResponse.json()
    
    if (deptData.data && deptData.data.length > 0) {
      console.log('✅ Found departments:\n')
      deptData.data.forEach((dept: any, index: number) => {
        console.log(`Department ${index + 1}:`)
        console.log(`   ID: ${dept.id}`)
        console.log(`   Name: ${dept.name || 'N/A'}`)
        console.log(`   Description: ${dept.description || 'N/A'}`)
        console.log('')
      })
      
      console.log('💡 Add to .env.local:')
      console.log(`   ZOHO_DEPARTMENT_ID=${deptData.data[0].id}`)
      console.log('')
      console.log('   Or use a specific department ID from the list above.\n')
    } else {
      console.log('⚠️  No departments found')
      console.log('   You may need to create a department in Zoho Desk first\n')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Check if Zoho credentials are correct')
    console.log('   2. Verify API permissions include Desk.departments.READ')
    console.log('   3. Make sure you have at least one department in Zoho Desk\n')
  }
}

getDepartmentId()
  .then(() => {
    console.log('✨ Done')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

