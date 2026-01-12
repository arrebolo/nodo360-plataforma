'use client'

import { useCallback } from 'react'

interface FiltersState {
  search: string
  status: string
  level: string
  instructor: string
}

interface CoursesFiltersProps {
  filters: FiltersState
  onFiltersChange: (filters: FiltersState) => void
  instructors?: Array<{ id: string; name: string }>
  totalResults?: number
}

export function CoursesFilters({
  filters,
  onFiltersChange,
  instructors = [],
  totalResults
}: CoursesFiltersProps) {

  const updateFilter = useCallback((key: keyof FiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }, [filters, onFiltersChange])

  const clearFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      status: '',
      level: '',
      instructor: ''
    })
  }, [onFiltersChange])

  const hasActiveFilters = filters.search || filters.status || filters.level || filters.instructor

  return (
    <div className="bg-dark-surface border border-white/10 rounded-2xl p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Busqueda */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Buscar por titulo o slug..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-brand-light/50 focus:ring-1 focus:ring-brand-light/50 transition"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => updateFilter('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filtro por estado */}
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-light/50 transition appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="" className="bg-dark-surface">Todos los estados</option>
          <option value="draft" className="bg-dark-surface">Borrador</option>
          <option value="published" className="bg-dark-surface">Publicado</option>
          <option value="archived" className="bg-dark-surface">Archivado</option>
        </select>

        {/* Filtro por nivel */}
        <select
          value={filters.level}
          onChange={(e) => updateFilter('level', e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-light/50 transition appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="" className="bg-dark-surface">Todos los niveles</option>
          <option value="beginner" className="bg-dark-surface">Principiante</option>
          <option value="intermediate" className="bg-dark-surface">Intermedio</option>
          <option value="advanced" className="bg-dark-surface">Avanzado</option>
        </select>

        {/* Filtro por instructor (solo si hay lista) */}
        {instructors.length > 0 && (
          <select
            value={filters.instructor}
            onChange={(e) => updateFilter('instructor', e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-light/50 transition appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="" className="bg-dark-surface">Todos los instructores</option>
            {instructors.map((inst) => (
              <option key={inst.id} value={inst.id} className="bg-dark-surface">
                {inst.name}
              </option>
            ))}
          </select>
        )}

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      {totalResults !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-sm text-white/50">
            {totalResults} curso{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <span className="text-xs text-brand-light">
              Filtros activos
            </span>
          )}
        </div>
      )}
    </div>
  )
}
