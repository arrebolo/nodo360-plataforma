// scripts/diagnose-certificates.ts
// Ejecutar con: npx tsx scripts/diagnose-certificates.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Cargar .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function diagnoseCertificates() {
  console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE CERTIFICADOS\n')
  console.log('='.repeat(60))

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Verificar cursos y su estado is_certifiable
  console.log('\n📚 1. CURSOS Y CAMPO is_certifiable:\n')

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, slug, title, is_certifiable, status')
    .order('title')

  if (coursesError) {
    console.error('❌ Error obteniendo cursos:', coursesError.message)
    return
  }

  if (!courses || courses.length === 0) {
    console.log('⚠️  No hay cursos en la base de datos')
    return
  }

  console.log(`Total cursos: ${courses.length}\n`)

  courses.forEach((course, idx) => {
    const certIcon = course.is_certifiable ? '✅' : '❌'
    const statusIcon = course.status === 'published' ? '🟢' : '🟡'
    console.log(`${idx + 1}. ${certIcon} ${statusIcon} ${course.title}`)
    console.log(`   └─ slug: ${course.slug}`)
    console.log(`   └─ is_certifiable: ${course.is_certifiable}`)
    console.log(`   └─ status: ${course.status}`)
    console.log('')
  })

  // 2. Verificar estructura de tabla certificates
  console.log('\n📜 2. CERTIFICADOS EMITIDOS:\n')

  const { data: certificates, error: certsError } = await supabase
    .from('certificates')
    .select(`
      id,
      certificate_number,
      title,
      type,
      issued_at,
      user_id,
      course:course_id (
        title,
        slug
      )
    `)
    .order('issued_at', { ascending: false })
    .limit(10)

  if (certsError) {
    console.error('❌ Error obteniendo certificados:', certsError.message)
  } else if (!certificates || certificates.length === 0) {
    console.log('⚠️  No hay certificados emitidos aún')
  } else {
    console.log(`Últimos ${certificates.length} certificados:\n`)
    certificates.forEach((cert: any) => {
      console.log(`🎓 ${cert.certificate_number}`)
      console.log(`   └─ Curso: ${cert.course?.title || 'N/A'}`)
      console.log(`   └─ Tipo: ${cert.type}`)
      console.log(`   └─ Emitido: ${new Date(cert.issued_at).toLocaleDateString('es-ES')}`)
      console.log('')
    })
  }

  // 3. Verificar enrollments completados sin certificado
  console.log('\n⚠️  3. ENROLLMENTS COMPLETADOS SIN CERTIFICADO:\n')

  const { data: completedEnrollments, error: enrollError } = await supabase
    .from('course_enrollments')
    .select(`
      id,
      user_id,
      progress_percentage,
      completed_at,
      course:course_id (
        id,
        title,
        slug,
        is_certifiable
      )
    `)
    .eq('progress_percentage', 100)
    .not('completed_at', 'is', null)

  if (enrollError) {
    console.error('❌ Error obteniendo enrollments:', enrollError.message)
  } else if (!completedEnrollments || completedEnrollments.length === 0) {
    console.log('ℹ️  No hay enrollments al 100%')
  } else {
    console.log(`Enrollments al 100%: ${completedEnrollments.length}\n`)

    for (const enrollment of completedEnrollments) {
      const course = enrollment.course as any
      if (!course) continue

      // Verificar si tiene certificado
      const { data: cert } = await supabase
        .from('certificates')
        .select('id, certificate_number')
        .eq('user_id', enrollment.user_id)
        .eq('course_id', course.id)
        .maybeSingle()

      const hasCert = !!cert
      const certStatus = hasCert ? '✅ Tiene certificado' : '❌ SIN CERTIFICADO'

      if (!hasCert) {
        console.log(`🔴 Usuario ${enrollment.user_id.slice(0, 8)}...`)
        console.log(`   └─ Curso: ${course.title}`)
        console.log(`   └─ is_certifiable: ${course.is_certifiable}`)
        console.log(`   └─ Completado: ${enrollment.completed_at}`)
        console.log(`   └─ ${certStatus}`)
        console.log('')
      }
    }
  }

  // 4. Resumen y recomendaciones
  console.log('\n' + '='.repeat(60))
  console.log('📋 RESUMEN Y RECOMENDACIONES:\n')

  const nonCertifiableCourses = courses.filter(c => !c.is_certifiable)
  if (nonCertifiableCourses.length > 0) {
    console.log(`⚠️  ${nonCertifiableCourses.length} curso(s) tienen is_certifiable = false:`)
    nonCertifiableCourses.forEach(c => {
      console.log(`   - ${c.title} (${c.slug})`)
    })
    console.log('\n💡 Para habilitar certificados, ejecuta:')
    console.log(`   UPDATE courses SET is_certifiable = true WHERE slug IN (${nonCertifiableCourses.map(c => `'${c.slug}'`).join(', ')});`)
  } else {
    console.log('✅ Todos los cursos tienen is_certifiable = true')
  }

  console.log('\n' + '='.repeat(60))
}

diagnoseCertificates().catch(console.error)
