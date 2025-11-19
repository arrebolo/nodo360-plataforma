'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { LessonContent } from '@/components/lesson/LessonContent'
import { LessonNavigation } from '@/components/lesson/LessonNavigation'
import { LessonNotes } from '@/components/lesson/LessonNotes'
import { LessonResources } from '@/components/lesson/LessonResources'
import { CourseSidebar } from '@/components/course/CourseSidebar'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { PersistentButtons } from '@/components/ui/PersistentButtons'
import {
  getLessonBySlug,
  getAllLessonsForCourse,
} from '@/lib/db/courses-queries-client'
import type { LessonWithRelations } from '@/types/database'
import { getCourseProgress } from '@/lib/utils/progress'
import { Menu, X } from 'lucide-react'

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const courseSlug = params?.slug as string
  const lessonSlug = params?.lessonSlug as string

  const [lesson, setLesson] = useState<LessonWithRelations | null>(null)
  const [allLessons, setAllLessons] = useState<LessonWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  useEffect(() => {
    if (courseSlug && lessonSlug) {
      loadLesson()
    }
  }, [courseSlug, lessonSlug])

  const loadLesson = async () => {
    try {
      console.log('🔍 [LessonPage] Cargando lección:', { courseSlug, lessonSlug })

      const [lessonData, allLessonsData] = await Promise.all([
        getLessonBySlug(courseSlug, lessonSlug),
        getAllLessonsForCourse(courseSlug),
      ])

      if (!lessonData) {
        console.log('❌ [LessonPage] Lección no encontrada')
        notFound()
        return
      }

      setLesson(lessonData)
      setAllLessons(allLessonsData)

      console.log('✅ [LessonPage] Lección cargada:', lessonData.title)
    } catch (error) {
      console.error('❌ [LessonPage] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#F7931A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Cargando lección...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!lesson) {
    notFound()
    return null
  }

  const course = lesson.module.course
  const sortedLessons = [...allLessons].sort((a, b) => a.order_index - b.order_index)
  const currentIndex = sortedLessons.findIndex((l) => l.id === lesson.id)
  const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null

  // Calcular progreso del curso
  const lessonIds = allLessons.map((l) => l.id)
  const progress = getCourseProgress(lessonIds, lessonIds.length)

  // Para CourseSidebar necesitamos el formato CourseWithModules
  const courseWithModules = {
    ...course,
    modules: Array.from(
      new Map(allLessons.map((l) => [l.module.id, l.module])).values()
    ).map((module) => ({
      ...module,
      lessons: allLessons.filter((l) => l.module.id === module.id),
    })),
  }

  // Encontrar módulo actual
  const currentModule = allLessons.find(l => l.slug === lessonSlug)?.module

  return (
    <AppLayout>
      {/* Breadcrumbs */}
      <div className="border-b border-nodo-icon bg-nodo-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Breadcrumbs
              items={[
                { label: 'Cursos', href: '/cursos' },
                { label: course.is_free ? 'Gratuitos' : 'Premium', href: `/cursos?filter=${course.is_free ? 'free' : 'premium'}` },
                { label: course.title, href: `/cursos/${courseSlug}` },
                { label: currentModule?.title || 'Módulo', href: `/cursos/${courseSlug}?tab=modulos` },
                { label: lesson.title }
              ]}
            />

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#0f172a] text-gray-400 hover:text-[#F7931A] hover:bg-[#2a2a2a] transition-colors border border-nodo-icon"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Content Column */}
          <div className="space-y-6">
            <LessonContent lesson={lesson} />
          </div>

          {/* Sidebar Column */}
          <div
            className={`space-y-6 ${
              sidebarOpen
                ? 'fixed inset-0 z-50 bg-black p-6 overflow-y-auto lg:static lg:z-auto lg:p-0'
                : 'hidden lg:block'
            }`}
          >
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden mb-4 px-4 py-2 bg-[#F7931A] hover:bg-[#FDB931] text-black font-medium rounded-lg w-full transition-colors"
              >
                Cerrar
              </button>
            )}

            <CourseSidebar
              course={courseWithModules as any}
              currentLessonSlug={lessonSlug}
              progress={progress}
            />

            <LessonNotes lessonId={lesson.id} />

            <LessonResources />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <LessonNavigation
        lessonId={lesson.id}
        courseSlug={courseSlug}
        courseId={course.id}
        totalLessons={allLessons.length}
        prevLesson={
          prevLesson ? { slug: prevLesson.slug, title: prevLesson.title } : null
        }
        nextLesson={
          nextLesson ? { slug: nextLesson.slug, title: nextLesson.title } : null
        }
      />

      {/* Persistent Buttons */}
      <PersistentButtons
        onNotesClick={() => setNotesOpen(!notesOpen)}
        onMentoringClick={() => router.push('/mentoria')}
        onCommunityClick={() => router.push('/comunidad')}
      />

      {/* Notes Drawer (simple overlay for now) */}
      {notesOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 lg:hidden"
          onClick={() => setNotesOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-nodo-card border-l border-nodo-icon p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Mis Notas</h2>
              <button
                onClick={() => setNotesOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <LessonNotes lessonId={lesson.id} />
          </div>
        </div>
      )}
    </AppLayout>
  )
}
