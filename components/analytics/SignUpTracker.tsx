'use client'

import { useEffect, useRef } from 'react'
import { enviarEvento, type MetodoRegistro } from '@/lib/analytics/eventos'

const METODOS: MetodoRegistro[] = ['email', 'google', 'magic_link']

/**
 * Emite `sign_up` cuando alguien vuelve de un registro por OAuth o enlace
 * mágico, y limpia el parámetro de la URL.
 *
 * El registro con contraseña se emite en el propio formulario, que sabe lo que
 * ha pasado. Con OAuth no: el navegador se va a Google, vuelve a
 * /auth/callback —código de servidor, donde no hay dataLayer— y de ahí a
 * cualquier destino. La única forma de que el cliente se entere es que el
 * servidor se lo diga, y lo hace añadiendo `?signup=<proveedor>` a la
 * redirección.
 *
 * Va montado en el layout raíz, no en /dashboard, porque el callback redirige a
 * `redirectTo || next`: quien pulsa «Continuar con Google» desde una lección
 * vuelve a la lección, no al panel. En el layout funciona sea cual sea el
 * destino.
 *
 * Lee `window.location.search` en vez de `useSearchParams()` a propósito: ese
 * hook obligaría a envolver el layout en un Suspense y forzaría render dinámico
 * en todas las páginas. Aquí no hace falta: el parámetro solo se mira una vez,
 * al montar.
 */
export default function SignUpTracker() {
  const yaEmitido = useRef(false)

  useEffect(() => {
    if (yaEmitido.current) return

    const params = new URLSearchParams(window.location.search)
    const metodo = params.get('signup')
    if (!metodo) return

    yaEmitido.current = true

    // Viene de la URL, así que es texto de fuera: solo se acepta si es uno de
    // los cuatro métodos. Un `?signup=<script>` no llega a GA4.
    if ((METODOS as string[]).includes(metodo)) {
      enviarEvento('sign_up', { method: metodo as MetodoRegistro })
    } else {
      console.warn('⚠️ [SignUpTracker] Método de registro no reconocido:', metodo)
    }

    // Fuera de la URL, sin recargar y sin añadir una entrada al historial: si
    // el parámetro se queda, cualquier recarga o enlace compartido volvería a
    // contar el mismo registro.
    params.delete('signup')
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (query ? `?${query}` : '') + window.location.hash
    )
  }, [])

  return null
}
