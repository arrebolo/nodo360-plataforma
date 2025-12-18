// app/formadores/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: educator } = await supabase
    .from('educators')
    .select('display_name, tagline, type')
    .eq('slug', slug)
    .single()

  if (!educator) {
    return { title: 'Formador no encontrado | Nodo360' }
  }

  const typeLabel = educator.type === 'mentor' ? 'Mentor' : 'Instructor'

  return {
    title: `${educator.display_name} - ${typeLabel} | Nodo360`,
    description: educator.tagline || `${typeLabel} en Nodo360`
  }
}

export default async function FormadorPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  console.log('🔍 [FormadorPage] Cargando perfil:', slug)

  // Obtener usuario actual (puede ser null)
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener educador
  const { data: educator, error } = await supabase
    .from('educators')
    .select(`
      *,
      user:user_id (full_name, email, avatar_url),
      specialties:educator_specialties (
        level,
        verified_at,
        exam_score,
        specialty:specialty_id (id, name, slug, icon, description, category)
      ),
      achievements:educator_achievements (
        id, type, title, description, icon_url, awarded_at, community_points
      ),
      availability:educator_availability (
        id, day_of_week, start_time, end_time, timezone, is_active
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !educator) {
    console.error('❌ [FormadorPage] No encontrado:', error)
    notFound()
  }

  // Obtener reviews
  const { data: reviews } = await supabase
    .from('session_reviews')
    .select(`
      id, rating, comment, created_at, is_featured,
      session:session_id (
        id,
        student:student_id (full_name, avatar_url)
      )
    `)
    .eq('session_id.educator_id', educator.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const safeReviews = reviews || []

  // Tipos para datos relacionados
  type UserData = { full_name?: string; email?: string; avatar_url?: string } | null
  type SpecialtyData = {
    level?: string
    verified_at?: string
    exam_score?: number
    specialty: {
      id: string
      name: string
      slug: string
      icon: string
      description?: string
      category?: string
    } | null
  }
  type AchievementData = {
    id: string
    type: string
    title: string
    description?: string
    icon_url?: string
    awarded_at: string
    community_points?: number
  }
  type AvailabilityData = {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    timezone?: string
    is_active: boolean
  }
  type ReviewData = {
    id: string
    rating: number
    comment?: string
    created_at: string
    is_featured?: boolean
    session: {
      id: string
      student: { full_name?: string; avatar_url?: string } | null
    } | null
  }

  const userData = educator.user as UserData
  const specialtiesData = educator.specialties as SpecialtyData[] | null
  const achievementsData = educator.achievements as AchievementData[] | null
  const availabilityData = educator.availability as AvailabilityData[] | null
  const socialLinks = educator.social_links as { twitter?: string; linkedin?: string; website?: string } | null

  // Dias de la semana
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

  const isMentor = educator.type === 'mentor'

  console.log('✅ [FormadorPage] Cargado:', educator.display_name)

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      {/* Banner */}
      <div className={`h-48 md:h-64 bg-gradient-to-r ${isMentor ? 'from-amber-900/50 to-orange-900/50' : 'from-blue-900/50 to-cyan-900/50'} relative`}>
        {educator.banner_url && (
          <img
            src={educator.banner_url}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
        )}

        {/* Breadcrumb */}
        <div className="absolute top-4 left-4 text-sm">
          <Link href={isMentor ? '/mentores' : '/instructores'} className="text-gray-300 hover:text-white">
            ← Volver a {isMentor ? 'Mentores' : 'Instructores'}
          </Link>
        </div>

        {/* Badge */}
        <div className="absolute top-4 right-4">
          <span className={`${isMentor ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black' : 'bg-blue-500 text-white'} text-sm font-bold px-4 py-2 rounded-full shadow-lg`}>
            {isMentor ? '🏆 MENTOR' : '🎓 INSTRUCTOR'}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Perfil header */}
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 ${isMentor ? 'border-amber-500' : 'border-blue-500'} overflow-hidden bg-gray-800 shadow-2xl flex-shrink-0`}>
              {educator.avatar_url || userData?.avatar_url ? (
                <img
                  src={educator.avatar_url || userData?.avatar_url}
                  alt={educator.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl text-gray-500">
                  {educator.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Info principal */}
            <div className="flex-1 pt-4 md:pt-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {educator.display_name}
              </h1>

              {educator.tagline && (
                <p className="text-lg text-gray-300 mb-4">
                  {educator.tagline}
                </p>
              )}

              {/* Stats rapidos */}
              <div className="flex flex-wrap gap-4 text-sm">
                {educator.rating_avg && Number(educator.rating_avg) > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-lg">★</span>
                    <span className="font-bold">{Number(educator.rating_avg).toFixed(1)}</span>
                    <span className="text-gray-400">({educator.total_reviews} reviews)</span>
                  </div>
                )}
                <div className="text-gray-400">
                  <span className="text-white font-medium">{educator.total_sessions || 0}</span> sesiones
                </div>
                <div className="text-gray-400">
                  <span className="text-white font-medium">{educator.total_students || 0}</span> alumnos
                </div>
                {isMentor && educator.community_score && educator.community_score > 0 && (
                  <div className="text-amber-400">
                    ⚡ <span className="font-medium">{educator.community_score}</span> puntos comunidad
                  </div>
                )}
              </div>
            </div>

            {/* CTA principal */}
            <div className="w-full md:w-auto md:pt-8">
              {educator.is_available ? (
                <Link
                  href={user ? `/dashboard/solicitar-sesion?educator=${educator.slug}` : `/login?redirect=/formadores/${slug}`}
                  className={`w-full md:w-auto inline-flex items-center justify-center gap-2 ${isMentor ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-3 rounded-xl font-semibold transition shadow-lg`}
                >
                  📅 Solicitar Sesion
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 bg-gray-700 text-gray-400 px-6 py-3 rounded-xl">
                  No disponible
                </span>
              )}

              {educator.hourly_rate_credits && educator.hourly_rate_credits > 0 && (
                <p className="text-center text-sm text-gray-400 mt-2">
                  {educator.hourly_rate_credits} creditos/hora
                </p>
              )}

              {educator.offers_free_intro && (
                <p className={`text-center text-sm ${isMentor ? 'text-amber-400' : 'text-blue-400'} mt-1`}>
                  ✓ {educator.free_intro_minutes || 10} min gratis de intro
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            {educator.bio && (
              <section>
                <h2 className="text-xl font-bold mb-4">Sobre mi</h2>
                <div className="bg-white/5 rounded-xl p-6 text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {educator.bio}
                </div>
              </section>
            )}

            {/* Especialidades */}
            {specialtiesData && specialtiesData.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Especialidades verificadas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {specialtiesData.map((s) => (
                    <div
                      key={s.specialty?.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{s.specialty?.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold">{s.specialty?.name}</h3>
                          <p className="text-xs text-gray-400 mt-1">{s.specialty?.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              s.level === 'expert' ? 'bg-amber-500/20 text-amber-300' :
                              s.level === 'advanced' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {s.level === 'expert' ? '🏆 Experto' :
                               s.level === 'advanced' ? '⭐ Avanzado' :
                               s.level === 'intermediate' ? '📚 Intermedio' : '📖 Basico'}
                            </span>
                            {s.verified_at && (
                              <span className="text-[10px] text-emerald-400">✓ Verificado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Logros (solo mentores o si tiene) */}
            {achievementsData && achievementsData.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Logros y reconocimientos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {achievementsData.map((a) => (
                    <div
                      key={a.id}
                      className="bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
                    >
                      {a.icon_url ? (
                        <img src={a.icon_url} alt="" className="w-10 h-10" />
                      ) : (
                        <span className="text-3xl">🏅</span>
                      )}
                      <div>
                        <h3 className="font-semibold text-amber-300">{a.title}</h3>
                        {a.description && (
                          <p className="text-xs text-gray-400 mt-1">{a.description}</p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-1">
                          {new Date(a.awarded_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {safeReviews.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">
                  Valoraciones de alumnos
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({educator.total_reviews} total)
                  </span>
                </h2>
                <div className="space-y-4">
                  {safeReviews.map((review) => {
                    const reviewData = review as unknown as ReviewData
                    return (
                      <div
                        key={reviewData.id}
                        className={`bg-white/5 rounded-xl p-4 ${reviewData.is_featured ? 'border border-amber-500/30' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                            {reviewData.session?.student?.avatar_url ? (
                              <img
                                src={reviewData.session.student.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                {reviewData.session?.student?.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {reviewData.session?.student?.full_name || 'Alumno'}
                              </span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span
                                    key={star}
                                    className={star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-600'}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              {reviewData.is_featured && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                                  Destacada
                                </span>
                              )}
                            </div>
                            {reviewData.comment && (
                              <p className="text-sm text-gray-300 mt-2">{reviewData.comment}</p>
                            )}
                            <p className="text-[10px] text-gray-500 mt-2">
                              {new Date(reviewData.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Disponibilidad */}
            {availabilityData && availabilityData.filter((a) => a.is_active).length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  📅 Disponibilidad
                </h3>
                <div className="space-y-2">
                  {availabilityData
                    .filter((a) => a.is_active)
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((slot) => (
                      <div key={slot.id} className="flex justify-between text-sm">
                        <span className="text-gray-400">{diasSemana[slot.day_of_week]}</span>
                        <span className="text-white">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-3">
                  Zona horaria: {availabilityData[0]?.timezone || 'Europe/Madrid'}
                </p>
              </div>
            )}

            {/* Info de sesiones */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4">💬 Tipos de sesion</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span>📹</span> Videollamada
                </li>
                <li className="flex items-center gap-2">
                  <span>💬</span> Chat en vivo
                </li>
                <li className="flex items-center gap-2">
                  <span>📝</span> Revision de tareas
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Precio por hora</span>
                  <span className={isMentor ? 'text-amber-400' : 'text-blue-400'}>
                    {educator.hourly_rate_credits && educator.hourly_rate_credits > 0
                      ? `${educator.hourly_rate_credits} creditos`
                      : 'Consultar'
                    }
                  </span>
                </div>
                {educator.offers_free_intro && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">Intro gratuita</span>
                    <span className="text-emerald-400">
                      {educator.free_intro_minutes || 10} min
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Social links */}
            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-semibold mb-4">🔗 Enlaces</h3>
                <div className="space-y-2">
                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                    >
                      𝕏 Twitter
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                    >
                      💼 LinkedIn
                    </a>
                  )}
                  {socialLinks.website && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                    >
                      🌐 Web personal
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* CTA secundario */}
            {educator.is_available && (
              <Link
                href={user ? `/dashboard/solicitar-sesion?educator=${educator.slug}` : `/login?redirect=/formadores/${slug}`}
                className={`w-full block text-center ${isMentor ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white py-3 rounded-xl font-semibold transition`}
              >
                Solicitar sesion
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
