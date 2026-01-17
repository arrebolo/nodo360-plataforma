'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, Filter, SortDesc } from 'lucide-react'
import { useCallback, useState, useTransition } from 'react'

interface CourseFiltersProps {
  totalCourses: number
  filteredCount: number
}

export default function CourseFilters({ totalCourses, filteredCount }: CourseFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')

  // Crear URL con nuevos params
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  // Handler para cambios de filtro
  const handleFilterChange = (name: string, value: string) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString(name, value)}`)
    })
  }

  // Handler para busqueda con debounce
  const handleSearch = (value: string) => {
    setSearchValue(value)
    startTransition(() => {
      router.push(`${pathname}?${createQueryString('q', value)}`)
    })
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSearchValue('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters = searchParams.toString().length > 0

  return (
    <div className="space-y-4 mb-6">
      {/* Barra de busqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar por titulo o slug..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f7931a]/50 focus:border-transparent transition-all"
        />
        {isPending && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-white/20 border-t-[#f7931a] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Filter className="w-4 h-4" />
          Filtrar:
        </div>

        {/* Estado */}
        <select
          value={searchParams.get('status') || 'all'}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/50 cursor-pointer"
        >
          <option value="all">Estado: Todos</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
          <option value="archived">Archivados</option>
          <option value="coming_soon">Proximamente</option>
        </select>

        {/* Nivel */}
        <select
          value={searchParams.get('level') || 'all'}
          onChange={(e) => handleFilterChange('level', e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/50 cursor-pointer"
        >
          <option value="all">Nivel: Todos</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>

        {/* Tipo (Free/Premium) */}
        <select
          value={searchParams.get('type') || 'all'}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/50 cursor-pointer"
        >
          <option value="all">Tipo: Todos</option>
          <option value="free">Gratis</option>
          <option value="premium">Premium</option>
        </select>

        {/* Separador */}
        <div className="hidden sm:block w-px h-6 bg-white/10" />

        {/* Ordenar */}
        <div className="flex items-center gap-2 text-sm text-white/50">
          <SortDesc className="w-4 h-4" />
        </div>
        <select
          value={searchParams.get('sort') || 'recent'}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/50 cursor-pointer"
        >
          <option value="recent">Mas recientes</option>
          <option value="oldest">Mas antiguos</option>
          <option value="title">Titulo A-Z</option>
          <option value="title_desc">Titulo Z-A</option>
          <option value="students">Mas alumnos</option>
        </select>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-[#f7931a] hover:text-[#ff6b35] transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-white/50">
        {filteredCount === totalCourses ? (
          <span>Mostrando {totalCourses} cursos</span>
        ) : (
          <span>Mostrando {filteredCount} de {totalCourses} cursos</span>
        )}
      </div>
    </div>
  )
}
