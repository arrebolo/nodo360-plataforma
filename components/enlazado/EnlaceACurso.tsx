'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { enviarEvento } from '@/lib/analytics/eventos'

/**
 * El enlace a un curso desde el blog o el glosario, con su medición.
 *
 * Es de cliente solo por el evento de GA4: el bloque que lo rodea se sigue
 * renderizando en el servidor. Si la medición falla, el enlace funciona igual
 * -enviarEvento no lanza nunca-, que es el orden correcto de prioridades.
 *
 * El texto lo pone quien lo usa: aquí no se escribe ningún reclamo.
 */
export function EnlaceACurso({
  url,
  origen,
  slugOrigen,
  courseSlug,
  children,
  variante = 'boton',
}: {
  url: string
  origen: 'blog' | 'glosario'
  slugOrigen: string
  courseSlug: string
  children: React.ReactNode
  variante?: 'boton' | 'texto'
}) {
  const clases =
    variante === 'boton'
      ? 'inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40'
      : 'inline-flex items-center gap-1 text-brand-light hover:text-brand underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded'

  return (
    <Link
      href={url}
      className={clases}
      onClick={() =>
        enviarEvento('related_course_click', {
          origen,
          slug_origen: slugOrigen,
          course_slug: courseSlug,
        })
      }
    >
      {children}
      {variante === 'boton' && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
    </Link>
  )
}
