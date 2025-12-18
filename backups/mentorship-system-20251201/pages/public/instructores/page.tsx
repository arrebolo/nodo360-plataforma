// app/instructores/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Instructores | Nodo360',
  description: 'Aprende con los mejores instructores de Bitcoin, Blockchain y Web3 en Nodo360.'
}

export default async function InstructoresPage() {
  const supabase = await createClient()

  console.log('🔍 [InstructoresPage] Cargando instructores...')

  const { data: instructores, error } = await supabase
    .from('educators')
    .select(`
      *,
      user:user_id (full_name, avatar_url),
      specialties:educator_specialties (
        specialty:specialty_id (id, name, slug, icon)
      )
    `)
    .eq('type', 'instructor')
    .eq('status', 'active')
    .order('rating_avg', { ascending: false })

  if (error) {
    console.error('❌ [InstructoresPage] Error:', error)
  }

  const safeInstructores = instructores || []

  console.log('✅ [InstructoresPage] Encontrados:', safeInstructores.length)

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cabecera */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🎓</span>
            <div>
              <p className="text-sm text-blue-400 font-semibold tracking-wide uppercase">
                Formacion profesional
              </p>
              <h1 className="text-3xl md:text-4xl font-bold">
                Instructores Nodo360
              </h1>
            </div>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Profesionales con experiencia contrastada en Bitcoin, Blockchain y Web3.
            Cada instructor ha superado nuestros examenes de capacidad y esta listo
            para ayudarte en tu camino de aprendizaje.
          </p>

          {/* Link a mentores */}
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-sm text-amber-200">
              🏆 Buscas la elite? Conoce a nuestros{' '}
              <Link href="/mentores" className="text-amber-400 font-semibold hover:underline">
                Mentores
              </Link>
              , lideres destacados de la comunidad Nodo360.
            </p>
          </div>
        </header>

        {safeInstructores.length === 0 ? (
          <div className="mt-16 text-center text-gray-400">
            <p className="text-xl mb-2">Todavia no hay instructores activos.</p>
            <p className="text-sm">
              Te gustaria ser instructor?
              <Link href="/dashboard/ser-formador" className="text-blue-400 ml-1 hover:underline">
                Aplica aqui
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeInstructores.map(instructor => {
              const userData = instructor.user as { full_name?: string; avatar_url?: string } | null
              const specialtiesData = instructor.specialties as Array<{ specialty: { id: string; name: string; slug: string; icon: string } | null }> | null

              return (
                <Link
                  key={instructor.id}
                  href={`/formadores/${instructor.slug}`}
                  className="group bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  {/* Banner */}
                  <div className="h-24 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 relative">
                    {instructor.banner_url && (
                      <img
                        src={instructor.banner_url}
                        alt=""
                        className="w-full h-full object-cover opacity-50"
                      />
                    )}
                    {/* Badge tipo */}
                    <span className="absolute top-3 right-3 bg-blue-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      🎓 INSTRUCTOR
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="relative px-5 -mt-10">
                    <div className="w-20 h-20 rounded-full border-4 border-[#070a10] overflow-hidden bg-gray-800">
                      {instructor.avatar_url || userData?.avatar_url ? (
                        <img
                          src={instructor.avatar_url || userData?.avatar_url}
                          alt={instructor.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
                          {instructor.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5 pt-3 flex flex-col flex-1">
                    <h2 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">
                      {instructor.display_name}
                    </h2>

                    {instructor.tagline && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {instructor.tagline}
                      </p>
                    )}

                    {/* Especialidades */}
                    {specialtiesData && specialtiesData.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {specialtiesData.slice(0, 3).map((s) => (
                          <span
                            key={s.specialty?.id}
                            className="inline-flex items-center gap-1 bg-white/5 text-gray-300 text-[10px] px-2 py-1 rounded-full"
                          >
                            <span>{s.specialty?.icon}</span>
                            <span>{s.specialty?.name}</span>
                          </span>
                        ))}
                        {specialtiesData.length > 3 && (
                          <span className="text-[10px] text-gray-500">
                            +{specialtiesData.length - 3} mas
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        {instructor.rating_avg && Number(instructor.rating_avg) > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span>{Number(instructor.rating_avg).toFixed(1)}</span>
                          </span>
                        )}
                        <span>{instructor.total_sessions || 0} sesiones</span>
                      </div>
                      <div>
                        {instructor.hourly_rate_credits && instructor.hourly_rate_credits > 0 ? (
                          <span className="text-blue-400 font-medium">
                            {instructor.hourly_rate_credits} creditos/h
                          </span>
                        ) : (
                          <span className="text-emerald-400">Consultar</span>
                        )}
                      </div>
                    </div>

                    {/* Disponibilidad */}
                    {instructor.is_available && (
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        Disponible para sesiones
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA ser instructor */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-2">Quieres ser instructor?</h3>
            <p className="text-gray-400 mb-4 max-w-md mx-auto">
              Comparte tus conocimientos con la comunidad Nodo360.
              Supera nuestro examen de capacidad y empieza a formar.
            </p>
            <Link
              href="/dashboard/ser-formador"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              🎓 Aplicar como Instructor
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
