import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, BookOpen, Video, Clock, GripVertical } from 'lucide-react'
import { ReorderLessonButtons } from '@/components/admin/ReorderLessonButtons'
import { DeleteLessonButton } from '@/components/admin/DeleteLessonButton'

interface PageProps {
  params: Promise<{
    courseId: string
    moduleId: string
  }>
}

export async function generateMetadata() {
  return {
    title: 'Gestión de Lecciones | Instructor Nodo360',
  }
}

export default async function InstructorLessonListPage({ params }: PageProps) {
  const { courseId, moduleId } = await params
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Obtener curso
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, instructor_id')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  // Verificar permisos: debe ser el instructor del curso o admin
  const isOwner = course.instructor_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    redirect('/dashboard')
  }

  // Obtener módulo
  const { data: module } = await supabase
    .from('modules')
    .select('id, title, slug, order_index')
    .eq('id', moduleId)
    .eq('course_id', courseId)
    .single()

  if (!module) notFound()

  // Obtener lecciones del módulo
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  const totalLessons = lessons?.length || 0
  const basePath = `/dashboard/instructor/cursos/${courseId}`

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/dashboard/instructor/cursos" className="text-white/60 hover:text-white transition">
            Mis Cursos
          </Link>
          <span className="text-white/40">/</span>
          <Link href={`${basePath}/modulos`} className="text-white/60 hover:text-white transition">
            {course.title}
          </Link>
          <span className="text-white/40">/</span>
          <span className="text-white font-medium">Módulo {module.order_index + 1}: {module.title}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href={`${basePath}/modulos`}
                className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-2xl font-bold text-white">
                Lecciones
              </h1>
            </div>
            <p className="text-white/60 ml-12">
              Gestiona las lecciones del módulo "{module.title}"
            </p>
          </div>

          <Link
            href={`${basePath}/modulos/${moduleId}/lecciones/nueva`}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Lección
          </Link>
        </div>

        {/* Lecciones List */}
        {totalLessons === 0 ? (
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-light/10 border border-brand-light/30 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-brand-light" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No hay lecciones</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Crea la primera lección para este módulo
            </p>
            <Link
              href={`${basePath}/modulos/${moduleId}/lecciones/nueva`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition"
            >
              <Plus className="w-4 h-4" />
              Crear Primera Lección
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons?.map((lesson, index) => (
              <div
                key={lesson.id}
                className="bg-dark-surface border border-white/10 rounded-2xl p-5 hover:border-white/20 transition group"
              >
                <div className="flex items-start gap-4">
                  {/* Orden Visual */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center text-white font-bold">
                    {lesson.order_index + 1}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-brand-light transition">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-white/60 text-sm line-clamp-2">
                            {lesson.description}
                          </p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lesson.is_free_preview && (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-medium">
                            Vista Previa
                          </span>
                        )}
                        {lesson.video_url && (
                          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            Video
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
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
                        href={`${basePath}/modulos/${moduleId}/lecciones/${lesson.id}`}
                        className="px-3 py-1.5 bg-brand-light/10 border border-brand-light/30 text-brand-light rounded-lg hover:bg-brand-light/20 transition text-sm font-medium"
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

        {/* Info helper */}
        {totalLessons > 0 && (
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-sm text-white/50 flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              Usa las flechas para reordenar las lecciones. El orden se guarda automáticamente.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
