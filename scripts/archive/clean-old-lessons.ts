/**
 * Script para limpiar lecciones antiguas duplicadas
 *
 * Elimina lecciones con order_index < 10 (antiguas)
 * y mantiene solo las nuevas con order_index >= 10
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function clean() {
  console.log('\n🧹 LIMPIANDO LECCIONES ANTIGUAS')
  console.log('='.repeat(50))

  // Obtener todas las lecciones con order_index < 10
  const { data: oldLessons, error: fetchError } = await supabase
    .from('lessons')
    .select('id, title, slug, order_index, module_id')
    .lt('order_index', 10)

  if (fetchError) {
    console.error('❌ Error obteniendo lecciones:', fetchError.message)
    return
  }

  console.log(`\n📊 Encontradas ${oldLessons?.length || 0} lecciones antiguas (order_index < 10)`)

  if (!oldLessons || oldLessons.length === 0) {
    console.log('\n✅ No hay lecciones antiguas para eliminar')
    return
  }

  // Mostrar lecciones a eliminar
  console.log('\n📝 Lecciones a eliminar:')
  oldLessons.forEach(l => {
    console.log(`  - [${l.order_index}] ${l.slug}: ${l.title}`)
  })

  // Confirmar eliminación
  console.log('\n⚠️  ¿Desea eliminar estas lecciones antiguas?')
  console.log('   Presiona Ctrl+C para cancelar, o espera 3 segundos...\n')

  await new Promise(resolve => setTimeout(resolve, 3000))

  // Eliminar lecciones antiguas
  const { error: deleteError } = await supabase
    .from('lessons')
    .delete()
    .lt('order_index', 10)

  if (deleteError) {
    console.error('❌ Error eliminando lecciones:', deleteError.message)
    return
  }

  console.log(`\n✅ ${oldLessons.length} lecciones antiguas eliminadas exitosamente`)
  console.log('\n✨ Limpieza completada\n')
}

clean()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ ERROR:', error)
    process.exit(1)
  })
