import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'
import Link from 'next/link'
import { Clock, Eye, CheckCircle, XCircle, User, Calendar, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Cursos Pendientes | Admin Nodo360',
}

export default async function PendingCoursesPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Obtener cursos pendientes de revisión
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      level,
      created_at,
      updated_at,
      instructor_id,
      users!courses_instructor_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('status', 'pending_review')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending courses:', error)
  }

  // Obtener conteo de módulos y lecciones para cada curso
  const coursesWithStats = await Promise.all(
    (courses || []).map(async (course) => {
      const { count: modulesCount } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)

      const { count: lessonsCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)

      return {
        ...course,
        modulesCount: modulesCount || 0,
        lessonsCount: lessonsCount || 0,
      }
    })
  )

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Cursos Pendientes</h1>
            </div>
            <p className="text-white/60">
              Revisa y aprueba los cursos enviados por instructores
            </p>
          </div>

          <Link
            href="/admin/cursos"
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
          >
            Ver todos los cursos
          </Link>
        </div>

        {/* Lista de cursos pendientes */}
        {coursesWithStats.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay cursos pendientes
            </h3>
            <p className="text-white/60">
              Todos los cursos han sido revisados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {coursesWithStats.map((course: any) => {
              const instructor = course.users
              return (
                <div
                  key={course.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition"
                >
                  <div className="flex items-start justify-between gap-6">
                    {/* Info del curso */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white truncate">
                          {course.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          course.level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                          course.level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {course.level === 'beginner' ? 'Principiante' :
                           course.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                        </span>
                      </div>

                      {course.description && (
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                        {/* Instructor */}
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{instructor?.full_name || 'Sin instructor'}</span>
                        </div>

                        {/* Fecha de envío */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Enviado {new Date(course.updated_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Contenido */}
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>{course.modulesCount} módulos, {course.lessonsCount} lecciones</span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/admin/cursos/pendientes/${course.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                      >
                        <Eye className="w-4 h-4" />
                        Revisar
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Contador */}
        {coursesWithStats.length > 0 && (
          <div className="mt-6 text-center text-white/50 text-sm">
            {coursesWithStats.length} curso{coursesWithStats.length !== 1 ? 's' : ''} pendiente{coursesWithStats.length !== 1 ? 's' : ''} de revisión
          </div>
        )}
      </div>
    </div>
  )
}
