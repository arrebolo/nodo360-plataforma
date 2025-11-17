'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { CourseSidebar } from '@/components/course/CourseSidebar'
import { ModuleAccordion } from '@/components/course/ModuleAccordion'
import { MaterialCard } from '@/components/course/MaterialCard'
import { CourseTabs } from '@/components/course/CourseTabs'
import { UserProgressWidget } from '@/components/course/UserProgressWidget'
import { RelatedLinks } from '@/components/course/RelatedLinks'
import { EXAMPLE_MATERIALS } from '@/lib/constants/course-materials'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getCourseBySlug } from '@/lib/db/courses-queries-client'
import { getCourseProgress } from '@/lib/utils/progress'
import type { CourseWithModules } from '@/types/database'
import type { CourseTab, RelatedLink } from '@/types/course-system'
import { Clock, BookOpen, BarChart3, Play, MessageCircle, Check } from 'lucide-react'

export default function CoursePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string

  const [course, setCourse] = useState<CourseWithModules | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0, isCompleted: false })
  const [activeTab, setActiveTab] = useState<CourseTab>('resumen')

  useEffect(() => {
    // Leer tab de URL si existe
    const tab = searchParams.get('tab') as CourseTab
    if (tab && ['resumen', 'modulos', 'material', 'preguntas'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (slug) {
      loadCourse()
    }
  }, [slug])

  const loadCourse = async () => {
    try {
      console.log('🔍 [CoursePage] Cargando curso:', slug)
      const data = await getCourseBySlug(slug)

      if (!data) {
        console.log('❌ [CoursePage] Curso no encontrado')
        notFound()
        return
      }

      setCourse(data)

      // Calcular progreso
      const lessonIds = data.modules.flatMap((m) => m.lessons.map((l) => l.id))
      const courseProgress = getCourseProgress(lessonIds, lessonIds.length)
      setProgress(courseProgress)

      console.log('✅ [CoursePage] Curso cargado:', data.title)
    } catch (error) {
      console.error('❌ [CoursePage] Error:', error)
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
            <p className="text-gray-400">Cargando curso...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!course) {
    notFound()
    return null
  }

  const sortedModules = [...course.modules].sort((a, b) => a.order_index - b.order_index)
  sortedModules.forEach((m) => {
    m.lessons = [...m.lessons].sort((a, b) => a.order_index - b.order_index)
  })

  const firstLesson = sortedModules[0]?.lessons[0]
  const nextLesson = firstLesson && progress.percentage < 100 ? {
    moduleSlug: '', // TODO: Add slug to Module type
    lessonSlug: firstLesson.slug,
    title: firstLesson.title
  } : undefined

  // Enlaces relacionados de ejemplo
  const relatedLinks: RelatedLink[] = [
    {
      title: 'Glosario Bitcoin',
      source: 'Nodo360',
      url: '/recursos/glosario-bitcoin',
      type: 'interno'
    },
    {
      title: 'FAQs del curso',
      source: 'Nodo360',
      url: `/cursos/${course.slug}/preguntas`,
      type: 'interno'
    },
    {
      title: 'Bitcoin.org – Introducción',
      source: 'Bitcoin.org',
      url: 'https://bitcoin.org/es/como-empezar',
      type: 'externo'
    }
  ]

  return (
    <AppLayout>
      {/* Breadcrumbs */}
      <div className="border-b border-nodo-icon bg-nodo-card">
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumbs
            items={[
              { label: 'Cursos', href: '/cursos' },
              { label: course.is_free ? 'Gratuitos' : 'Premium', href: `/cursos?filter=${course.is_free ? 'free' : 'premium'}` },
              { label: course.title }
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Main Column */}
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-3">
                <Badge variant={course.is_free ? 'free' : 'premium'} />
                {progress.isCompleted && <Badge variant="completed" />}
                {progress.percentage > 0 && !progress.isCompleted && (
                  <Badge variant="in-progress" />
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {course.title}
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl text-gray-400 leading-relaxed">
                {course.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {firstLesson && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => (window.location.href = `/cursos/${course.slug}/${firstLesson.slug}`)}
                  >
                    <Play className="w-5 h-5" />
                    {progress.percentage > 0 ? 'Continuar curso' : 'Comenzar curso'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => (window.location.href = '/comunidad')}
                >
                  <MessageCircle className="w-5 h-5" />
                  Comunidad
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <CourseTabs active={activeTab} onChange={setActiveTab} />

            {/* Tab Content */}
            <div role="tabpanel" id={`panel-${activeTab}`}>
              {/* Resumen Tab */}
              {activeTab === 'resumen' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-nodo-card border border-nodo-icon rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[#F7931A]/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-[#F7931A]" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {course.total_modules}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">Módulos</div>
                    </div>
                    <div className="bg-nodo-card border border-nodo-icon rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[#F7931A]/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-[#F7931A]" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {course.total_lessons}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">Lecciones</div>
                    </div>
                    <div className="bg-nodo-card border border-nodo-icon rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[#F7931A]/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-[#F7931A]" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {Math.round((course.total_duration_minutes || 0) / 60)}h
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">Duración</div>
                    </div>
                  </div>

                  {/* About Section */}
                  {course.long_description && (
                    <div className="bg-nodo-card border border-nodo-icon rounded-xl p-8">
                      <h2 className="text-2xl font-bold text-white mb-6">Sobre este curso</h2>
                      <div className="prose prose-invert max-w-none">
                        <div className="text-gray-400" dangerouslySetInnerHTML={{ __html: course.long_description }} />
                      </div>
                    </div>
                  )}

                  {/* Instructor */}
                  {course.instructor && (
                    <div className="bg-nodo-card border border-nodo-icon rounded-xl p-8">
                      <h3 className="text-lg font-bold text-white mb-4">Instructor</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FDB931] flex items-center justify-center text-2xl text-black font-bold">
                          {course.instructor.full_name?.[0] || 'I'}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {course.instructor.full_name || 'Instructor'}
                          </div>
                          <div className="text-sm text-gray-400">Instructor del curso</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Módulos Tab */}
              {activeTab === 'modulos' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Contenido del curso</h2>
                  <ModuleAccordion course={course} />
                </div>
              )}

              {/* Material Tab */}
              {activeTab === 'material' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Material del Curso</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {EXAMPLE_MATERIALS.map((material, index) => (
                      <MaterialCard
                        key={index}
                        title={material.title}
                        description={material.description}
                        type={material.type}
                        url={material.url}
                        size={material.size}
                        downloadable={material.downloadable}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Preguntas Tab */}
              {activeTab === 'preguntas' && (
                <div className="bg-nodo-card border border-nodo-icon rounded-xl p-8 text-center space-y-4">
                  <p className="text-gray-400">Aún no hay preguntas frecuentes</p>
                  <Button variant="outline" onClick={() => (window.location.href = '/comunidad')}>
                    Ir a la Comunidad
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <UserProgressWidget
              courseId={course.id}
              percent={progress.percentage}
              nextLesson={nextLesson}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
