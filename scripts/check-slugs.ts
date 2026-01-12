import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkSlugs() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  console.log('🔍 Checking course slugs in database...\n')

  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, slug, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✅ Found ${courses?.length || 0} published courses:\n`)

  courses?.forEach((course, index) => {
    console.log(`${index + 1}. ${course.title}`)
    console.log(`   Slug: ${course.slug}`)
    console.log(`   URL: /cursos/${course.slug}`)
    console.log()
  })
}

checkSlugs()


