/**
 * Apply Database Schema to Supabase
 *
 * This script reads the schema.sql file and applies it to the Supabase database
 * using the service role key for admin privileges.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Validate environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

console.log('🔧 Connecting to Supabase...')
console.log(`   URL: ${SUPABASE_URL}`)

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applySchema() {
  try {
    console.log('\n📖 Reading schema.sql...')
    const schemaPath = join(__dirname, '..', 'supabase', 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    console.log(`   ✓ Schema loaded (${schema.length} characters)`)

    console.log('\n🚀 Applying schema to database...')
    console.log('   This may take 10-30 seconds...\n')

    // Execute the schema SQL
    // Note: We need to use rpc or a direct postgres connection
    // The Supabase JS client doesn't directly support executing DDL statements

    // Split schema into individual statements (basic approach)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`   Found ${statements.length} SQL statements`)

    let successCount = 0
    let errorCount = 0
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      try {
        // Use rpc to execute raw SQL (if available)
        // Note: This requires a custom RPC function in Supabase
        // Alternative: Use direct postgres connection

        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists')) {
            console.log(`   ⚠ Skipping (already exists): Statement ${i + 1}`)
          } else {
            errorCount++
            errors.push({ statement: i + 1, error: error.message })
            console.error(`   ❌ Error in statement ${i + 1}: ${error.message}`)
          }
        } else {
          successCount++
          if ((i + 1) % 10 === 0) {
            console.log(`   ✓ Progress: ${i + 1}/${statements.length} statements`)
          }
        }
      } catch (err) {
        errorCount++
        errors.push({ statement: i + 1, error: err.message })
        console.error(`   ❌ Error in statement ${i + 1}: ${err.message}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 SCHEMA APPLICATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`✓ Successful: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)

    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS ENCOUNTERED:')
      errors.forEach(({ statement, error }) => {
        console.log(`   Statement ${statement}: ${error}`)
      })
      console.log('\n⚠️  Note: Some errors (like "already exists") are expected and can be ignored.')
    }

    console.log('\n✅ Schema application process completed!')
    console.log('\n📋 Next steps:')
    console.log('   1. Verify tables in Supabase Dashboard → Table Editor')
    console.log('   2. Check for these 7 tables: users, courses, modules, lessons,')
    console.log('      user_progress, bookmarks, notes')
    console.log('   3. Create your first user via Dashboard or API')

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.error('\n💡 Alternative: Apply schema manually via Supabase Dashboard')
    console.error('   See scripts/apply-schema.md for instructions')
    process.exit(1)
  }
}

// Run the script
console.log('='.repeat(60))
console.log('🗄️  SUPABASE SCHEMA APPLICATION')
console.log('='.repeat(60))

applySchema().catch(error => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})
