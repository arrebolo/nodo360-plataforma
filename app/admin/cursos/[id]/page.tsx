import { ArrowLeft, Edit, Trash2, Eye, Users, Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const metadata = {
  title: 'Detalle de Curso | Admin - Nodo360',
}

async function getCourse(id: string) {
  const { supabase } = await requireAdmin()

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules:modules(
        id,
        title,
        order_index,
        lessons:lessons(id, title, order_index)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !course) {
    return null
  }

  return course
}

export default async function CursoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const course = await getCourse(id)

  if (!course) {
    notFound()
  }

  const statusColors = {
    draft: 'bg-yellow-500/20 text-yellow-400',
    published: 'bg-green-500/20 text-green-400',
    archived: 'bg-gray-500/20 text-gray-400',
  }

  const statusLabels = {
    draft: 'Borrador',
    published: 'Publicado',
    archived: 'Archivado',
  }

  const levelLabels = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/cursos"
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{course.title}</h1>
            <p className="text-white/60">/{course.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/cursos/${course.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
          >
            <Eye className="w-4 h-4" />
            Ver
          </Link>
          <Link
            href={`/admin/cursos/${course.id}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{course.enrolled_count || 0}</p>
              <p className="text-sm text-white/60">Estudiantes</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{course.total_lessons || 0}</p>
              <p className="text-sm text-white/60">Lecciones</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{course.duration_hours || 0}h</p>
              <p className="text-sm text-white/60">Duracion</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1 rounded-full ${statusColors[course.status as keyof typeof statusColors]}`}>
              {statusLabels[course.status as keyof typeof statusLabels]}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Descripcion</h2>
            <p className="text-white/70">{course.description || 'Sin descripcion'}</p>
            {course.long_description && (
              <p className="text-white/60 mt-4 text-sm">{course.long_description}</p>
            )}
          </div>

          {/* Modules */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Modulos ({course.modules?.length || 0})
            </h2>
            {course.modules && course.modules.length > 0 ? (
              <div className="space-y-3">
                {course.modules
                  .sort((a: any, b: any) => a.order_index - b.order_index)
                  .map((mod: any) => (
                    <div
                      key={mod.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">{mod.title}</h3>
                        <span className="text-sm text-white/50">
                          {mod.lessons?.length || 0} lecciones
                        </span>
                      </div>
                      {mod.lessons && mod.lessons.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm text-white/60">
                          {mod.lessons
                            .sort((a: any, b: any) => a.order_index - b.order_index)
                            .map((lesson: any) => (
                              <li key={lesson.id} className="pl-4 border-l border-white/10">
                                {lesson.title}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-white/50">No hay modulos creados</p>
            )}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Detalles</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/50">Nivel</dt>
                <dd className="text-white">{levelLabels[course.level as keyof typeof levelLabels]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">Categoria</dt>
                <dd className="text-white capitalize">{course.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">Precio</dt>
                <dd className="text-white">{course.is_free ? 'Gratis' : `$${course.price}`}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">Premium</dt>
                <dd className="text-white">{course.is_premium ? 'Si' : 'No'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">Creado</dt>
                <dd className="text-white">{new Date(course.created_at).toLocaleDateString('es')}</dd>
              </div>
              {course.published_at && (
                <div className="flex justify-between">
                  <dt className="text-white/50">Publicado</dt>
                  <dd className="text-white">{new Date(course.published_at).toLocaleDateString('es')}</dd>
                </div>
              )}
            </dl>
          </div>

          {course.tags && course.tags.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
