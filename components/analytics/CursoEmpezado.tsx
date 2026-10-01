'use client'

import { useEffect, useRef } from 'react'
import { enviarEvento } from '@/lib/analytics/eventos'

/**
 * Emite `course_start` cuando alguien se matricula SIN pasar por el boton.
 *
 * POR QUE HACE FALTA
 *   Hay tres caminos para matricularse y solo uno emitia el evento:
 *
 *     1. EnrollButton -> POST /api/enroll        emitia         (sigue igual)
 *     2. el enlace hrefEnroll -> GET /api/enroll NO emitia      <- cookie
 *     3. abrir el examen final, que matricula    NO emitia      <- prop `slug`
 *        automaticamente a quien no lo estaba
 *
 *   El 2 es el que usa la ficha del curso cuando la persona tiene acceso, o sea el
 *   camino normal de quien esta dentro. Por eso `course_start` no llegaba nunca a
 *   GA4 aunque estuviera dado de alta como evento clave.
 *
 * DOS ENTRADAS, Y NO ES CAPRICHO
 *   Una ruta de API puede poner una cookie en su respuesta, y eso sobrevive a los
 *   redirecciones que vengan despues —GET /api/enroll acaba en /api/continue, que
 *   redirige otra vez—. Un componente de servidor NO puede poner cookies, asi que la
 *   pantalla del examen pasa el slug como propiedad. Las dos acaban en el mismo
 *   evento.
 *
 * Montado en el layout raiz para la cookie, y con `slug` donde haga falta.
 */

const COOKIE = 'n360_curso_empezado'

function leerCookie(nombre: string): string | null {
  if (typeof document === 'undefined') return null
  for (const trozo of document.cookie.split(';')) {
    const [k, ...resto] = trozo.trim().split('=')
    if (k === nombre) return decodeURIComponent(resto.join('='))
  }
  return null
}

function borrarCookie(nombre: string) {
  document.cookie = `${nombre}=; Path=/; Max-Age=0; SameSite=Lax`
}

export default function CursoEmpezado({ slug }: { slug?: string }) {
  const yaEmitido = useRef(false)

  useEffect(() => {
    if (yaEmitido.current) return

    // El slug de la cookie viene del servidor; el de la propiedad, de la pantalla.
    const deLaCookie = leerCookie(COOKIE)
    const elSlug = slug ?? deLaCookie
    if (!elSlug) return

    yaEmitido.current = true

    // Solo el slug: el nivel del curso no viaja por aqui y no vale la pena
    // arrastrarlo por una cookie. En GA4 el nivel se puede cruzar por el slug.
    enviarEvento('course_start', { course_slug: elSlug })

    // Si no se borrara, cualquier recarga volveria a contar la misma matricula.
    if (deLaCookie) borrarCookie(COOKIE)
  }, [slug])

  return null
}
