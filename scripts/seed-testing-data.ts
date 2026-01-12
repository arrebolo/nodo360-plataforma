/**
 * Script de Seed para Testing - Nodo360
 *
 * Genera datos de prueba consistentes:
 * - Cursos completos con módulos y lecciones
 * - Progreso parcial
 * - Datos de gamificación
 *
 * Uso: npx tsx scripts/seed-testing-data.ts
 *
 * ADVERTENCIA: Este script BORRA datos existentes de prueba antes de crear nuevos
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan variables de entorno SUPABASE')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================
// CONFIGURACIÓN DE DATOS DE PRUEBA
// ============================================

const ADMIN_EMAIL = 'albertonunezdiaz@gmail.com'

const TEST_COURSES = [
  {
    slug: 'bitcoin-fundamentos',
    title: 'Bitcoin: Fundamentos Completos',
    description: 'Aprende Bitcoin desde cero. Curso completo para principiantes que quieren entender la revolución del dinero digital.',
    long_description: `Este curso te llevará de cero a entender completamente cómo funciona Bitcoin.

Aprenderás:
- Qué es Bitcoin y por qué importa
- Cómo funciona la blockchain
- Wallets y seguridad
- Cómo comprar y almacenar Bitcoin
- El futuro del dinero digital

Ideal para principiantes sin conocimientos previos.`,
    level: 'beginner',
    status: 'published',
    is_free: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800',
    banner_url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1600',
    modules: [
      {
        title: 'Introducción a Bitcoin',
        description: 'Conoce los conceptos básicos de Bitcoin',
        order_index: 0,
        lessons: [
          {
            title: '¿Qué es Bitcoin?',
            slug: 'que-es-bitcoin',
            description: 'Introducción al concepto de Bitcoin y su importancia',
            content: '<h2>Bienvenido al mundo de Bitcoin</h2><p>Bitcoin es una forma de dinero digital descentralizado que funciona sin necesidad de intermediarios como bancos o gobiernos.</p><p>Fue creado en 2009 por una persona o grupo bajo el seudónimo de Satoshi Nakamoto.</p>',
            video_url: 'https://www.youtube.com/watch?v=s4g1XFU8Gto',
            video_duration_minutes: 15,
            order_index: 0,
            is_free_preview: true,
          },
          {
            title: 'Historia del dinero',
            slug: 'historia-del-dinero',
            description: 'Desde el trueque hasta las criptomonedas',
            content: '<h2>La evolución del dinero</h2><p>Para entender Bitcoin, primero debemos entender el dinero y cómo ha evolucionado a lo largo de la historia.</p><p>Desde el trueque, pasando por las monedas de oro, el papel moneda, hasta llegar al dinero digital.</p>',
            video_url: 'https://www.youtube.com/watch?v=DuoKEHN5WvM',
            video_duration_minutes: 20,
            order_index: 1,
            is_free_preview: true,
          },
          {
            title: 'Por qué Bitcoin es diferente',
            slug: 'por-que-bitcoin-es-diferente',
            description: 'Las características únicas de Bitcoin',
            content: '<h2>Características de Bitcoin</h2><p>Bitcoin tiene propiedades que lo hacen único: descentralización, escasez programada, transparencia y resistencia a la censura.</p>',
            video_url: 'https://www.youtube.com/watch?v=bBC-nXj3Ng4',
            video_duration_minutes: 25,
            order_index: 2,
            is_free_preview: false,
          },
        ]
      },
      {
        title: 'Cómo funciona Bitcoin',
        description: 'Entiende la tecnología detrás de Bitcoin',
        order_index: 1,
        lessons: [
          {
            title: 'La Blockchain explicada',
            slug: 'blockchain-explicada',
            description: 'Qué es y cómo funciona la blockchain',
            content: '<h2>Blockchain</h2><p>La blockchain es un libro de contabilidad distribuido que registra todas las transacciones de Bitcoin de forma inmutable y transparente.</p>',
            video_url: 'https://www.youtube.com/watch?v=SSo_EIwHSd4',
            video_duration_minutes: 18,
            order_index: 0,
            is_free_preview: false,
          },
          {
            title: 'Minería de Bitcoin',
            slug: 'mineria-bitcoin',
            description: 'Cómo se crean nuevos bitcoins',
            content: '<h2>Minería</h2><p>La minería es el proceso de validar transacciones y añadir nuevos bloques a la blockchain. Los mineros reciben bitcoins como recompensa.</p>',
            video_url: 'https://www.youtube.com/watch?v=GmOzih6I1zs',
            video_duration_minutes: 22,
            order_index: 1,
            is_free_preview: false,
          },
        ]
      },
      {
        title: 'Usando Bitcoin',
        description: 'Guía práctica para usar Bitcoin',
        order_index: 2,
        lessons: [
          {
            title: 'Tu primera wallet',
            slug: 'primera-wallet',
            description: 'Cómo crear y usar una wallet de Bitcoin',
            content: '<h2>Wallets</h2><p>Una wallet es tu puerta de entrada a Bitcoin. Aprenderás a elegir y configurar tu primera wallet de forma segura.</p>',
            video_url: 'https://www.youtube.com/watch?v=d8IBpfs9bf4',
            video_duration_minutes: 15,
            order_index: 0,
            is_free_preview: false,
          },
          {
            title: 'Seguridad básica',
            slug: 'seguridad-basica',
            description: 'Protege tus bitcoins',
            content: '<h2>Seguridad</h2><p>La seguridad es fundamental en Bitcoin. Aprende las mejores prácticas para proteger tus fondos.</p>',
            video_url: 'https://www.youtube.com/watch?v=0bcVNzSoHKg',
            video_duration_minutes: 20,
            order_index: 1,
            is_free_preview: false,
          },
        ]
      }
    ]
  },
  {
    slug: 'ethereum-smart-contracts',
    title: 'Ethereum y Smart Contracts',
    description: 'Domina Ethereum y aprende a crear contratos inteligentes. Curso intermedio para desarrolladores.',
    long_description: `Lleva tus conocimientos de blockchain al siguiente nivel con Ethereum.

En este curso aprenderás:
- Qué es Ethereum y en qué se diferencia de Bitcoin
- Qué son los Smart Contracts
- Introducción a Solidity
- DApps y DeFi
- Casos de uso reales

Requisitos: Conocimientos básicos de programación y blockchain.`,
    level: 'intermediate',
    status: 'published',
    is_free: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    banner_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1600',
    modules: [
      {
        title: 'Introducción a Ethereum',
        description: 'Fundamentos de la plataforma Ethereum',
        order_index: 0,
        lessons: [
          {
            title: '¿Qué es Ethereum?',
            slug: 'que-es-ethereum',
            description: 'La computadora mundial descentralizada',
            content: '<h2>Ethereum</h2><p>Ethereum es una plataforma descentralizada que permite ejecutar aplicaciones y contratos inteligentes sin intermediarios.</p>',
            video_url: 'https://www.youtube.com/watch?v=jxLkbJozKbY',
            video_duration_minutes: 20,
            order_index: 0,
            is_free_preview: true,
          },
          {
            title: 'ETH vs BTC',
            slug: 'eth-vs-btc',
            description: 'Diferencias clave entre Ethereum y Bitcoin',
            content: '<h2>Comparación</h2><p>Aunque ambos son criptomonedas, Ethereum y Bitcoin tienen propósitos y características muy diferentes.</p>',
            video_url: 'https://www.youtube.com/watch?v=0UBk1e5qnr4',
            video_duration_minutes: 15,
            order_index: 1,
            is_free_preview: false,
          },
        ]
      },
      {
        title: 'Smart Contracts',
        description: 'Contratos inteligentes en Ethereum',
        order_index: 1,
        lessons: [
          {
            title: '¿Qué son los Smart Contracts?',
            slug: 'que-son-smart-contracts',
            description: 'Contratos que se ejecutan solos',
            content: '<h2>Smart Contracts</h2><p>Los contratos inteligentes son programas que se ejecutan automáticamente cuando se cumplen ciertas condiciones.</p>',
            video_url: 'https://www.youtube.com/watch?v=ZE2HxTmxfrI',
            video_duration_minutes: 25,
            order_index: 0,
            is_free_preview: false,
          },
          {
            title: 'Introducción a Solidity',
            slug: 'intro-solidity',
            description: 'El lenguaje de los Smart Contracts',
            content: '<h2>Solidity</h2><p>Solidity es el lenguaje de programación más usado para escribir smart contracts en Ethereum.</p>',
            video_url: 'https://www.youtube.com/watch?v=gyMwXuJrbJQ',
            video_duration_minutes: 30,
            order_index: 1,
            is_free_preview: false,
          },
        ]
      }
    ]
  },
  {
    slug: 'defi-principiantes',
    title: 'DeFi para Principiantes',
    description: 'Descubre las finanzas descentralizadas. Aprende a usar protocolos DeFi de forma segura.',
    long_description: `Las finanzas descentralizadas están revolucionando el mundo financiero.

Aprenderás:
- Qué es DeFi y por qué importa
- Principales protocolos (Uniswap, Aave, Compound)
- Yield farming y staking
- Riesgos y seguridad
- Cómo empezar de forma segura

Curso práctico con ejemplos reales.`,
    level: 'beginner',
    status: 'draft',
    is_free: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
    banner_url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1600',
    modules: [
      {
        title: '¿Qué es DeFi?',
        description: 'Introducción a las finanzas descentralizadas',
        order_index: 0,
        lessons: [
          {
            title: 'Finanzas tradicionales vs DeFi',
            slug: 'tradfi-vs-defi',
            description: 'Por qué DeFi es revolucionario',
            content: '<h2>DeFi</h2><p>Las finanzas descentralizadas eliminan intermediarios financieros tradicionales usando tecnología blockchain.</p>',
            video_url: 'https://www.youtube.com/watch?v=k9HYC0EJU6E',
            video_duration_minutes: 18,
            order_index: 0,
            is_free_preview: true,
          },
        ]
      }
    ]
  }
]

// ============================================
// FUNCIONES DE SEED
// ============================================

async function clearSeedData() {
  console.log('Limpiando datos de seed anteriores...')

  // Eliminar cursos de seed (cascade eliminará módulos/lecciones)
  const { error: coursesError } = await supabase
    .from('courses')
    .delete()
    .in('slug', TEST_COURSES.map(c => c.slug))

  if (coursesError) {
    console.log('  No se pudieron eliminar cursos anteriores:', coursesError.message)
  } else {
    console.log('  Cursos anteriores eliminados')
  }
}

async function getAdminUser(): Promise<string> {
  console.log('Verificando usuario admin...')

  // Buscar usuario admin existente
  const { data: existingUser, error } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', ADMIN_EMAIL)
    .single()

  if (error || !existingUser) {
    console.log('  Usuario admin no encontrado.')
    console.log('  Debes hacer login primero con:', ADMIN_EMAIL)
    console.log('  Visita http://localhost:3000/login y autentícate')
    process.exit(1)
  }

  console.log('  Admin encontrado:', existingUser.id.substring(0, 8) + '...')
  console.log('  Role:', existingUser.role)

  return existingUser.id
}

async function createCourses(instructorId: string): Promise<Map<string, string>> {
  console.log('\nCreando cursos...')

  const courseIds = new Map<string, string>()

  for (const courseData of TEST_COURSES) {
    console.log(`\n  Curso: ${courseData.title}`)

    // Crear curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        slug: courseData.slug,
        title: courseData.title,
        description: courseData.description,
        long_description: courseData.long_description,
        level: courseData.level,
        status: courseData.status,
        is_free: courseData.is_free,
        instructor_id: instructorId,
        thumbnail_url: courseData.thumbnail_url,
        banner_url: courseData.banner_url,
      })
      .select('id')
      .single()

    if (courseError) {
      console.error(`    Error creando curso ${courseData.slug}:`, courseError.message)
      continue
    }

    courseIds.set(courseData.slug, course.id)
    console.log(`    ID: ${course.id.substring(0, 8)}...`)

    // Crear módulos y lecciones
    for (const moduleData of courseData.modules) {
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_id: course.id,
          title: moduleData.title,
          description: moduleData.description,
          order_index: moduleData.order_index,
        })
        .select('id')
        .single()

      if (moduleError) {
        console.error(`      Error creando módulo ${moduleData.title}:`, moduleError.message)
        continue
      }

      console.log(`    Módulo: ${moduleData.title}`)

      // Crear lecciones
      for (const lessonData of moduleData.lessons) {
        const { error: lessonError } = await supabase
          .from('lessons')
          .insert({
            module_id: module.id,
            course_id: course.id,
            title: lessonData.title,
            slug: lessonData.slug,
            description: lessonData.description,
            content: lessonData.content,
            video_url: lessonData.video_url,
            video_duration_minutes: lessonData.video_duration_minutes,
            order_index: lessonData.order_index,
            is_free_preview: lessonData.is_free_preview,
          })

        if (lessonError) {
          console.error(`        Error creando lección ${lessonData.title}:`, lessonError.message)
        } else {
          console.log(`      Lección: ${lessonData.title}`)
        }
      }
    }
  }

  return courseIds
}

async function updateCourseTotals(courseIds: Map<string, string>) {
  console.log('\nActualizando totales de cursos...')

  for (const [slug, courseId] of courseIds) {
    // Contar módulos
    const { count: modulesCount } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

    // Contar lecciones y duración (usando course_id directamente)
    const { data: lessons } = await supabase
      .from('lessons')
      .select('video_duration_minutes')
      .eq('course_id', courseId)

    const lessonsCount = lessons?.length || 0
    const totalDuration = lessons?.reduce((acc, l) => acc + (l.video_duration_minutes || 0), 0) || 0

    // Actualizar curso
    await supabase
      .from('courses')
      .update({
        total_modules: modulesCount || 0,
        total_lessons: lessonsCount,
        total_duration_minutes: totalDuration,
      })
      .eq('id', courseId)

    console.log(`  ${slug}: ${modulesCount} módulos, ${lessonsCount} lecciones, ${totalDuration} min`)
  }
}

async function printSummary(courseIds: Map<string, string>) {
  console.log('\n========================================')
  console.log('SEED COMPLETADO')
  console.log('========================================\n')

  // Contar datos
  const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true })
  const { count: modulesCount } = await supabase.from('modules').select('*', { count: 'exact', head: true })
  const { count: lessonsCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true })

  console.log('RESUMEN:')
  console.log(`  Cursos: ${coursesCount}`)
  console.log(`  Módulos: ${modulesCount}`)
  console.log(`  Lecciones: ${lessonsCount}`)

  console.log('\nCURSOS CREADOS:')
  for (const course of TEST_COURSES) {
    const status = course.status === 'published' ? '[PUBLICADO]' : '[BORRADOR]'
    console.log(`  ${status} ${course.title}`)
    console.log(`    URL: /cursos/${course.slug}`)
  }

  console.log('\nURLs DE PRUEBA:')
  console.log('  Catálogo: http://localhost:3000/cursos')
  console.log('  Bitcoin: http://localhost:3000/cursos/bitcoin-fundamentos')
  console.log('  Ethereum: http://localhost:3000/cursos/ethereum-smart-contracts')
  console.log('  Dashboard: http://localhost:3000/dashboard')
  console.log('  Admin: http://localhost:3000/admin/cursos')

  console.log('\n========================================\n')
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n========================================')
  console.log('SEED DE TESTING - NODO360')
  console.log('========================================\n')

  try {
    // 1. Limpiar datos anteriores
    await clearSeedData()

    // 2. Obtener admin user
    const adminId = await getAdminUser()

    // 3. Crear cursos
    const courseIds = await createCourses(adminId)

    // 4. Actualizar totales
    await updateCourseTotals(courseIds)

    // 5. Mostrar resumen
    await printSummary(courseIds)

  } catch (error) {
    console.error('Error en seed:', error)
    process.exit(1)
  }
}

main()
