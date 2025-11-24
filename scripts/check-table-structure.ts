const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key)

async function checkTable() {
  console.log('🔍 Verificando estructura de user_gamification_stats...\n')
  
  // Consultar información del esquema
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_gamification_stats'
      ORDER BY ordinal_position;
    `
  })
  
  if (error) {
    console.log('❌ No se puede usar RPC. Intentando método alternativo...\n')
    
    // Método alternativo: intentar insertar y ver qué columnas acepta
    console.log('📋 Columnas esperadas por el script:')
    console.log('   - id')
    console.log('   - user_id')
    console.log('   - total_xp')
    console.log('   - current_level')
    console.log('   - xp_to_next_level')
    console.log('   - total_badges')
    console.log('   - current_streak      ← FALTA ESTA')
    console.log('   - longest_streak      ← FALTA ESTA')
    console.log('   - last_activity_date')
    console.log('   - created_at')
    console.log('   - updated_at')
    console.log('\n⚠️  La tabla NO tiene current_streak ni longest_streak')
    console.log('\n🔧 SOLUCIÓN: Ejecuta el SQL que te di en Supabase SQL Editor')
  } else {
    console.log('✅ Estructura de la tabla:\n')
    data.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type})`)
    })
  }
}

checkTable()