'use client'

import { useState, useEffect, useRef } from 'react'
import { Route, Check, Loader2, ChevronDown, X } from 'lucide-react'

interface LearningPath {
  id: string
  name: string
  slug: string
  emoji: string | null
  is_active: boolean
}

interface LearningPathDropdownProps {
  selectedPathIds: string[]
  onChange: (pathIds: string[]) => void
  disabled?: boolean
  /**
   * A quién preguntarle las rutas: '/api/instructor' desde la zona del instructor,
   * '/api/admin' desde el panel. El mismo convenio que `DeleteModuleButton`.
   *
   * Está aquí porque este componente lo usa `CourseFormCore`, y `CourseFormCore` lo
   * usan LAS DOS zonas: /admin/cursos/nuevo y /dashboard/instructor/cursos/nuevo.
   * Mientras la URL estuvo escrita dentro, crear un curso como instructor llamaba a
   * `/api/admin/learning-paths` —el único incumplimiento que quedaba de la regla—, y
   * «funcionaba» solo porque ese GET no comprobaba el rol. Al cerrarlo, el formulario
   * del instructor se habría quedado sin rutas: los dos cambios van juntos.
   *
   * Y no es solo el nombre: la ruta del instructor devuelve SOLO LAS ACTIVAS, así que
   * deja de ofrecer una ruta apagada en la que meter el curso no lo mete en ninguna
   * parte.
   */
  /**
   * SIN VALOR POR OMISION, a proposito: cada pantalla dice su zona y si alguien la
   * olvida no compila. Con `api = '/api/admin'` por defecto, olvidarse en una pantalla
   * de instructor no daba ni un aviso —llamaba al panel y, mientras ese endpoint dejara
   * pasar, «funcionaba»—. Eso es exactamente como llego aqui el unico incumplimiento
   * que quedaba de la regla.
   */
  api: string
}

export function LearningPathDropdown({
  selectedPathIds,
  onChange,
  disabled = false,
  api,
}: LearningPathDropdownProps) {
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cargar rutas disponibles
  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const res = await fetch(`${api}/learning-paths`)
        if (res.ok) {
          const data = await res.json()
          setPaths(data.paths || [])
        }
      } catch (error) {
        console.error('Error cargando rutas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPaths()
    // `api` entra en la lista: si no, cambiar de zona no volveria a pedirlas.
  }, [api])

  const handleToggle = (pathId: string) => {
    const isSelected = selectedPathIds.includes(pathId)
    if (isSelected) {
      onChange(selectedPathIds.filter(id => id !== pathId))
    } else {
      onChange([...selectedPathIds, pathId])
    }
  }

  const selectedPaths = paths.filter(p => selectedPathIds.includes(p.id))

  return (
    <div className="space-y-2 mb-6" ref={dropdownRef}>
      <label className="block text-sm font-medium text-white/80">
        <span className="flex items-center gap-2">
          <Route className="w-4 h-4 text-brand-light" />
          Ruta de Aprendizaje
          <span className="text-white/40 font-normal">(opcional)</span>
        </span>
      </label>

      <div className="relative">
        {/* Trigger Button */}
        {/* `aria-label` NO ES ADORNO: el botón se llama «Seleccionar rutas…» y la
            etiqueta de al lado, «Ruta de Aprendizaje» —en singular—, así que no había
            forma de nombrarlo ni desde una prueba ni desde un lector de pantalla. Un
            desplegable que no se puede nombrar no se puede comprobar. */}
        <button
          type="button"
          aria-label="Rutas de aprendizaje"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className={`w-full flex items-center justify-between gap-2 px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-left transition ${
            disabled || loading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-white/20 focus:border-brand-light/50 focus:outline-none focus:ring-1 focus:ring-brand-light/30'
          }`}
        >
          <span className={selectedPaths.length > 0 ? 'text-white' : 'text-white/40'}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando rutas...
              </span>
            ) : selectedPaths.length > 0 ? (
              selectedPaths.length === 1
                ? `${selectedPaths[0].emoji || ''} ${selectedPaths[0].name}`.trim()
                : `${selectedPaths.length} rutas seleccionadas`
            ) : (
              'Seleccionar rutas...'
            )}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-white/40 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && !loading && (
          <div
            role="listbox"
            aria-label="Rutas de aprendizaje disponibles"
            className="absolute z-50 w-full mt-2 py-2 bg-[#161b22] border border-white/10 rounded-xl shadow-xl max-h-64 overflow-auto"
          >
            {paths.length === 0 ? (
              <div className="px-4 py-3 text-white/50 text-sm text-center">
                No hay rutas de aprendizaje disponibles
              </div>
            ) : (
              paths.map(path => {
                const isSelected = selectedPathIds.includes(path.id)
                return (
                  <button
                    key={path.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleToggle(path.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                      isSelected
                        ? 'bg-brand-light/10 text-white'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    {/* Checkbox visual */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                        isSelected
                          ? 'bg-brand-light border-brand-light'
                          : 'border-white/30 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Path info */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {path.emoji && <span className="text-base">{path.emoji}</span>}
                      <span className="truncate">{path.name}</span>
                      {!path.is_active && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/40">
                          Inactiva
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Tags de rutas seleccionadas */}
      {selectedPaths.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedPaths.map(path => (
            <span
              key={path.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-light/10 text-brand-light text-sm rounded-lg"
            >
              {path.emoji && <span>{path.emoji}</span>}
              {path.name}
              <button
                type="button"
                onClick={() => handleToggle(path.id)}
                className="hover:text-white transition ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-white/40">
        Asigna este curso a rutas de aprendizaje para facilitar su descubrimiento.
      </p>
    </div>
  )
}

export default LearningPathDropdown
