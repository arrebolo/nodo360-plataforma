import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  GraduationCap,
  Star,
  Users,
  BookOpen,
  Award,
  Calendar,
  ExternalLink,
} from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('instructor_profiles')
    .select('users (full_name)')
    .eq('user_id', id)
    .eq('is_active', true)
    .single()

  const user = profile?.users as unknown as { full_name: string } | null

  return {
    title: user?.full_name ? `${user.full_name} - Instructor | Nodo360` : 'Instructor | Nodo360',
    description: `Perfil del instructor ${user?.full_name || ''} en Nodo360`,
  }
}

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Obtener perfil del instructor
  const { data: profile, error } = await supabase
    .from('instructor_profiles')
    .select(`
      id,
      user_id,
      bio,
      headline,
      specialties,
      certified_paths,
      total_courses,
      total_students,
      average_rating,
      total_reviews,
      is_verified,
      accepts_messages,
      created_at,
      users (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', id)
    .eq('is_active', true)
    .single()

  if (error || !profile) {
    notFound()
  }

  const user = profile.users as unknown as { id: string; full_name: string; avatar_url: string | null }

  // Obtener certificaciones activas
  const { data: certifications } = await supabase
    .from('instructor_certifications')
    .select(`
      id,
      certification_number,
      issued_at,
      expires_at,
      learning_paths (
        id,
        title,
        slug,
        icon
      )
    `)
    .eq('user_id', id)
    .eq('status', 'active')
    .order('issued_at', { ascending: false })

  // Obtener cursos publicados del instructor
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      short_description,
      thumbnail_url,
      enrolled_count,
      rating_average,
      rating_count,
      difficulty,
      duration_hours
    `)
    .eq('instructor_id', id)
    .eq('status', 'published')
    .order('enrolled_count', { ascending: false })

  return (
    <div className="min-h-screen bg-dark">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-b from-orange-500/10 via-transparent to-transparent">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link
            href="/instructores"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a instructores
          </Link>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name || 'Instructor'}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white/10"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center border-4 border-white/10">
                  <span className="text-5xl font-bold text-white">
                    {user?.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              {profile.is_verified && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center border-4 border-dark">
                  <Award className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user?.full_name || 'Instructor'}
              </h1>
              {profile.headline && (
                <p className="text-lg text-gray-400 mb-4">{profile.headline}</p>
              )}

              {/* Rating */}
              {profile.total_reviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xl font-bold text-white">
                      {profile.average_rating?.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({profile.total_reviews} calificaciones)
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">{profile.total_courses}</span>
                  <span className="text-gray-400">cursos</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">{profile.total_students?.toLocaleString()}</span>
                  <span className="text-gray-400">estudiantes</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Instructor desde</span>
                  <span className="text-white font-medium">
                    {new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            {profile.bio && (
              <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Acerca de</h2>
                <p className="text-gray-400 whitespace-pre-line">{profile.bio}</p>
              </section>
            )}

            {/* Cursos */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Cursos ({courses?.length || 0})
              </h2>

              {!courses || courses.length === 0 ? (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                  <BookOpen className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">Este instructor aun no tiene cursos publicados</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {courses.map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/cursos/${course.slug}`}
                      className="group flex gap-4 rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-white/10">
                        {course.thumbnail_url ? (
                          <Image
                            src={course.thumbnail_url}
                            alt={course.title}
                            width={128}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                          {course.title}
                        </h3>
                        {course.short_description && (
                          <p className="text-sm text-gray-400 line-clamp-1 mt-1">
                            {course.short_description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {course.rating_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-white">{course.rating_average?.toFixed(1)}</span>
                              <span className="text-gray-500">({course.rating_count})</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{course.enrolled_count?.toLocaleString()}</span>
                          </div>
                          {course.difficulty && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              course.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                              course.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {course.difficulty === 'beginner' ? 'Principiante' :
                               course.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                            </span>
                          )}
                        </div>
                      </div>

                      <ExternalLink className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Certificaciones */}
            <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-orange-400" />
                Certificaciones
              </h2>

              {!certifications || certifications.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin certificaciones activas</p>
              ) : (
                <div className="space-y-3">
                  {certifications.map((cert: any) => {
                    const lp = cert.learning_paths as { id: string; title: string; slug: string; icon: string }
                    return (
                      <div
                        key={cert.id}
                        className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{lp?.icon}</span>
                          <span className="font-medium text-white">{lp?.title}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          <p>N.° {cert.certification_number}</p>
                          <p>
                            Emitida: {new Date(cert.issued_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Especialidades */}
            {profile.specialties && profile.specialties.length > 0 && (
              <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Especialidades</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Contacto */}
            {profile.accepts_messages && (
              <section className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-2">¿Tienes preguntas?</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Este instructor acepta mensajes de estudiantes.
                </p>
                <button
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
                  disabled
                >
                  Enviar mensaje (pronto)
                </button>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
