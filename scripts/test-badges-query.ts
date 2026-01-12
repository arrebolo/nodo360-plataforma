/**
 * Script: Diagnóstico de consulta de badges
 * 
 * Ejecutar: npx tsx scripts/test-badges-query.ts
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key)

async function testBadgesQuery() {
  console.log('🔍 DIAGNÓSTICO DE CONSULTA DE BADGES\n')
  
  // 1. Obtener usuario
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'albertonunezdiaz@gmail.com')
    .single()
  
  if (!users) {
    console.error('❌ Usuario no encontrado')
    return
  }
  
  console.log('✅ Usuario:', users.email)
  console.log('   ID:', users.id)
  console.log('')
  
  const userId = users.id
  
  // 2. Query simple - solo IDs
  console.log('TEST 1: Query simple (solo IDs)')
  console.log('─'.repeat(50))
  const { data: test1, error: error1 } = await supabase
    .from('user_badges')
    .select('id, badge_id, unlocked_at')
    .eq('user_id', userId)
  
  console.log('Error:', error1)
  console.log('Resultados:', test1?.length || 0)
  console.log('Data:', JSON.stringify(test1, null, 2))
  console.log('')
  
  // 3. Query con JOIN - método 1
  console.log('TEST 2: Query con JOIN - badges(*)')
  console.log('─'.repeat(50))
  const { data: test2, error: error2 } = await supabase
    .from('user_badges')
    .select('id, unlocked_at, badges(*)')
    .eq('user_id', userId)
  
  console.log('Error:', error2)
  console.log('Resultados:', test2?.length || 0)
  console.log('Data:', JSON.stringify(test2, null, 2))
  console.log('')
  
  // 4. Query con JOIN - método 2
  console.log('TEST 3: Query con JOIN - badge:badge_id(*)')
  console.log('─'.repeat(50))
  const { data: test3, error: error3 } = await supabase
    .from('user_badges')
    .select('id, unlocked_at, badge:badge_id(*)')
    .eq('user_id', userId)
  
  console.log('Error:', error3)
  console.log('Resultados:', test3?.length || 0)
  console.log('Data:', JSON.stringify(test3, null, 2))
  console.log('')
  
  // 5. Query manual con dos pasos
  console.log('TEST 4: Query en dos pasos (manual JOIN)')
  console.log('─'.repeat(50))
  const { data: userBadgesRaw } = await supabase
    .from('user_badges')
    .select('badge_id, unlocked_at')
    .eq('user_id', userId)
  
  console.log('user_badges encontrados:', userBadgesRaw?.length || 0)
  
  if (userBadgesRaw && userBadgesRaw.length > 0) {
    const badgeIds = userBadgesRaw.map(ub => ub.badge_id)
    console.log('Badge IDs:', badgeIds)
    
    const { data: badgesData } = await supabase
      .from('badges')
      .select('*')
      .in('id', badgeIds)
    
    console.log('Badges encontrados:', badgesData?.length || 0)
    console.log('Badges:', JSON.stringify(badgesData, null, 2))
  }
  console.log('')
  
  // 6. Verificar estructura de la tabla
  console.log('TEST 5: Verificar foreign key')
  console.log('─'.repeat(50))
  const { data: fkInfo, error: fkError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'user_badges' 
        AND tc.constraint_type = 'FOREIGN KEY';
    `
  })
  
  if (fkError) {
    console.log('No se puede verificar FK con RPC')
  } else {
    console.log('Foreign Keys:', JSON.stringify(fkInfo, null, 2))
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ DIAGNÓSTICO COMPLETADO')
  console.log('\nRevisa los resultados arriba para ver qué método funciona')
}

testBadgesQuery()

