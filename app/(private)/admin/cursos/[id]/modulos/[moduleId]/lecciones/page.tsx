import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, BookOpen, Video, Clock } from 'lucide-react'
import { ReorderLessonButtons } from '@/components/admin/ReorderLessonButtons'
import { DeleteLessonButton } from '@/components/admin/DeleteLessonButton'

interface PageProps {
  params: Promise<{
    id: string
    moduleId: string
  }>
}

export default async function LessonListPage({ params }: PageProps) {
  await requireAdmin()
  const { id, moduleId } = await params
  const courseId = id
  const supabase = await createClient()

  // Obtener curso
  const { data: course } = await supabase
    .from('courses')
    .select('title, slug')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  // Obtener módulo
  const { data: module } = await supabase
    .from('modules')
    .select('title, slug, order_index')
    .eq('id', moduleId)
    .single()

  if (!module) notFound()

  // Obtener lecciones del módulo
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  const totalLessons = lessons?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-secondary via-dark-surface to-dark-secondary text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/admin/cursos" className="text-white/70 hover:text-white transition">
            Cursos
          </Link>
          <span className="text-white/70">/</span>
          <Link href={`/admin/cursos/${courseId}/modulos`} className="text-white/70 hover:text-white transition">
            {course.title}
          </Link>
          <span className="text-white/70">/</span>
          <span className="text-white font-medium">Módulo {module.order_index + 1}: {module.title}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href={`/admin/cursos/${courseId}/modulos`}
                className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-light to-brand bg-clip-text text-transparent">
                Lecciones
              </h1>
            </div>
            <p className="text-white/70 ml-14">
              Gestiona las lecciones del módulo "{module.title}"
            </p>
          </div>

          <Link
            href={`/admin/cursos/${courseId}/modulos/${moduleId}/lecciones/nueva`}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-brand-light/50 transition"
          >
            <Plus className="w-5 h-5" />
            Nueva Lección
          </Link>
        </div>

        {/* Lecciones List */}
        {totalLessons === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-white/70 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay lecciones</h3>
            <p className="text-white/70 mb-6">
              Crea la primera lección para este módulo
            </p>
            <Link
              href={`/admin/cursos/${courseId}/modulos/${moduleId}/lecciones/nueva`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-brand-light/50 transition"
            >
              <Plus className="w-5 h-5" />
              Crear Primera Lección
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons?.map((lesson, index) => (
              <div
                key={lesson.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-accent-blue/50 transition group"
              >
                <div className="flex items-start gap-4">
                  {/* Orden Visual */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-brand-light to-brand flex items-center justify-center text-white font-bold text-lg">
                    {lesson.order_index + 1}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-white/70 text-sm">
                            {lesson.description}
                          </p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lesson.is_free_preview && (
                          <span className="px-3 py-1 bg-success/20 text-success border border-success/30 rounded-full text-xs font-medium">
                            Vista Previa
                          </span>
                        )}
                        {lesson.video_url && (
                          <span className="px-3 py-1 bg-accent-blue/20 text-accent-blue border border-accent-blue/30 rounded-full text-xs font-medium flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            Video
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-white/70 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {lesson.slug}
                      </span>
                      {lesson.video_duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.video_duration_minutes} min
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-3">
                      <ReorderLessonButtons
                        lessonId={lesson.id}
                        moduleId={moduleId}
                        currentIndex={index}
                        totalLessons={totalLessons}
                      />

                      <Link
                        href={`/admin/cursos/${courseId}/modulos/${moduleId}/lecciones/${lesson.id}`}
                        className="px-4 py-2 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue rounded-lg hover:bg-accent-blue/20 transition font-medium"
                      >
                        Editar
                      </Link>

                      <DeleteLessonButton
                        lessonId={lesson.id}
                        lessonTitle={lesson.title}
                        moduleId={moduleId}
                        courseId={courseId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
