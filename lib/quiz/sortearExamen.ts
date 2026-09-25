/**
 * Sorteo del examen final: un subconjunto de las preguntas del curso, repartido
 * por igual entre los modulos.
 *
 * POR QUE EXISTE
 *   El examen servia las 27 preguntas del curso, siempre las mismas, y al
 *   suspender devolvia el veredicto pregunta por pregunta con reintentos
 *   ilimitados. Con eso el examen no filtra: se ve cual se ha fallado, se
 *   cambia solo esa y se repite hasta el 100% sin haber leido nada.
 *
 *   Sortear un subconjunto rompe ese bucle: memorizar los veredictos de un
 *   intento sirve de poco en el siguiente, porque la mayoria de las preguntas
 *   son otras.
 *
 * POR QUE 4 POR MODULO Y 12 EN TOTAL
 *   - Divisible entre 3, asi que el reparto por modulo es exacto y no rotatorio.
 *   - Con el umbral en 70%, aprobar son 9 de 12: 8 de 12 es 66,7% y se redondea
 *     a 67, que suspende. El listón efectivo queda en el 75%, algo por encima
 *     del 70% nominal. Es una consecuencia de trabajar con enteros, no un
 *     descuido: con 27 preguntas el umbral efectivo era 70,4%.
 *   - El solapamiento esperado entre dos intentos seguidos es n²/27: con 12 son
 *     5,3 preguntas repetidas de 12 (44%). Con 21 serian 16 de 21 (78%) y el
 *     sorteo no serviria de nada; con 9 bajaria al 33%, pero aprobar serian 7
 *     de 9 (78% efectivo), que ya es otro examen.
 *   - Y 12 preguntas es una duracion razonable para un examen final. 27 no lo
 *     era.
 *
 * LO QUE ESTO NO ES
 *   No es a prueba de todo, y conviene no pretenderlo. Al suspender se muestra
 *   la explicacion de lo que se ha fallado -eso es lo que enseña, y es
 *   deliberado-, asi que quien insista varios intentos acaba conociendo el
 *   banco. La diferencia es que para entonces ha leido las explicaciones de
 *   veinte preguntas, que es justamente aprender. Lo que se cierra es el bucle
 *   mecanico de cambiar la respuesta marcada en rojo.
 */

export const PREGUNTAS_POR_MODULO = 4
export const MODULOS_ESPERADOS = 3
export const PREGUNTAS_POR_EXAMEN = PREGUNTAS_POR_MODULO * MODULOS_ESPERADOS

/** Segundos que hay que esperar entre dos intentos del mismo curso. */
export const ESPERA_ENTRE_INTENTOS_SEGUNDOS = 60

interface ConModulo {
  id: string
  module_id: string
}

/** Fisher-Yates sobre una copia. */
function revuelto<T>(xs: readonly T[]): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Sortea el examen. `ordenModulos` fija el orden de los modulos del curso, para
 * que el reparto sea estable aunque las preguntas lleguen desordenadas.
 *
 * Si algun modulo tiene menos de PREGUNTAS_POR_MODULO, se coge lo que haya y se
 * compensa con las sobrantes de los demas, de modo que el total se mantenga
 * mientras el curso tenga preguntas suficientes. Un curso de 2 modulos -hay
 * tres en el catalogo- da 8 preguntas, no 12: el reparto por modulo manda sobre
 * el total.
 */
export function sortearExamen<T extends ConModulo>(
  preguntas: readonly T[],
  ordenModulos: readonly string[]
): T[] {
  const porModulo = new Map<string, T[]>()
  for (const m of ordenModulos) porModulo.set(m, [])
  for (const p of preguntas) porModulo.get(p.module_id)?.push(p)

  const elegidas: T[] = []
  const sobrantes: T[] = []

  for (const m of ordenModulos) {
    const revueltas = revuelto(porModulo.get(m) ?? [])
    elegidas.push(...revueltas.slice(0, PREGUNTAS_POR_MODULO))
    sobrantes.push(...revueltas.slice(PREGUNTAS_POR_MODULO))
  }

  // Solo se compensa si un modulo venia corto. Con 9 por modulo no pasa nunca.
  const objetivo = Math.min(PREGUNTAS_POR_MODULO * ordenModulos.length, preguntas.length)
  if (elegidas.length < objetivo) {
    elegidas.push(...revuelto(sobrantes).slice(0, objetivo - elegidas.length))
  }

  // Se revuelve el conjunto para que no salga en tres bloques por modulo.
  return revuelto(elegidas)
}

/**
 * Comprueba que un conjunto de preguntas entregado por el cliente es un examen
 * legitimo: el numero que toca y el reparto por modulo que toca.
 *
 * El servidor corrige solo lo que se le manda, asi que sin esto se podria
 * enviar una seleccion a medida. No impide reenviar un examen ya visto -para eso
 * esta el sorteo y la espera-, pero si impide inventarse uno.
 */
export function esExamenLegitimo(
  preguntas: readonly ConModulo[],
  ordenModulos: readonly string[],
  totalPorModulo: ReadonlyMap<string, number>
): { ok: true } | { ok: false; motivo: string } {
  const ids = new Set(preguntas.map((p) => p.id))
  if (ids.size !== preguntas.length) {
    return { ok: false, motivo: 'hay preguntas repetidas' }
  }

  const esperadoPorModulo = new Map<string, number>()
  let esperadoTotal = 0
  for (const m of ordenModulos) {
    const n = Math.min(PREGUNTAS_POR_MODULO, totalPorModulo.get(m) ?? 0)
    esperadoPorModulo.set(m, n)
    esperadoTotal += n
  }

  if (preguntas.length !== esperadoTotal) {
    return { ok: false, motivo: `el examen son ${esperadoTotal} preguntas y han llegado ${preguntas.length}` }
  }

  for (const m of ordenModulos) {
    const hay = preguntas.filter((p) => p.module_id === m).length
    const toca = esperadoPorModulo.get(m) ?? 0
    if (hay !== toca) {
      return { ok: false, motivo: `el reparto por modulo no cuadra: uno tiene ${hay} y le tocan ${toca}` }
    }
  }

  return { ok: true }
}
