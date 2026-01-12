import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, BookOpen } from 'lucide-react'
import { DeleteModuleButton } from '@/components/admin/DeleteModuleButton'
import { ReorderModuleButtons } from '@/components/admin/ReorderModuleButtons'

interface ModulosPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ModulosPageProps) {
  return {
    title: 'Gestión de Módulos | Admin Nodo360',
  }
}

export default async function ModulosPage({ params }: ModulosPageProps) {
  await requireAdmin()
  const resolvedParams = await params
  const courseId = resolvedParams.id
  const supabase = await createClient()

  // Obtener curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    notFound()
  }

  // Obtener módulos con lecciones
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/cursos/${course.id}`}
            className="flex items-center gap-2 text-white/70 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al curso
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Gestión de Módulos
              </h1>
              <p className="text-white/70">{course.title}</p>
            </div>
            <Link
              href={`/admin/cursos/${course.id}/modulos/nuevo`}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-brand-light/50 transition"
            >
              <Plus className="w-5 h-5" />
              Crear Módulo
            </Link>
          </div>
        </div>

        {/* Lista de Módulos */}
        {modulesWithCount.length > 0 ? (
          <div className="space-y-4">
            {modulesWithCount.map((module, index) => (
              <div
                key={module.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition"
              >
                <div className="flex items-start gap-4">
                  {/* Número de orden */}
                  <div className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-lg bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center">
                      <span className="text-accent-blue font-bold text-lg">
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
                    <h3 className="text-xl font-bold text-white mb-2">
                      {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-white/70 mb-4">{module.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-white/50">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-success" />
                        <span>{module.lessons_count} lecciones</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/cursos/${course.id}/modulos/${module.id}/lecciones`}
                      className="px-4 py-2 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue rounded-lg hover:bg-accent-blue/20 transition text-sm font-medium"
                    >
                      Lecciones
                    </Link>
                    <Link
                      href={`/admin/cursos/${course.id}/modulos/${module.id}`}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition"
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
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-blue/10 border border-accent-blue/30 mb-6">
              <BookOpen className="w-10 h-10 text-accent-blue" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No hay módulos todavía
            </h3>
            <p className="text-white/70 mb-6">
              Comienza creando el primer módulo del curso
            </p>
            <Link
              href={`/admin/cursos/${course.id}/modulos/nuevo`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-xl transition"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Módulo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
