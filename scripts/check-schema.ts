/**
 * Check database schema
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

async function checkSchema() {
  console.log('🔍 Verificando estructura de tablas...\n')

  // Check modules structure
  console.log('📦 MODULES:')
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .limit(1)

  if (modulesError) {
    console.error('❌ Error:', modulesError.message)
  } else if (modules && modules.length > 0) {
    console.log('Columnas encontradas:', Object.keys(modules[0]))
    console.log('Ejemplo:', modules[0])
  } else {
    console.log('No hay datos en la tabla')
  }

  console.log('\n📚 COURSES:')
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .limit(1)

  if (coursesError) {
    console.error('❌ Error:', coursesError.message)
  } else if (courses && courses.length > 0) {
    console.log('Columnas encontradas:', Object.keys(courses[0]))
  }

  console.log('\n📄 LESSONS:')
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .limit(1)

  if (lessonsError) {
    console.error('❌ Error:', lessonsError.message)
  } else if (lessons && lessons.length > 0) {
    console.log('Columnas encontradas:', Object.keys(lessons[0]))
  }
}

checkSchema()
