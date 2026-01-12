/**
 * Add slug column to modules table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function addSlugColumn() {
  console.log('🔧 Agregando columna slug a tabla modules...\n')

  // Try to add the column using a SQL query
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE modules
      ADD COLUMN IF NOT EXISTS slug TEXT;

      CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);
    `
  })

  if (error) {
    console.error('❌ Error ejecutando SQL:', error.message)
    console.log('\n📋 Por favor, ejecuta este SQL manualmente en Supabase Dashboard:')
    console.log('\n' + '='.repeat(60))
    console.log(`ALTER TABLE modules ADD COLUMN IF NOT EXISTS slug TEXT;`)
    console.log(`CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);`)
    console.log('='.repeat(60) + '\n')
    console.log('Pasos:')
    console.log('1. Ve a Supabase Dashboard')
    console.log('2. Abre SQL Editor')
    console.log('3. Copia y pega el SQL de arriba')
    console.log('4. Ejecuta')
    return false
  }

  console.log('✅ Columna slug agregada exitosamente\n')
  return true
}

addSlugColumn()


