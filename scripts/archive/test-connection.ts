const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

console.log('🔍 DIAGNÓSTICO INICIADO\n')

// Cargar .env.local
dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', url ? '✅ OK' : '❌ FALTA')
console.log('Key:', key ? '✅ OK' : '❌ FALTA')

if (!url || !key) {
  console.error('\n❌ Faltan variables')
  process.exit(1)
}

console.log('\n🌐 Probando conexión a Supabase...')
const supabase = createClient(url, key)

async function test() {
  try {
    console.log('📋 Verificando tabla users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)
    
    if (usersError) {
      console.error('❌ Error:', usersError.message)
      process.exit(1)
    }
    
    console.log('✅ Tabla users OK')
    
    console.log('📋 Verificando tabla badges...')
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('id, title')
      .limit(5)
    
    if (badgesError) {
      console.error('❌ Error:', badgesError.message)
      process.exit(1)
    }
    
    console.log('✅ Tabla badges OK (' + (badges?.length || 0) + ' badges)')
    
    console.log('\n✅✅✅ TODO CORRECTO ✅✅✅\n')
    console.log('🚀 Ejecuta ahora:')
    console.log('npx tsx scripts/initialize-gamification-for-existing-users.ts\n')
    
  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
}

test()