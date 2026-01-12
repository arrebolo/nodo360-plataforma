import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireInstructorLike } from '@/lib/auth/requireInstructor'
import CourseHero from '@/components/course/CourseHero'
import CourseModulesPreview from '@/components/course/CourseModulesPreview'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import { tokens, cx } from '@/lib/design/tokens'
import { ChevronRight, Eye, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PreviewPageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { courseId } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single()

  return {
    title: course ? `Preview: ${course.title} | Nodo360` : 'Preview | Nodo360',
  }
}

export default async function CoursePreviewPage({ params }: PreviewPageProps) {
  const { courseId } = await params
  const { userId } = await requireInstructorLike()

  const supabase = await createClient()

  // Obtener el curso (verificando que el instructor es el dueño)
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      slug,
      title,
      description,
      level,
      status,
      thumbnail_url,
      banner_url,
      is_free,
      price,
      total_modules,
      total_lessons,
      total_duration_minutes,
      enrolled_count,
      instructor_id
    `)
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    notFound()
  }

  // Verificar que el usuario es el instructor del curso
  if (course.instructor_id !== userId) {
    notFound()
  }

  // Obtener módulos con lecciones
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      description,
      order_index,
      lessons (
        id,
        title,
        slug,
        order_index,
        video_duration_minutes,
        is_free_preview
      )
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  // Ordenar lecciones dentro de cada módulo
  const sortedModules = (modules || []).map(mod => ({
    ...mod,
    lessons: (mod.lessons || []).sort((a, b) => a.order_index - b.order_index)
  }))

  const isDraft = course.status === 'draft'

  return (
    <div className="min-h-screen bg-dark">
      {/* Banner de preview */}
      <div className="sticky top-0 z-50 bg-brand/90 backdrop-blur-sm border-b border-brand-light/20">
        <div className={cx(tokens.layout.container, 'py-3')}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">
                Modo Preview — Así verán los estudiantes tu curso
              </span>
              {isDraft && (
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs text-white">
                  Borrador
                </span>
              )}
            </div>
            <Link
              href={`/dashboard/instructor/cursos/${courseId}`}
              className="flex items-center gap-2 text-sm text-white hover:text-white/80 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al editor
            </Link>
          </div>
        </div>
      </div>

      <div className={cx(tokens.layout.container, tokens.layout.sectionGap, 'pt-6')}>
        {/* Breadcrumb simulado */}
        <nav className="flex items-center gap-2 text-sm text-neutral-500">
          <span className="text-neutral-400">Cursos</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-neutral-300">{course.title}</span>
        </nav>

        {/* HERO DEL CURSO */}
        <CourseHero
          course={{
            id: course.id,
            slug: course.slug,
            title: course.title,
            description: course.description ?? null,
            level: (course.level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
            status: (course.status || 'draft') as 'draft' | 'published' | 'archived' | 'coming_soon',
            is_free: course.is_free ?? false,
            price: course.price ?? null,
            total_modules: course.total_modules ?? sortedModules.length,
            total_lessons: course.total_lessons ?? sortedModules.reduce((acc, m) => acc + m.lessons.length, 0),
            total_duration_minutes: course.total_duration_minutes ?? null,
            enrolled_count: course.enrolled_count ?? 0,
            banner_url: course.banner_url ?? null,
            thumbnail_url: course.thumbnail_url ?? null,
          }}
          isEnrolled={false}
          progressPct={null}
          hrefDashboard="/dashboard/instructor/cursos"
        />

        {/* CONTENIDO DEL CURSO */}
        <div className="mt-6">
          <PageHeader
            title="Contenido del curso"
            subtitle={`${sortedModules.length} módulos · ${sortedModules.reduce((acc, m) => acc + m.lessons.length, 0)} lecciones`}
          />

          <div className="mt-4">
            {sortedModules.length > 0 ? (
              <CourseModulesPreview
                courseSlug={course.slug}
                modules={sortedModules}
              />
            ) : (
              <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
                <p className="text-white/60 mb-4">
                  Este curso aún no tiene módulos
                </p>
                <Button
                  href={`/dashboard/instructor/cursos/${courseId}/modulos`}
                  variant="primary"
                >
                  Agregar módulos
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-4 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-200">
                ¿Todo listo para publicar?
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Revisa que el contenido se vea correctamente antes de publicar
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                href={`/dashboard/instructor/cursos/${courseId}`}
                variant="secondary"
                size="sm"
              >
                Editar curso
              </Button>
              {isDraft && (
                <Button
                  href={`/dashboard/instructor/cursos/${courseId}`}
                  variant="primary"
                  size="sm"
                >
                  Publicar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
