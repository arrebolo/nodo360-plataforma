// app/formadores/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function BuscarFormadoresPage() {
  const supabase = createClient()

  const [educators, setEducators] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'instructor' | 'mentor'>('all')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'rating' | 'sessions' | 'recent'>('rating')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    // Cargar educadores
    const { data: educatorData } = await supabase
      .from('educators' as never)
      .select(`
        *,
        user:user_id (full_name, avatar_url),
        specialties:educator_specialties (
          specialty:specialty_id (id, name, slug, icon)
        )
      `)
      .eq('status', 'active')
      .order('rating_avg', { ascending: false })

    setEducators((educatorData as any[]) || [])

    // Cargar especialidades
    const { data: specialtyData } = await supabase
      .from('specialties' as never)
      .select('*')
      .eq('is_active', true)
      .order('order_index')

    setSpecialties((specialtyData as any[]) || [])
    setLoading(false)
  }

  // Filtrar y ordenar
  const filteredEducators = educators
    .filter(e => {
      // Filtro por búsqueda
      if (search) {
        const searchLower = search.toLowerCase()
        const matchName = e.display_name?.toLowerCase().includes(searchLower)
        const matchTagline = e.tagline?.toLowerCase().includes(searchLower)
        const matchBio = e.bio?.toLowerCase().includes(searchLower)
        const matchSpecialty = e.specialties?.some((s: any) =>
          s.specialty?.name?.toLowerCase().includes(searchLower)
        )
        if (!matchName && !matchTagline && !matchBio && !matchSpecialty) return false
      }

      // Filtro por tipo
      if (typeFilter !== 'all' && e.type !== typeFilter) return false

      // Filtro por especialidad
      if (specialtyFilter) {
        const hasSpecialty = e.specialties?.some((s: any) => s.specialty?.id === specialtyFilter)
        if (!hasSpecialty) return false
      }

      // Filtro por disponibilidad
      if (availableOnly && !e.is_available) return false

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating_avg || 0) - (a.rating_avg || 0)
        case 'sessions':
          return (b.total_sessions || 0) - (a.total_sessions || 0)
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  const mentorCount = educators.filter(e => e.type === 'mentor').length
  const instructorCount = educators.filter(e => e.type === 'instructor').length

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Encuentra tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-[#f7931a]">Formador</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Conecta con instructores y mentores expertos en Bitcoin, Blockchain y Web3.
            Aprende de los mejores de la comunidad Nodo360.
          </p>

          {/* Stats rápidos */}
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{instructorCount}</div>
              <div className="text-xs text-gray-500">Instructores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{mentorCount}</div>
              <div className="text-xs text-gray-500">Mentores</div>
            </div>
          </div>
        </header>

        {/* Barra de búsqueda principal */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, especialidad o palabras clave..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a] focus:ring-1 focus:ring-[#f7931a]/50 transition-all text-lg"
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">
              🔍
            </span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-xl p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">

            {/* Filtro por tipo */}
            <div className="flex bg-black/30 rounded-lg p-1">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  typeFilter === 'all'
                    ? 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('instructor')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  typeFilter === 'instructor'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Instructores
              </button>
              <button
                onClick={() => setTypeFilter('mentor')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  typeFilter === 'mentor'
                    ? 'bg-amber-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mentores
              </button>
            </div>

            {/* Filtro por especialidad */}
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f7931a]"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map(s => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>

            {/* Solo disponibles */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/30 text-[#f7931a] focus:ring-[#f7931a]"
              />
              <span className="text-sm text-gray-400">Solo disponibles</span>
            </label>

            {/* Ordenar */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'sessions' | 'recent')}
              className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f7931a] ml-auto"
            >
              <option value="rating">Mejor valorados</option>
              <option value="sessions">Mas sesiones</option>
              <option value="recent">Mas recientes</option>
            </select>
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            {filteredEducators.length} formador{filteredEducators.length !== 1 ? 'es' : ''} encontrado{filteredEducators.length !== 1 ? 's' : ''}
          </p>
          {(search || typeFilter !== 'all' || specialtyFilter || availableOnly) && (
            <button
              onClick={() => {
                setSearch('')
                setTypeFilter('all')
                setSpecialtyFilter('')
                setAvailableOnly(false)
              }}
              className="text-sm text-[#f7931a] hover:text-[#ff6b35] transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-400">Cargando formadores...</p>
          </div>
        ) : filteredEducators.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">No se encontraron formadores</h2>
            <p className="text-gray-400 mb-4">
              Intenta con otros filtros o terminos de busqueda
            </p>
            <button
              onClick={() => {
                setSearch('')
                setTypeFilter('all')
                setSpecialtyFilter('')
                setAvailableOnly(false)
              }}
              className="text-[#f7931a] hover:text-[#ff6b35] transition"
            >
              Ver todos los formadores
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEducators.map(educator => {
              const isMentor = educator.type === 'mentor'

              return (
                <Link
                  key={educator.id}
                  href={`/formadores/${educator.slug}`}
                  className={`group bg-white/5 border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    isMentor
                      ? 'border-amber-500/30 hover:border-amber-500/60 hover:shadow-amber-500/10'
                      : 'border-white/10 hover:border-blue-500/50 hover:shadow-blue-500/10'
                  }`}
                >
                  {/* Banner */}
                  <div className={`h-24 relative ${
                    isMentor
                      ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30'
                      : 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20'
                  }`}>
                    {educator.banner_url && (
                      <img
                        src={educator.banner_url}
                        alt=""
                        className="w-full h-full object-cover opacity-40"
                      />
                    )}

                    {/* Badge tipo */}
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isMentor
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
                        : 'bg-blue-500/90 text-white'
                    }`}>
                      {isMentor ? 'MENTOR' : 'INSTRUCTOR'}
                    </span>

                    {/* Disponibilidad */}
                    {educator.is_available && (
                      <span className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 text-emerald-400 text-[10px] px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        Disponible
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="relative px-5 -mt-10">
                    <div className={`w-20 h-20 rounded-xl border-4 overflow-hidden bg-gray-800 shadow-xl ${
                      isMentor ? 'border-amber-500/50' : 'border-[#070a10]'
                    }`}>
                      {educator.avatar_url || educator.user?.avatar_url ? (
                        <img
                          src={educator.avatar_url || educator.user?.avatar_url}
                          alt={educator.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
                          {educator.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5 pt-3 flex flex-col flex-1">
                    <h2 className={`text-lg font-bold transition-colors ${
                      isMentor
                        ? 'group-hover:text-amber-400'
                        : 'group-hover:text-blue-400'
                    }`}>
                      {educator.display_name}
                    </h2>

                    {educator.tagline && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {educator.tagline}
                      </p>
                    )}

                    {/* Especialidades */}
                    {educator.specialties && educator.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {educator.specialties.slice(0, 3).map((s: any) => (
                          <span
                            key={s.specialty?.id}
                            className="inline-flex items-center gap-1 bg-white/5 text-gray-300 text-[10px] px-2 py-1 rounded-full border border-white/5"
                          >
                            <span>{s.specialty?.icon}</span>
                            <span>{s.specialty?.name}</span>
                          </span>
                        ))}
                        {educator.specialties.length > 3 && (
                          <span className="text-[10px] text-gray-500 px-2 py-1">
                            +{educator.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        {educator.rating_avg > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-white font-medium">{Number(educator.rating_avg).toFixed(1)}</span>
                          </span>
                        )}
                        <span>{educator.total_sessions || 0} sesiones</span>
                      </div>
                      <div>
                        {educator.hourly_rate_credits > 0 ? (
                          <span className={isMentor ? 'text-amber-400' : 'text-blue-400'}>
                            {educator.hourly_rate_credits} cr/h
                          </span>
                        ) : (
                          <span className="text-emerald-400">Consultar</span>
                        )}
                      </div>
                    </div>

                    {/* Intro gratis */}
                    {educator.offers_free_intro && (
                      <div className="mt-3 text-center">
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                          {educator.free_intro_minutes || 10} min gratis
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA Final */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#ff6b35]/10 to-[#f7931a]/10 border border-[#f7931a]/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-3">¿Quieres ser formador?</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Comparte tus conocimientos con la comunidad Nodo360 y ayuda a otros a aprender sobre Bitcoin y Blockchain.
            </p>
            <Link
              href="/dashboard/ser-formador"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-[#f7931a]/20"
            >
              Aplicar como Instructor
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
