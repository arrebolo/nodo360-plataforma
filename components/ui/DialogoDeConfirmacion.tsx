'use client'

/**
 * La confirmación de algo que no se puede deshacer, DENTRO DE LA PÁGINA.
 *
 * POR QUÉ NO `confirm()`
 *   Borrar un módulo pedía confirmación con el `confirm()` del navegador, y en la
 *   re-auditoría del flujo de instructor «borrar un módulo no pide confirmación»: el
 *   diálogo nativo lo gobierna el navegador, no la página. Según quién mire, se
 *   descarta solo —los navegadores automatizados y las pestañas en segundo plano lo
 *   cierran sin preguntar—, bloquea el hilo entero mientras está abierto, no se puede
 *   leer con calma, no se puede estilar, y no deja rastro de haber existido. Lo mismo
 *   que ya le pasaba a `alert()` con los errores, que por eso están en pantalla.
 *
 *   Así que la confirmación es un elemento de la página: se ve en la captura, se lee,
 *   se puede cancelar con Escape o pulsando fuera, y dice exactamente qué se pierde.
 *
 * LO QUE NO HACE
 *   No pide escribir el nombre de lo que se borra. Lo que se borra aquí tiene vuelta
 *   —el progreso de los alumnos cuelga de la copia publicada desde la 117, y el curso
 *   se puede volver a escribir—, y una ceremonia de más en cada borrado acaba en que
 *   nadie lee lo que pone.
 */
import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  abierto: boolean
  titulo: string
  /** Qué pasa exactamente si se confirma. En frases, no en una sola línea. */
  children: React.ReactNode
  /** Lo que pone el botón que confirma: «Sí, borrar el módulo». */
  textoDeConfirmar: string
  onConfirmar: () => void
  onCancelar: () => void
  /** Mientras se está haciendo: los dos botones se bloquean y el de confirmar lo dice. */
  trabajando?: boolean
}

export function DialogoDeConfirmacion({
  abierto,
  titulo,
  children,
  textoDeConfirmar,
  onConfirmar,
  onCancelar,
  trabajando = false,
}: Props) {
  const cancelar = useRef<HTMLButtonElement>(null)

  // ESCAPE CANCELA, y el foco empieza en «Cancelar».
  //
  // Empieza ahí a propósito: si alguien llega al diálogo pulsando Intro y el foco
  // estuviera en el botón rojo, el segundo Intro borraría. El camino corto tiene que
  // ser el que no destruye nada.
  useEffect(() => {
    if (!abierto) return
    cancelar.current?.focus()
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !trabajando) onCancelar()
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierto, trabajando, onCancelar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      onClick={() => { if (!trabajando) onCancelar() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-de-la-confirmacion"
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12121a] p-5 shadow-2xl"
        // El clic dentro no cuenta como clic fuera.
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="titulo-de-la-confirmacion" className="font-semibold text-white">
              {titulo}
            </h2>
            <div className="mt-2 space-y-2 text-sm text-white/70">{children}</div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            ref={cancelar}
            type="button"
            onClick={onCancelar}
            disabled={trabajando}
            className="rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={trabajando}
            className="rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {trabajando ? 'Un momento…' : textoDeConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DialogoDeConfirmacion
