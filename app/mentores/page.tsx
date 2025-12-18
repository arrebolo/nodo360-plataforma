// app/mentores/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentores | Nodo360',
  description: 'Conoce a los mentores elite de Nodo360, lideres destacados en Bitcoin, Blockchain y Web3.'
}

export default async function MentoresPage() {
  const supabase = await createClient()

  console.log('🔍 [MentoresPage] Cargando mentores...')

  const { data: mentores, error } = await supabase
    .from('educators')
    .select(`
      *,
      user:user_id (full_name, avatar_url),
      specialties:educator_specialties (
        specialty:specialty_id (id, name, slug, icon)
      ),
      achievements:educator_achievements (
        id, type, title, icon_url
      )
    `)
    .eq('type', 'mentor')
    .eq('status', 'active')
    .order('community_score', { ascending: false })

  if (error) {
    console.error('❌ [MentoresPage] Error:', error)
  }

  const safeMentores = mentores || []

  console.log('✅ [MentoresPage] Encontrados:', safeMentores.length)

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      {/* Hero especial para mentores */}
      <div className="bg-gradient-to-b from-amber-900/20 to-transparent border-b border-amber-500/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <span className="text-6xl mb-4 block">🏆</span>
            <p className="text-sm text-amber-400 font-semibold tracking-wide uppercase mb-2">
              La elite de Nodo360
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Mentores
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              Los mentores son la figura mas alta del organigrama Nodo360.
              Destacados por sus conocimientos, contribuciones a la comunidad
              y reconocimiento de sus alumnos.
            </p>
          </div>

          {/* Stats globales */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400">{safeMentores.length}</div>
              <div className="text-xs text-gray-400">Mentores activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400">
                {safeMentores.reduce((sum, m) => sum + (m.total_sessions || 0), 0)}
              </div>
              <div className="text-xs text-gray-400">Sesiones totales</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400">
                {safeMentores.reduce((sum, m) => sum + (m.total_students || 0), 0)}
              </div>
              <div className="text-xs text-gray-400">Alumnos formados</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Link a instructores */}
        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-sm text-blue-200">
            🎓 Buscas mas opciones? Conoce tambien a nuestros{' '}
            <Link href="/instructores" className="text-blue-400 font-semibold hover:underline">
              Instructores
            </Link>
            , profesionales verificados listos para ayudarte.
          </p>
        </div>

        {safeMentores.length === 0 ? (
          <div className="mt-16 text-center text-gray-400">
            <p className="text-xl mb-2">Todavia no hay mentores activos.</p>
            <p className="text-sm">
              Los mentores son instructores que han sido promocionados por su
              contribucion excepcional a la comunidad.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safeMentores.map(mentor => {
              const userData = mentor.user as { full_name?: string; avatar_url?: string } | null
              const specialtiesData = mentor.specialties as Array<{ specialty: { id: string; name: string; slug: string; icon: string } | null }> | null
              const achievementsData = mentor.achievements as Array<{ id: string; type: string; title: string; icon_url: string | null }> | null

              return (
                <Link
                  key={mentor.id}
                  href={`/formadores/${mentor.slug}`}
                  className="group bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-500/30 hover:border-amber-400/60 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10"
                >
                  {/* Banner dorado */}
                  <div className="h-28 bg-gradient-to-r from-amber-600/40 to-orange-600/40 relative">
                    {mentor.banner_url && (
                      <img
                        src={mentor.banner_url}
                        alt=""
                        className="w-full h-full object-cover opacity-50"
                      />
                    )}
                    {/* Badge MENTOR */}
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                      🏆 MENTOR
                    </span>

                    {/* Community score */}
                    {mentor.community_score && mentor.community_score > 0 && (
                      <span className="absolute bottom-3 right-3 bg-black/50 text-amber-300 text-[10px] px-2 py-1 rounded-full">
                        ⚡ {mentor.community_score} puntos comunidad
                      </span>
                    )}
                  </div>

                  <div className="flex p-5 gap-4">
                    {/* Avatar */}
                    <div className="-mt-12 flex-shrink-0">
                      <div className="w-24 h-24 rounded-full border-4 border-amber-500/50 overflow-hidden bg-gray-800 shadow-xl">
                        {mentor.avatar_url || userData?.avatar_url ? (
                          <img
                            src={mentor.avatar_url || userData?.avatar_url}
                            alt={mentor.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                            {mentor.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold group-hover:text-amber-400 transition-colors">
                        {mentor.display_name}
                      </h2>

                      {mentor.tagline && (
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                          {mentor.tagline}
                        </p>
                      )}

                      {/* Logros destacados */}
                      {achievementsData && achievementsData.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {achievementsData.slice(0, 3).map((a) => (
                            <span
                              key={a.id}
                              className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full"
                              title={a.title}
                            >
                              {a.icon_url ? (
                                <img src={a.icon_url} alt="" className="w-3 h-3" />
                              ) : (
                                <span>🏅</span>
                              )}
                              {a.title}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Especialidades */}
                      {specialtiesData && specialtiesData.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {specialtiesData.slice(0, 4).map((s) => (
                            <span
                              key={s.specialty?.id}
                              className="inline-flex items-center gap-1 bg-white/5 text-gray-300 text-[10px] px-2 py-1 rounded-full"
                            >
                              <span>{s.specialty?.icon}</span>
                              <span>{s.specialty?.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer stats */}
                  <div className="px-5 pb-5 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                      {mentor.rating_avg && Number(mentor.rating_avg) > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white font-medium">{Number(mentor.rating_avg).toFixed(1)}</span>
                          <span>({mentor.total_reviews} reviews)</span>
                        </span>
                      )}
                      <span>{mentor.total_sessions || 0} sesiones</span>
                      <span>{mentor.total_students || 0} alumnos</span>
                    </div>

                    {mentor.is_available && (
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        Disponible
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Info sobre ser mentor */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Como convertirse en Mentor?</h3>
            <p className="text-gray-300 mb-4 max-w-lg mx-auto">
              Los mentores son instructores que han demostrado un compromiso excepcional
              con la comunidad. Primero debes ser instructor y destacar por tu contribucion.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-black/30 px-4 py-2 rounded-lg">
                <span className="text-amber-400">1.</span> Se instructor
              </div>
              <div className="bg-black/30 px-4 py-2 rounded-lg">
                <span className="text-amber-400">2.</span> Acumula puntos de comunidad
              </div>
              <div className="bg-black/30 px-4 py-2 rounded-lg">
                <span className="text-amber-400">3.</span> Recibe la nominacion
              </div>
            </div>
            <Link
              href="/instructores"
              className="mt-6 inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium"
            >
              Ver instructores →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
