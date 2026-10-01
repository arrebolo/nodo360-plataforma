/**
 * Los eventos de conversión de Nodo360, y el único sitio por el que salen.
 *
 * Antes había dos sistemas a medias y ninguno funcionando: el script de GA4 en
 * app/layout.tsx, que solo recogía page_view, y un `trackEvent()` en
 * lib/utils/progress.ts cuyo envío a gtag estaba comentado desde siempre. Sus
 * cuatro llamadas escribían en la consola y disparaban un CustomEvent que nadie
 * escuchaba. Es decir: del embudo no se medía nada.
 *
 * PRIVACIDAD (Principio #8). Los parámetros de cada evento están declarados uno
 * a uno en el tipo `Eventos` y `enviarEvento` no acepta otros. Eso no es
 * cosmética: es lo que impide que un día alguien meta un email, un nombre o un
 * user id en un evento «solo para depurar». GA4 prohíbe los datos personales en
 * sus términos, pero la garantía no puede ser la buena memoria de quien edita.
 * Aquí solo viajan slugs, números y métodos.
 */

/**
 * Por dónde entró quien se registra.
 *
 * Sin 'github': ese proveedor no está habilitado en Supabase, así que el valor
 * no podía llegar nunca y solo habría servido para dejar una dimensión vacía en
 * los informes de GA4.
 */
export type MetodoRegistro = 'email' | 'google' | 'magic_link'

type Eventos = {
  /** Cuenta creada. Uno por registro, nunca dos para el mismo. */
  sign_up: { method: MetodoRegistro }
  /**
   * La direccion queda confirmada y la cuenta pasa a ser real.
   *
   * `sign_up` se emite al enviar el formulario, o sea ANTES de confirmar: cuenta
   * intentos, incluidas las direcciones mal escritas que nunca se confirman. Este
   * evento es el que cuenta registros de verdad, y por eso es el que conviene
   * marcar como evento clave en GA4 en lugar de sign_up.
   *
   * Con Google no hay paso intermedio —la direccion llega verificada del
   * proveedor—, asi que ahi los dos eventos ocurren casi a la vez. La diferencia
   * se ve en el registro con contraseña.
   */
  email_confirmed: { method: MetodoRegistro }
  /**
   * Matrícula en un curso completada con éxito.
   *
   * `course_level` es opcional: hay dos caminos que matriculan sin pasar por el
   * botón —el enlace de la ficha y abrir el examen final— y por ahí solo viaja el
   * slug. Arrastrar el nivel por una cookie no compensa: en GA4 se cruza por el
   * slug. Antes era obligatorio y esos dos caminos no emitían nada.
   */
  course_start: { course_slug: string; course_level?: string }
  /** Lección marcada como completada. `lesson_number` es su posición en el curso, desde 1. */
  lesson_complete: { course_slug: string; lesson_number: number }
  /** La primerísima lección que completa esta persona en toda la plataforma. */
  first_lesson_complete: { course_slug: string }
  /** Curso terminado: certificado emitido. */
  course_complete: { course_slug: string }
  /** Examen final aprobado. */
  exam_passed: { course_slug: string }
  /** Examen final suspendido. Los intentos son ilimitados, así que puede repetirse. */
  exam_failed: { course_slug: string }
  /**
   * Clic en un enlace a un curso desde el blog o el glosario.
   *
   * `origen` dice desde qué sección se pulsó y `slug_origen` desde qué artículo
   * o término concreto. Con los dos se puede saber qué contenido trae gente a
   * los cursos y qué contenido no trae a nadie, que es la pregunta que hoy no
   * se puede contestar.
   *
   * Solo slugs: ni identificadores de persona, ni sesión, ni nada que permita
   * reconocer a nadie.
   */
  related_course_click: {
    origen: 'blog' | 'glosario'
    slug_origen: string
    course_slug: string
  }
}

export type NombreEvento = keyof Eventos

/**
 * Manda un evento a GA4.
 *
 * SE EMPUJA A dataLayer AQUI, Y NO CON sendGAEvent, Y ES EL ARREGLO DE UN FALLO.
 * Esto es lo que hace `sendGAEvent` de @next/third-parties, leido del paquete
 * instalado:
 *
 *     if (currDataLayerName === undefined) {
 *       console.warn('@next/third-parties: GA has not been initialized')
 *       return                                      // <- el evento se pierde
 *     }
 *     if (window[currDataLayerName]) { ...push... }
 *     else { console.warn('... dataLayer does not exist') }   // <- tambien
 *
 * `currDataLayerName` lo pone el componente <GoogleAnalytics> al renderizarse. Un
 * evento emitido ANTES de eso se tira con un aviso por consola y nada mas. Y eso es
 * exactamente lo que le pasaba a `email_confirmed`: se emite en un useEffect del
 * layout raiz justo despues de la redireccion del callback, el momento mas temprano
 * posible. En 28 dias no llego ni uno a GA4.
 *
 * Empujando a `window.dataLayer` nosotros, el orden deja de importar: gtag.js procesa
 * la cola cuando carga, asi que un evento encolado antes llega igual. Es el patron
 * estandar de gtag —`dataLayer.push(['event', nombre, parametros])`—, el mismo que
 * usa sendGAEvent, solo que sin rendirse si el script aun no esta.
 *
 * Solo en producción: `GoogleAnalyticsTag` devuelve null fuera de producción, asi
 * que aqui se registra lo que se habria enviado, que para depurar vale mas.
 *
 * No lanza nunca: perder una métrica no puede tumbar la acción que la genera.
 */
export function enviarEvento<N extends NombreEvento>(
  nombre: N,
  parametros: Eventos[N]
): void {
  if (typeof window === 'undefined') return

  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 [GA4] (fuera de producción no se envía)', nombre, parametros)
    return
  }

  try {
    const w = window as unknown as { dataLayer?: unknown[] }
    if (!w.dataLayer) w.dataLayer = []
    w.dataLayer.push(['event', nombre, parametros])
  } catch (error) {
    console.error('❌ [GA4] No se pudo enviar el evento', nombre, error)
  }
}
