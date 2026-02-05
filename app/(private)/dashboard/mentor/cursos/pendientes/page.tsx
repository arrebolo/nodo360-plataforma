import { createClient } from '@/lib/supabase/server'
import { requireMentor } from '@/lib/auth/requireMentor'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Clock,
  BookOpen,
  User,
  Layers,
  Calendar,
  Eye,
  CheckCircle,
} from 'lucide-react'
import { getReviewCounts } from '@/lib/courses/reviews'

export const metadata = {
  title: 'Cursos Pendientes | Mentor Nodo360',
  description: 'Revisa y aprueba cursos de instructores',
}

export default async function MentorPendingCoursesPage() {
  const { userId } = await requireMentor()
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
      is_free,
      price,
      thumbnail_url,
      created_at,
      updated_at,
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
  const courseIds = courses?.map(c => c.id) || []
  let courseStats: Record<string, { modules: number; lessons: number }> = {}

  if (courseIds.length > 0) {
    const { data: modules } = await supabase
      .from('modules')
      .select('id, course_id, lessons(count)')
      .in('course_id', courseIds)

    modules?.forEach((m: any) => {
      if (!courseStats[m.course_id]) {
        courseStats[m.course_id] = { modules: 0, lessons: 0 }
      }
      courseStats[m.course_id].modules++
      courseStats[m.course_id].lessons += m.lessons?.[0]?.count || 0
    })
  }

  // Obtener conteo de reviews por curso
  const reviewCounts = await getReviewCounts(courseIds)

  // Check which courses this mentor has already voted on
  let mentorVotes: Record<string, string> = {}
  if (courseIds.length > 0) {
    const { data: mentorReviews } = await (supabase as any)
      .from('course_reviews')
      .select('course_id, vote')
      .eq('mentor_id', userId)
      .in('course_id', courseIds)

    for (const review of mentorReviews || []) {
      mentorVotes[review.course_id] = review.vote
    }
  }

  const levelLabels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard/mentor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al panel de mentor
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cursos Pendientes de Revisión</h1>
              <p className="text-white/60">
                {courses?.length || 0} curso{(courses?.length || 0) !== 1 ? 's' : ''} esperando revisión
              </p>
            </div>
          </div>
        </div>

        {/* Lista de cursos */}
        {courses && courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course: any) => {
              const instructor = course.users
              const stats = courseStats[course.id] || { modules: 0, lessons: 0 }
              const counts = reviewCounts[course.id] || { approve: 0, request_changes: 0 }
              const mentorVote = mentorVotes[course.id] || null

              return (
                <div
                  key={course.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-colors"
                >
                  <div className="flex gap-6">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {course.thumbnail_url ? (
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          width={160}
                          height={90}
                          className="w-40 h-24 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-40 h-24 bg-white/10 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h2 className="text-lg font-semibold text-white truncate">
                          {course.title}
                        </h2>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Review progress */}
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/70 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {counts.approve}/2 aprobaciones
                          </span>
                          {/* Mentor vote indicator */}
                          {mentorVote && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              mentorVote === 'approve'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {mentorVote === 'approve' ? 'Ya aprobaste' : 'Cambios solicitados'}
                            </span>
                          )}
                          {!mentorVote && (
                            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-white/60 line-clamp-2 mb-3">
                        {course.description || 'Sin descripción'}
                      </p>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                        {/* Instructor */}
                        <div className="flex items-center gap-2">
                          {instructor?.avatar_url ? (
                            <Image
                              src={instructor.avatar_url}
                              alt={instructor.full_name}
                              width={20}
                              height={20}
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          <span>{instructor?.full_name || 'Sin instructor'}</span>
                        </div>

                        {/* Nivel */}
                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                          {levelLabels[course.level] || course.level}
                        </span>

                        {/* Contenido */}
                        <div className="flex items-center gap-1">
                          <Layers className="w-4 h-4" />
                          <span>{stats.modules} módulos · {stats.lessons} lecciones</span>
                        </div>

                        {/* Precio */}
                        <span className={course.is_free ? 'text-green-400' : 'text-brand-light'}>
                          {course.is_free ? 'Gratis' : `${course.price || 0} EUR`}
                        </span>

                        {/* Fecha */}
                        <div className="flex items-center gap-1 ml-auto">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(course.updated_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 flex items-center">
                      <Link
                        href={`/dashboard/mentor/cursos/pendientes/${course.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 font-medium rounded-xl hover:bg-orange-500/30 transition"
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
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay cursos pendientes
            </h3>
            <p className="text-white/60">
              Todos los cursos han sido revisados. Vuelve más tarde.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
