import { sendGAEvent } from '@next/third-parties/google'

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

/** Por dónde entró quien se registra. */
export type MetodoRegistro = 'email' | 'google' | 'github' | 'magic_link'

type Eventos = {
  /** Cuenta creada. Uno por registro, nunca dos para el mismo. */
  sign_up: { method: MetodoRegistro }
  /** Matrícula en un curso completada con éxito. */
  course_start: { course_slug: string; course_level: string }
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
}

export type NombreEvento = keyof Eventos

/**
 * Manda un evento a GA4.
 *
 * Solo en producción, igual que el script: `components/analytics/GoogleAnalytics.tsx`
 * devuelve null fuera de producción, así que `window.dataLayer` no existe y
 * `sendGAEvent` se quejaría por consola en cada clic durante el desarrollo. En
 * dev se registra lo que se habría enviado, que para depurar vale más.
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
    sendGAEvent('event', nombre, parametros)
  } catch (error) {
    console.error('❌ [GA4] No se pudo enviar el evento', nombre, error)
  }
}
