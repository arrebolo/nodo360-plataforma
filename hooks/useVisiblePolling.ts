'use client'

import { useEffect, useRef } from 'react'

/**
 * Sondeo que solo corre mientras la pestaña esta visible.
 *
 * Por que existe: las dos campanas de la cabecera sondeaban cada 30 s sin mirar
 * document.visibilityState, y la cabecera vive en el layout raiz. Una pestana
 * abierta y olvidada seguia pidiendo toda la noche: en un export de 26 minutos
 * salieron 146 llamadas a /api/notifications y 74 a /api/messages/unread.
 *
 * Comportamiento:
 * - Llama una vez al montar (si la pestana esta visible).
 * - Repite cada `intervalMs`, con un desfase aleatorio para que los clientes no
 *   caigan todos en el mismo segundo.
 * - Al ocultarse la pestana limpia el intervalo; al volver refresca de inmediato
 *   y lo rearma, asi el contador esta al dia en cuanto el usuario vuelve.
 */
export function useVisiblePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  jitterMs = 0
) {
  // Se guarda en una ref para que cambiar la identidad del callback entre
  // renders no reinicie el temporizador.
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    const run = () => {
      void callbackRef.current()
    }

    const stop = () => {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    }

    const start = () => {
      stop()
      const delay = intervalMs + Math.floor(Math.random() * (jitterMs + 1))
      timer = setInterval(run, delay)
    }

    const isVisible = () =>
      typeof document === 'undefined' || document.visibilityState === 'visible'

    const onVisibilityChange = () => {
      if (isVisible()) {
        run()
        start()
      } else {
        stop()
      }
    }

    if (isVisible()) {
      run()
      start()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stop()
    }
  }, [intervalMs, jitterMs])
}
