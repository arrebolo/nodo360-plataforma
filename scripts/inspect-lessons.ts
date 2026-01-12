import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inspect() {
  // Get Bitcoin Desde Cero lessons
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', 'bitcoin-desde-cero')
    .single()

  if (!course) {
    console.log('Course not found')
    return
  }

  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, order_index')
    .eq('course_id', course.id)
    .order('order_index')

  console.log('\n📚 CURSO:', course.title)
  console.log('='.repeat(60))

  for (const module of modules || []) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, slug, order_index')
      .eq('module_id', module.id)
      .order('order_index')

    console.log(`\n${module.title} (${lessons?.length || 0} lecciones):`)
    lessons?.forEach(l => {
      console.log(`  ${l.order_index}: ${l.slug} - ${l.title}`)
    })
  }
}

inspect()


