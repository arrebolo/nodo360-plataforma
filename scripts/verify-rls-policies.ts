/**
 * Script: Verificar políticas RLS
 *
 * Verifica que las políticas RLS estén aplicadas correctamente
 * en la tabla course_enrollments
 *
 * USO:
 * npx tsx scripts/verify-rls-policies.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyRLSPolicies() {
  console.log('🔍 Verificando políticas RLS de course_enrollments...\n')

  try {
    // Query para obtener todas las políticas RLS de course_enrollments
    const { data: policies, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = 'course_enrollments'
        ORDER BY policyname;
      `
    })

    if (error) {
      console.log('⚠️  No se puede usar rpc, intentando método alternativo...')

      // Método alternativo: verificar si RLS está habilitado
      const { data: tables, error: tablesError } = await supabase
        .from('course_enrollments')
        .select('*')
        .limit(1)

      if (tablesError) {
        console.error('❌ Error:', tablesError.message)
        return
      }

      console.log('✅ La tabla course_enrollments es accesible')
      console.log('\n📋 Para verificar las políticas RLS manualmente:')
      console.log('1. Ir a Supabase Dashboard')
      console.log('2. Database → Tables → course_enrollments')
      console.log('3. Verificar tab "Policies"')
      console.log('\n📝 Políticas requeridas:')
      console.log('   ✓ Users can view own enrollments (SELECT)')
      console.log('   ✓ Users can create own enrollments (INSERT)')
      console.log('   ✓ Users can update own enrollments (UPDATE)')
      console.log('   ✓ Users can delete own enrollments (DELETE)')

      return
    }

    if (!policies || policies.length === 0) {
      console.error('❌ No se encontraron políticas RLS')
      console.error('   La tabla course_enrollments NO tiene políticas RLS configuradas')
      console.error('\n🔧 SOLUCIÓN:')
      console.error('   Aplicar el archivo: supabase/04-migration-enrollments.sql')
      console.error('   en el SQL Editor de Supabase Dashboard')
      return
    }

    console.log(`✅ Encontradas ${policies.length} política(s) RLS:\n`)

    policies.forEach((policy: any, index: number) => {
      console.log(`${index + 1}. ${policy.policyname}`)
      console.log(`   Comando: ${policy.cmd}`)
      console.log(`   Roles: ${policy.roles?.join(', ') || 'N/A'}`)
      if (policy.qual) {
        console.log(`   USING: ${policy.qual}`)
      }
      if (policy.with_check) {
        console.log(`   WITH CHECK: ${policy.with_check}`)
      }
      console.log('')
    })

    // Verificar políticas específicas
    const requiredPolicies = [
      'Users can view own enrollments',
      'Users can create own enrollments',
      'Users can update own enrollments',
      'Users can delete own enrollments'
    ]

    const foundPolicies = policies.map((p: any) => p.policyname)
    const missingPolicies = requiredPolicies.filter(p => !foundPolicies.includes(p))

    if (missingPolicies.length > 0) {
      console.error('❌ POLÍTICAS FALTANTES:')
      missingPolicies.forEach(p => console.error(`   - ${p}`))
      console.error('\n🔧 SOLUCIÓN:')
      console.error('   Aplicar el archivo: supabase/04-migration-enrollments.sql')
    } else {
      console.log('✅ Todas las políticas RLS requeridas están presentes')
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
  }
}

verifyRLSPolicies()


