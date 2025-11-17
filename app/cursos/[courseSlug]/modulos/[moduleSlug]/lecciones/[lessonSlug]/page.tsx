import { notFound } from 'next/navigation'
import {
  getLessonBySlug,
  getAllLessonsForCourse,
  type LessonWithRelations,
} from '@/lib/db/courses-queries'
import { hasJsonContent } from '@/lib/lesson-helpers'
import { LessonRenderer } from '@/components/lesson'
import { PremiumLessonRenderer } from '@/components/lesson/premium'
import { OldLessonLayoutFull } from '@/components/lesson/OldLessonLayoutFull'
import { LessonPageWrapper } from '@/components/lesson/LessonPageWrapper'
import type { Metadata } from 'next'

// Configuración de Next.js para rutas dinámicas
export const dynamic = 'force-dynamic' // Genera bajo demanda
export const dynamicParams = true // Permite slugs no pre-generados

interface LessonPageProps {
  params: { courseSlug: string; moduleSlug: string; lessonSlug: string }
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const lesson = await getLessonBySlug(resolvedParams.courseSlug, resolvedParams.lessonSlug)

  if (!lesson) {
    return {
      title: 'Lección no encontrada | Nodo360',
    }
  }

  // ESTRUCTURA CONSISTENTE: lesson.module.course (singular)
  return {
    title: `${lesson.title} | ${lesson.module.course.title} | Nodo360`,
    description: lesson.description || `Aprende ${lesson.title} en Nodo360`,
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const resolvedParams = await params

  console.log('🚀 [LessonPage] Renderizando lección:', {
    courseSlug: resolvedParams.courseSlug,
    moduleSlug: resolvedParams.moduleSlug,
    lessonSlug: resolvedParams.lessonSlug,
  })

  // Paralelizar queries para mejor performance
  const [lesson, allCourseLessons] = await Promise.all([
    getLessonBySlug(resolvedParams.courseSlug, resolvedParams.lessonSlug),
    getAllLessonsForCourse(resolvedParams.courseSlug),
  ])

  if (!lesson) {
    console.log('❌ [LessonPage] Lección no encontrada')
    notFound()
  }

  // Verificar que la lección pertenece al módulo correcto
  if (lesson.module.slug !== resolvedParams.moduleSlug) {
    console.log('❌ [LessonPage] La lección no pertenece a este módulo:', {
      expectedModule: resolvedParams.moduleSlug,
      actualModule: lesson.module.slug,
    })
    notFound()
  }

  console.log('✅ [LessonPage] Lección cargada:', {
    lesson: lesson.title,
    module: lesson.module.title,
    course: lesson.module.course.title,
  })

  // ESTRUCTURA CONSISTENTE: lesson.module.course (singular)
  const course = lesson.module.course
  const isPremium = course?.is_premium || false

  // Ordenar lecciones por order_index
  const sortedLessons = allCourseLessons
    .map((l) => ({
      slug: l.slug,
      order_index: l.order_index,
      moduleSlug: l.module.slug
    }))
    .sort((a, b) => a.order_index - b.order_index)

  // Encontrar la siguiente lección
  const currentLessonIndex = sortedLessons.findIndex((l) => l.slug === lesson.slug)
  const nextLessonData =
    currentLessonIndex >= 0 && currentLessonIndex < sortedLessons.length - 1
      ? sortedLessons[currentLessonIndex + 1]
      : undefined

  console.log('📊 [LessonPage] Progreso:', {
    currentIndex: currentLessonIndex,
    total: sortedLessons.length,
    nextSlug: nextLessonData?.slug,
    nextModule: nextLessonData?.moduleSlug,
  })

  // NUEVO SISTEMA: Si tiene content_json, usar nuevo renderer
  if (hasJsonContent(lesson)) {
    if (isPremium) {
      // Versión Premium
      return (
        <LessonPageWrapper
          courseSlug={resolvedParams.courseSlug}
          moduleSlug={resolvedParams.moduleSlug}
          lessonSlug={lesson.slug}
          lessonId={lesson.id}
          isPremium={isPremium}
          allLessons={sortedLessons}
          nextLessonSlug={nextLessonData?.slug}
          nextLessonModuleSlug={nextLessonData?.moduleSlug}
        >
          <PremiumLessonRenderer
            content={lesson.content_json!}
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            courseTitle={course.title}
            completedLessons={0}
            totalLessons={allCourseLessons.length}
            initialProgress={0}
          />
        </LessonPageWrapper>
      )
    } else {
      // Versión Gratuita
      return (
        <LessonPageWrapper
          courseSlug={resolvedParams.courseSlug}
          moduleSlug={resolvedParams.moduleSlug}
          lessonSlug={lesson.slug}
          lessonId={lesson.id}
          isPremium={isPremium}
          allLessons={sortedLessons}
          nextLessonSlug={nextLessonData?.slug}
          nextLessonModuleSlug={nextLessonData?.moduleSlug}
        >
          <LessonRenderer content={lesson.content_json!} progress={0} />
        </LessonPageWrapper>
      )
    }
  }

  // FALLBACK: HTML antiguo (backward compatibility)
  // Para lecciones que aún usan el formato antiguo con content HTML
  console.log('⚠️ [LessonPage] Usando layout antiguo (sin content_json)')

  // Necesitamos obtener next/prev lessons para el layout antiguo
  // Usamos la lógica de navegación manual
  const prevLessonData =
    currentLessonIndex > 0 ? sortedLessons[currentLessonIndex - 1] : undefined

  // Crear objetos Lesson simplificados para navegación
  const nextLesson = nextLessonData
    ? allCourseLessons.find((l) => l.slug === nextLessonData.slug)
    : null
  const previousLesson = prevLessonData
    ? allCourseLessons.find((l) => l.slug === prevLessonData.slug)
    : null

  return (
    <OldLessonLayoutFull
      lesson={lesson as any} // OldLessonLayoutFull espera estructura antigua
      courseSlug={resolvedParams.courseSlug}
      moduleSlug={resolvedParams.moduleSlug}
      previousLesson={previousLesson as any}
      nextLesson={nextLesson as any}
    />
  )
}
