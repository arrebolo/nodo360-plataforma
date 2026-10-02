import { createAdminClient } from '@/lib/supabase/admin'

/**
 * ¿Hay que mandar a esta persona a /cuenta-suspendida?
 *
 * UN SOLO SITIO PARA LA POLITICA, porque lo comprueban dos: el middleware, que ahorra
 * el viaje, y el layout de las páginas privadas, que es el que de verdad no se puede
 * saltar. Si la regla viviera en los dos, se desfasaría en uno.
 *
 * DE DONDE SALE EL DATO
 *   De `estoy_suspendido()` (migración 118), SECURITY DEFINER, que contesta por
 *   `auth.uid()`. Antes se leía `users.is_suspended` directamente con la sesión de la
 *   propia persona, y esa columna está cerrada a `authenticated`: la consulta moría con
 *   42501, la fila llegaba vacía, `undefined` se leía como «no suspendida» y la puerta
 *   NO SE CERRABA NUNCA. Medido.
 *
 * LA EXCEPCION DE LOS ADMINS vive aquí y no en la función: una función que contestara
 * «no suspendido» de un admin suspendido estaría mintiendo. La función dice el hecho y
 * esto aplica la política. `users.role` sí es legible por cada persona.
 *
 * SI NO SE PUEDE AVERIGUAR, NO SE DECIDE NADA A PARTIR DE ESTO: `sePudoComprobar` sale
 * en false y quien pregunta deja pasar y lo registra. Tratar un fallo de lectura como
 * «no suspendida» es justo el fallo que había; tratarlo como «suspendida» echaría a
 * todo el mundo por un hipo de la base.
 */
export type Suspension = {
  /** Hay que desviar: está suspendida y no es admin. */
  desviar: boolean
  motivo: string | null
  sePudoComprobar: boolean
}

/** Lo mínimo que hace falta de un cliente de Supabase, sea el del middleware o el del servidor. */
type ClienteQuePregunta = {
  rpc: (
    nombre: string,
    argumentos?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { code?: string; message: string } | null }>
  from: (tabla: string) => {
    select: (columnas: string) => {
      eq: (columna: string, valor: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: { code?: string; message: string } | null }>
      }
    }
  }
}

/** La 118 todavía no está aplicada: PostgREST no encuentra la función. */
function faltaLaFuncion(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    /could not find the function|does not exist/i.test(error.message ?? '')
  )
}

export async function comprobarSuspension(
  cliente: unknown,
  userId: string
): Promise<Suspension> {
  const c = cliente as ClienteQuePregunta

  // NI .catch() NI .finally() sobre una consulta de Supabase: lo que devuelven es un
  // «thenable» —tiene then, y nada más—, así que `.catch` es undefined y llamarlo
  // explota con un TypeError. Medido: 500 en todas las páginas privadas. Se envuelve en
  // try/catch, que es lo que funciona con un await.
  type Respuesta = { data: unknown; error: { code?: string; message: string } | null }
  const comoFallo = (e: unknown): Respuesta => ({
    data: null,
    error: { code: undefined, message: e instanceof Error ? e.message : String(e) },
  })

  let rol: string | null = null
  try {
    const r = await c.from('users').select('role').eq('id', userId).maybeSingle()
    rol = (r.data as { role?: string } | null)?.role ?? null
  } catch (e) {
    console.error('[suspension] no se pudo leer el rol:', e)
  }

  let suspendida: boolean | null = null
  let motivo: string | null = null

  let porLaFuncion: Respuesta
  try {
    porLaFuncion = await c.rpc('estoy_suspendido')
  } catch (e) {
    porLaFuncion = comoFallo(e)
  }

  if (!porLaFuncion.error) {
    suspendida = porLaFuncion.data === true
    if (suspendida) {
      try {
        const elMotivo = await c.rpc('motivo_de_mi_suspension')
        motivo = typeof elMotivo.data === 'string' ? elMotivo.data : null
      } catch (e) {
        console.error('[suspension] no se pudo leer el motivo:', e)
      }
    }
  } else if (faltaLaFuncion(porLaFuncion.error)) {
    // MIENTRAS LA 118 NO ESTE APLICADA, se lee con el cliente de servicio, que es lo
    // que hacía la versión anterior. Así da igual el orden entre el merge y la
    // migración: ni se abre la puerta ni se cierra de más.
    console.warn('[suspension] estoy_suspendido() no existe todavía (¿falta la 118?): se lee con el cliente de servicio')
    const { data, error } = await createAdminClient()
      .from('users')
      .select('is_suspended, suspended_reason')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[suspension] y el cliente de servicio tampoco:', error.code, error.message)
      return { desviar: false, motivo: null, sePudoComprobar: false }
    }
    const fila = data as { is_suspended?: boolean | null; suspended_reason?: string | null } | null
    suspendida = Boolean(fila?.is_suspended)
    motivo = fila?.suspended_reason ?? null
  } else {
    console.error('[suspension] no se pudo comprobar:', porLaFuncion.error.code, porLaFuncion.error.message)
    return { desviar: false, motivo: null, sePudoComprobar: false }
  }

  return {
    desviar: Boolean(suspendida) && rol !== 'admin',
    motivo,
    sePudoComprobar: true,
  }
}

/** La URL absoluta a la que se desvía, para el middleware. */
export function urlDeCuentaSuspendida(base: string | URL, motivo: string | null): URL {
  const url = new URL('/cuenta-suspendida', base)
  if (motivo) url.searchParams.set('reason', motivo)
  return url
}

/** La misma, relativa, para `redirect()` de un layout o una página. */
export function rutaDeCuentaSuspendida(motivo: string | null): string {
  return motivo
    ? `/cuenta-suspendida?reason=${encodeURIComponent(motivo)}`
    : '/cuenta-suspendida'
}
