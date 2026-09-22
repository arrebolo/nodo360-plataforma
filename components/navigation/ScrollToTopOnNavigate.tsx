'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Devuelve la vista al principio en cada cambio de ruta.
 *
 * POR QUE HACE FALTA
 * Al pasar de una leccion a la siguiente, la nueva cargaba pero la pagina se
 * quedaba a la altura del pie. Ninguna navegacion usa scroll={false} ni
 * { scroll: false }, y el contenido de la leccion no vive dentro de ningun
 * contenedor con overflow propio —los unicos overflow-y-auto son las barras
 * laterales—, asi que quien se desplaza es la ventana y Next deberia subirla
 * solo.
 *
 * Lo que lo rompe es la combinacion de dos cosas del propio proyecto:
 *   1. globals.css declara html { scroll-behavior: smooth }, para los enlaces
 *      de ancla.
 *   2. La ruta de leccion tiene loading.tsx, asi que entre la ruta vieja y la
 *      nueva se pinta un esqueleto mas corto.
 * El desplazamiento que hace Next se anima en lugar de ser instantaneo, y el
 * cambio de altura al sustituir el esqueleto por el contenido real la
 * interrumpe. Resultado: la vista se queda donde estaba.
 *
 * Este componente hace el salto de forma explicita e instantanea
 * (behavior: 'auto' ignora el CSS) en cuanto cambia el pathname. Cubre a la
 * vez el paso entre lecciones, el de la ultima leccion al quiz final y el del
 * quiz al certificado, que son todos cambios de ruta.
 *
 * NO actua en tres casos:
 *   - Cuando la URL trae un ancla (#seccion): ahi lo que se espera es saltar a
 *     la seccion, no al principio.
 *   - Cuando se llega con Atras o Adelante del navegador, para no pisar la
 *     posicion que el navegador restaura.
 *   - Cuando solo cambia la query string, porque usePathname no cambia con
 *     ella: asi se respeta el router.push(..., { scroll: false }) de
 *     LoadMoreButton.
 */
export function ScrollToTopOnNavigate() {
  const pathname = usePathname()
  const primero = useRef(true)
  const volviendoAtras = useRef(false)

  // Atras y adelante del navegador tienen que conservar la posicion guardada.
  // popstate se dispara antes de que React vuelva a pintar con el pathname
  // nuevo, asi que la marca ya esta puesta cuando corre el efecto de abajo.
  useEffect(() => {
    const marcar = () => {
      volviendoAtras.current = true
    }
    window.addEventListener('popstate', marcar)
    return () => window.removeEventListener('popstate', marcar)
  }, [])

  useEffect(() => {
    // En la primera carga manda el navegador: puede venir con ancla o con una
    // posicion restaurada.
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
