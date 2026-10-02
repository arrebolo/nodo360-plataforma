/**
 * El estado de un curso, dicho en castellano y en un solo sitio.
 *
 * POR QUE EXISTE
 *   Cada pantalla se lo inventaba. `components/admin/CoursesList` tenía tres estados de
 *   los siete que hay y mandaba el resto a «Borrador» con un `|| statusConfig.draft`;
 *   `CourseAdminCard` —la tarjeta que de verdad pinta /admin/cursos— enseñaba el valor
 *   crudo de la base (`pending_review`); la tarjeta del instructor tenía los siete pero
 *   con otros nombres; y el editor los resolvía con una cadena de ternarios. Así que un
 *   curso esperando revisión salía como borrador en un sitio, como `pending_review` en
 *   otro y como «En revisión» en el tercero.
 *
 * LAS DOS REGLAS QUE NO SON OBVIAS
 *
 *   1. UN ESTADO DESCONOCIDO SE DICE, NO SE DISFRAZA. Caer en «Borrador» por defecto es
 *      lo que escondió cuatro estados durante meses: una pantalla mentía y nadie podía
 *      notarlo. Si llega un estado que esto no conoce, se enseña tal cual y se marca.
 *
 *   2. `pending_review` CON `published_at` NO ES LO MISMO que sin ella. Con la fecha
 *      puesta, el curso se publicó alguna vez: su versión publicada sigue en el catálogo
 *      y lo que espera aprobación son los cambios. Sin la fecha, no hay nada publicado.
 *      Hoy `status` es una sola columna y no puede decir las dos cosas; `published_at`
 *      es lo que permite distinguirlas. Caso real: «Auditoría Ethereum», aprobado,
 *      modificado por su autor y reenviado, que en /admin/cursos seguía como si nada.
 */

export type ClaveDeEstado =
  | 'draft'
  | 'pending_review'
  | 'revision_de_publicado'
  | 'changes_requested'
  | 'rejected'
  | 'published'
  | 'coming_soon'
  | 'archived'
  | 'desconocido'

export type EstadoVisible = {
  clave: ClaveDeEstado
  etiqueta: string
  icono: string
  /** Clases de la pastilla, para que el color signifique lo mismo en todas las pantallas. */
  clases: string
  /** Hay una revisión esperando decisión de la administración. */
  esperaRevision: boolean
  /** La versión publicada sigue visible en el catálogo. */
  sigueVisible: boolean
}

type CursoParaElEstado = {
  status?: string | null
  published_at?: string | null
}

const AMBAR = 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
const NARANJA = 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
const VERDE = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
const ROJO = 'bg-red-500/20 text-red-300 border border-red-500/30'
const AZUL = 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
const GRIS = 'bg-white/10 text-white/60 border border-white/15'

/**
 * @param para  Quién lo lee. Solo cambia `pending_review`: a la administración le
 *              importa que espera SU decisión; a quien escribe el curso, que ya lo
 *              envió. Todo lo demás se llama igual para todos.
 */
export function estadoVisibleDelCurso(
  curso: CursoParaElEstado,
  { para = 'admin' }: { para?: 'admin' | 'autor' } = {}
): EstadoVisible {
  const status = curso.status ?? ''
  const sePublicoAlgunaVez = Boolean(curso.published_at)

  switch (status) {
    case 'draft':
      return { clave: 'draft', etiqueta: 'Borrador', icono: '📝', clases: AMBAR, esperaRevision: false, sigueVisible: false }

    case 'pending_review':
      return sePublicoAlgunaVez
        ? {
            clave: 'revision_de_publicado',
            etiqueta: 'Cambios pendientes de revisión',
            icono: '♻️',
            clases: NARANJA,
            esperaRevision: true,
            // Lo publicado sigue en pie: por eso esto no es «pendiente» a secas.
            sigueVisible: true,
          }
        : {
            clave: 'pending_review',
            etiqueta: para === 'autor' ? 'En revisión' : 'Pendiente de revisión',
            icono: '⏳',
            clases: NARANJA,
            esperaRevision: true,
            sigueVisible: false,
          }

    case 'changes_requested':
      return { clave: 'changes_requested', etiqueta: 'Cambios solicitados', icono: '✏️', clases: AMBAR, esperaRevision: false, sigueVisible: sePublicoAlgunaVez }

    case 'rejected':
      return { clave: 'rejected', etiqueta: 'Rechazado', icono: '⛔', clases: ROJO, esperaRevision: false, sigueVisible: false }

    case 'published':
      return { clave: 'published', etiqueta: 'Publicado', icono: '✅', clases: VERDE, esperaRevision: false, sigueVisible: true }

    case 'coming_soon':
      return { clave: 'coming_soon', etiqueta: 'Próximamente', icono: '🔜', clases: AZUL, esperaRevision: false, sigueVisible: false }

    case 'archived':
      return { clave: 'archived', etiqueta: 'Archivado', icono: '📦', clases: GRIS, esperaRevision: false, sigueVisible: false }

    default:
      // SE DICE. Un estado que no conocemos es una noticia, no un borrador.
      return {
        clave: 'desconocido',
        etiqueta: status ? `Estado sin traducir: ${status}` : 'Sin estado',
        icono: '❔',
        clases: ROJO,
        esperaRevision: false,
        sigueVisible: false,
      }
  }
}
