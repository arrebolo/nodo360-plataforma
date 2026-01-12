import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, BookOpen, GripVertical } from 'lucide-react'
import { DeleteModuleButton } from '@/components/admin/DeleteModuleButton'
import { ReorderModuleButtons } from '@/components/admin/ReorderModuleButtons'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata() {
  return {
    title: 'Gestión de Módulos | Instructor Nodo360',
  }
}

export default async function InstructorModulosPage({ params }: PageProps) {
  const { courseId } = await params
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
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, instructor_id')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    notFound()
  }

  // Verificar permisos: debe ser el instructor del curso o admin
  const isOwner = course.instructor_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    redirect('/dashboard')
  }

  // Obtener módulos con conteo de lecciones
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select(`
      *,
      lessons (count)
    `)
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })

  if (modulesError) {
    console.error('❌ Error al cargar módulos:', modulesError)
  }

  const modulesWithCount = modules?.map(m => ({
    ...m,
    lessons_count: m.lessons?.[0]?.count || 0
  })) || []

  // Usar rutas de admin si es admin, sino instructor
  const basePath = isAdmin
    ? `/admin/cursos/${course.id}`
    : `/dashboard/instructor/cursos/${courseId}`
  const backPath = isAdmin
    ? `/admin/cursos/${course.id}`
    : `/dashboard/instructor/cursos/${courseId}`

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={backPath}
            className="flex items-center gap-2 text-white/60 hover:text-white transition mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al curso
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Gestión de Módulos
              </h1>
              <p className="text-white/60">{course.title}</p>
            </div>

            <Link
              href={`${basePath}/modulos/nuevo`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo módulo
            </Link>
          </div>
        </div>

        {/* Lista de Módulos */}
        {modulesWithCount.length > 0 ? (
          <div className="space-y-4">
            {modulesWithCount.map((module, index) => (
              <div
                key={module.id}
                className="bg-dark-surface border border-white/10 rounded-2xl p-5 hover:border-white/20 transition group"
              >
                <div className="flex items-start gap-4">
                  {/* Número de orden y reorder */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-light/10 border border-brand-light/30 flex items-center justify-center">
                      <span className="text-brand-light font-bold">
                        {module.order_index + 1}
                      </span>
                    </div>

                    {/* Botones de reorden */}
                    <ReorderModuleButtons
                      moduleId={module.id}
                      courseId={course.id}
                      currentIndex={index}
                      totalModules={modulesWithCount.length}
                    />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-brand-light transition">
                      {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">
                        {module.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span>{module.lessons_count} lecciones</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`${basePath}/modulos/${module.id}/lecciones`}
                      className="px-3 py-2 bg-brand-light/10 border border-brand-light/30 text-brand-light rounded-lg hover:bg-brand-light/20 transition text-sm font-medium"
                    >
                      Lecciones
                    </Link>
                    <Link
                      href={`${basePath}/modulos/${module.id}`}
                      className="p-2 bg-white/5 border border-white/10 text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition"
                      title="Editar módulo"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteModuleButton
                      moduleId={module.id}
                      moduleTitle={module.title}
                      courseId={course.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-light/10 border border-brand-light/30 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-brand-light" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Sin módulos
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Los módulos organizan el contenido de tu curso en secciones. Crea el primer módulo para empezar.
            </p>
            <Link
              href={`${basePath}/modulos/nuevo`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition"
            >
              <Plus className="w-4 h-4" />
              Crear primer módulo
            </Link>
          </div>
        )}

        {/* Info helper */}
        {modulesWithCount.length > 0 && (
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-sm text-white/50 flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              Usa las flechas para reordenar los módulos. El orden se guarda automáticamente.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
