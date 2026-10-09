/**
 * La única puerta por la que las páginas leen tutoriales.
 *
 * Hoy los tutoriales son archivos del repositorio. Si algún día pasan a la base
 * (docs/TUTORIALES.md y la propuesta de diseño), cambia este archivo y las
 * páginas no se enteran.
 *
 * Los borradores solo se ven en desarrollo y en las previsualizaciones de
 * Vercel (VERCEL_ENV=preview), para revisarlos en la PR. En producción no
 * existen: ni página, ni índice.
 */
import { cargarTutoriales } from './cargar'
import { NIVELES, type Tutorial } from './tipos'

export function seVenLosBorradores(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.VERCEL_ENV === 'preview' ||
    process.env.TUTORIALES_BORRADORES === '1'
  )
}

let cache: Tutorial[] | null = null

function todos(): Tutorial[] {
  if (cache && process.env.NODE_ENV !== 'development') return cache
  const { tutoriales, errores } = cargarTutoriales()
  if (errores.length) {
    // Para el build. El prebuild (scripts/validar-tutoriales.mts) ya lo habría
    // parado antes, con el mismo mensaje.
    throw new Error(`Tutoriales con errores:\n  - ${errores.join('\n  - ')}`)
  }
  const orden = Object.keys(NIVELES)
  cache = tutoriales.sort(
    (a, b) =>
      orden.indexOf(a.nivel) - orden.indexOf(b.nivel) ||
      a.duracionMinutos - b.duracionMinutos ||
      a.titulo.localeCompare(b.titulo, 'es')
  )
  return cache
}

/** Los que se pueden ver en este despliegue, de lo más básico a lo más avanzado. */
export function listarTutoriales(): Tutorial[] {
  const borradores = seVenLosBorradores()
  return todos().filter((t) => borradores || t.estado !== 'borrador')
}

export function obtenerTutorial(slug: string): Tutorial | null {
  return listarTutoriales().find((t) => t.slug === slug) ?? null
}
