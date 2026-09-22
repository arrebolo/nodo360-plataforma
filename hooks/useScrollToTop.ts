'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Lleva la vista al principio cuando cambia `clave`.
 *
 * Para cambios que NO son de navegacion: el quiz final, por ejemplo, pasa de
 * pregunta con estado (currentIndex), sin cambiar de ruta, asi que el
 * manejador global de ScrollToTopOnNavigate no se entera.
 *
 * `behavior: 'auto'` es deliberado. globals.css declara
 * html { scroll-behavior: smooth }, pensado para los enlaces de ancla. Con
 * desplazamiento suave, este salto se animaria y cualquier reajuste de altura
 * durante la animacion la interrumpe a medio camino. Pasando 'auto' de forma
 * explicita se ignora el CSS solo para este salto.
 *
 * Si se pasa `contenedor`, se desplaza ese elemento en lugar de la ventana:
 * sirve para un panel con overflow-y propio.
 */
export function useScrollToTop(
  clave: unknown,
  contenedor?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const ir = () => {
      const el = contenedor?.current
      if (el) {
        el.scrollTo({ top: 0, behavior: 'auto' })
        return
      }
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    ir()
    // Segundo intento en el siguiente fotograma: si el contenido definitivo
    // sustituye al esqueleto de loading.tsx despues de este efecto, el
    // documento crece y el navegador puede restaurar la posicion anterior.
    const id = requestAnimationFrame(ir)
    return () => cancelAnimationFrame(id)
  }, [clave, contenedor])
}
