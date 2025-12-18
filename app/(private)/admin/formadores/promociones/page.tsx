// app/(private)/admin/formadores/promociones/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Promociones de Formadores | Admin Nodo360'
}

interface User {
  full_name: string
  email: string
  avatar_url: string | null
}

interface Instructor {
  id: string
  display_name: string
  avatar_url: string | null
  rating_avg: number | null
  total_sessions: number
  total_reviews: number
  user: User | null
}

interface EducatorRef {
  display_name: string
  slug: string
}

interface PromotedByUser {
  full_name: string
}

interface Promotion {
  id: string
  from_type: string
  to_type: string
  reason: string | null
  created_at: string
  educator: EducatorRef | null
  promoted_by_user: PromotedByUser | null
}

export default async function AdminPromocionesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener instructores activos (candidatos a promocion)
  const { data: instructors } = await supabase
    .from('educators')
    .select(`
      *,
      user:user_id (full_name, email, avatar_url)
    `)
    .eq('type', 'instructor')
    .eq('status', 'active')
    .order('rating_avg', { ascending: false })

  const safeInstructors = (instructors || []) as Instructor[]

  // Obtener historial de promociones
  const { data: promotions } = await supabase
    .from('educator_promotions')
    .select(`
      *,
      educator:educator_id (display_name, slug),
      promoted_by_user:promoted_by (full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  const safePromotions = (promotions || []) as Promotion[]

  // Criterios para promocion sugerida
  const suggestedForPromotion = safeInstructors.filter(i =>
    (i.total_sessions || 0) >= 20 &&
    (i.rating_avg || 0) >= 4.5 &&
    (i.total_reviews || 0) >= 10
  )

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/formadores" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Volver a formadores
          </Link>
          <h1 className="text-2xl font-bold">Promociones a Mentor</h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestiona las promociones de Instructor a Mentor
          </p>
        </div>

        {/* Criterios */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-amber-300 mb-3">Criterios sugeridos para promocion</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400">✓</span>
              <span>Minimo 20 sesiones completadas</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400">✓</span>
              <span>Rating promedio mayor o igual a 4.5 estrellas</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400">✓</span>
              <span>Minimo 10 valoraciones</span>
            </li>
          </ul>
        </div>

        {/* Sugeridos para promocion */}
        {suggestedForPromotion.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-amber-400">
              Candidatos sugeridos ({suggestedForPromotion.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedForPromotion.map(instructor => (
                <div
                  key={instructor.id}
                  className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                      {instructor.avatar_url || instructor.user?.avatar_url ? (
                        <img
                          src={instructor.avatar_url || instructor.user?.avatar_url || ''}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {instructor.display_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{instructor.display_name}</div>
                      <div className="text-xs text-gray-400">{instructor.user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span className="text-yellow-400">★ {Number(instructor.rating_avg).toFixed(1)}</span>
                    <span>{instructor.total_sessions} sesiones</span>
                    <span>{instructor.total_reviews} reviews</span>
                  </div>
                  <Link
                    href={`/admin/formadores/${instructor.id}`}
                    className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Revisar para promocion
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Todos los instructores */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Todos los Instructores ({safeInstructors.length})
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Instructor</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Rating</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Sesiones</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Reviews</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Accion</th>
                </tr>
              </thead>
              <tbody>
                {safeInstructors.map(instructor => {
                  const meetsRating = (instructor.rating_avg || 0) >= 4.5
                  const meetsSessions = (instructor.total_sessions || 0) >= 20
                  const meetsReviews = (instructor.total_reviews || 0) >= 10
                  const meetsAll = meetsRating && meetsSessions && meetsReviews

                  return (
                    <tr key={instructor.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                            {instructor.avatar_url ? (
                              <img src={instructor.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">
                                {instructor.display_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{instructor.display_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={meetsRating ? 'text-emerald-400' : 'text-gray-400'}>
                          ★ {Number(instructor.rating_avg || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={meetsSessions ? 'text-emerald-400' : 'text-gray-400'}>
                          {instructor.total_sessions || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={meetsReviews ? 'text-emerald-400' : 'text-gray-400'}>
                          {instructor.total_reviews || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/formadores/${instructor.id}`}
                          className={`text-sm px-3 py-1 rounded transition ${
                            meetsAll
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {meetsAll ? 'Promover' : 'Ver'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Historial de promociones */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Historial de promociones</h2>
          {safePromotions.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
              No hay promociones registradas
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5">
              {safePromotions.map(promo => (
                <div key={promo.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/formadores/${promo.educator?.slug}`}
                        className="font-medium hover:text-blue-400"
                      >
                        {promo.educator?.display_name}
                      </Link>
                      <span className="text-gray-500">-</span>
                      <span className={promo.to_type === 'mentor' ? 'text-amber-400' : 'text-blue-400'}>
                        {promo.from_type === 'instructor' && promo.to_type === 'mentor'
                          ? 'Promocionado a Mentor'
                          : 'Degradado a Instructor'
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Por {promo.promoted_by_user?.full_name || 'Sistema'} - {promo.reason}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(promo.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
