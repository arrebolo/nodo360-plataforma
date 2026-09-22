'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Devuelve la vista al principio en cada cambio de ruta.
 *
 * POR QUE HACE FALTA
 * Al pasar de una lección a la siguiente, la nueva cargaba pero la página se
 * quedaba a la altura del pie. Ninguna navegacion usa scroll={false} ni
 * { scroll: false }, y el contenido de la lección no vive dentro de ningún
 * contenedor con overflow propio —los únicos overflow-y-auto son las barras
 * laterales—, así que quien se desplaza es la ventana y Next deberia subirla
 * solo.
 *
 * Lo que lo rompe es la combinacion de dos cosas del propio proyecto:
 *   1. globals.css declara html { scroll-behavior: smooth }, para los enlaces
 *      de ancla.
 *   2. La ruta de lección tiene loading.tsx, así que entre la ruta vieja y la
 *      nueva se pinta un esqueleto más corto.
 * El desplazamiento que hace Next se anima en lugar de ser instantaneo, y el
 * cambio de altura al sustituir el esqueleto por el contenido real la
 * interrumpe. Resultado: la vista se queda donde estaba.
 *
 * Este componente hace el salto de forma explicita e instantanea
 * (behavior: 'auto' ignora el CSS) en cuanto cambia el pathname. Cubre a la
 * vez el paso entre lecciones, el de la última lección al quiz final y el del
 * quiz al certificado, que son todos cambios de ruta.
 *
 * NO actua en tres casos:
 *   - Cuando la URL trae un ancla (#sección): ahi lo que se espera es saltar a
 *     la sección, no al principio.
 *   - Cuando se llega con Atras o Adelante del navegador, para no pisar la
 *     posición que el navegador restaura.
 *   - Cuando solo cambia la query string, porque usePathname no cambia con
 *     ella: así se respeta el router.push(..., { scroll: false }) de
 *     LoadMoreButton.
 */
export function ScrollToTopOnNavigate() {
  const pathname = usePathname()
  const primero = useRef(true)
  const volviendoAtras = useRef(false)

  // Atras y adelante del navegador tienen que conservar la posición guardada.
  // popstate se dispara antes de que React vuelva a pintar con el pathname
  // nuevo, así que la marca ya esta puesta cuando corre el efecto de abajo.
  useEffect(() => {
    const marcar = () => {
      volviendoAtras.current = true
    }
    window.addEventListener('popstate', marcar)
    return () => window.removeEventListener('popstate', marcar)
  }, [])

  useEffect(() => {
    // En la primera carga manda el navegador: puede venir con ancla o con una
    // posición restaurada.
    if (primero.current) {
      primero.current = false
      return
    }

    if (volviendoAtras.current) {
      volviendoAtras.current = false
      return
    }

    if (window.location.hash) return

    const ir = () => window.scrollTo({ top: 0, behavior: 'auto' })
    ir()
    const id = requestAnimationFrame(ir)
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return null
}

export default ScrollToTopOnNavigate
