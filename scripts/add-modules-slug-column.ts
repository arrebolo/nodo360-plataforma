/**
 * Add slug column to modules table
 *
 * This script adds the slug column to the modules table using Supabase SQL API
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// =====================================================
// SUPABASE CLIENT
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// =====================================================
// SQL EXECUTION
// =====================================================

async function executeSQL(sql: string): Promise<boolean> {
  try {
    // Extract the project reference from the URL
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
    const sqlEndpoint = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`

    console.log('🔧 Intentando ejecutar SQL vía API...\n')

    const response = await fetch(sqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    return true
  } catch (error: any) {
    console.log('⚠️  No se pudo ejecutar SQL automáticamente:', error.message)
    return false
  }
}

// =====================================================
// VERIFY COLUMN
// =====================================================

async function verifyColumn(): Promise<boolean> {
  console.log('🔍 Verificando que la columna slug existe...\n')

  try {
    const { data, error } = await supabase
      .from('modules')
      .select('id, title, slug')
      .limit(1)

    if (error) {
      if (error.message.includes('column modules.slug does not exist')) {
        console.log('❌ La columna slug NO existe en la tabla modules\n')
        return false
      }
      throw error
    }

    console.log('✅ La columna slug existe en la tabla modules')

    if (data && data.length > 0) {
      console.log('✅ Ejemplo de registro:', data[0])
    }

    return true
  } catch (error: any) {
    console.error('❌ Error verificando columna:', error.message)
    return false
  }
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('='.repeat(70))
  console.log('🔧 AGREGAR COLUMNA SLUG A TABLA MODULES')
  console.log('='.repeat(70))

  // Check if column already exists
  const columnExists = await verifyColumn()

  if (columnExists) {
    console.log('\n✨ La columna slug ya existe. No es necesario hacer nada.\n')
    console.log('Puedes ejecutar ahora: npx tsx scripts/fix-slugs.ts\n')
    return
  }

  console.log('\n📝 SQL a ejecutar:')
  console.log('='.repeat(70))
  const sql = `
    ALTER TABLE modules ADD COLUMN IF NOT EXISTS slug TEXT;
    CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);
  `.trim()
  console.log(sql)
  console.log('='.repeat(70))

  // Try to execute SQL automatically
  console.log('\n🚀 Intentando agregar columna automáticamente...\n')
  const success = await executeSQL(sql)

  if (success) {
    console.log('✅ SQL ejecutado exitosamente\n')

    // Verify column was created
    const verified = await verifyColumn()

    if (verified) {
      console.log('\n' + '='.repeat(70))
      console.log('🎉 ¡COLUMNA SLUG AGREGADA EXITOSAMENTE!')
      console.log('='.repeat(70))
      console.log('\n📋 Siguiente paso:')
      console.log('   Ejecuta: npx tsx scripts/fix-slugs.ts\n')
    } else {
      console.log('\n⚠️  No se pudo verificar la columna automáticamente')
      showManualInstructions()
    }
  } else {
    console.log('\n⚠️  No se pudo ejecutar SQL automáticamente\n')
    showManualInstructions()
  }
}

function showManualInstructions() {
  console.log('📋 Por favor, ejecuta este SQL manualmente en Supabase Dashboard:')
  console.log('='.repeat(70))
  console.log('ALTER TABLE modules ADD COLUMN IF NOT EXISTS slug TEXT;')
  console.log('CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);')
  console.log('='.repeat(70))
  console.log('\n📍 Pasos:')
  console.log('   1. Ve a: https://gcahtbecfidroepelcuw.supabase.co')
  console.log('   2. Abre "SQL Editor" en el menú lateral')
  console.log('   3. Copia y pega el SQL de arriba')
  console.log('   4. Click en "Run"')
  console.log('   5. Luego ejecuta: npx tsx scripts/fix-slugs.ts\n')
}

// Run script
main().catch((error) => {
  console.error('\n💥 Error fatal:', error)
  process.exit(1)
})


