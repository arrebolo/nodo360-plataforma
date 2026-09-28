import { GraduationCap } from 'lucide-react'
import { destinoDelCurso } from '@/lib/enlazado/enlace'
import { EnlaceACurso } from './EnlaceACurso'
import type { GlossaryTerm } from '@/lib/glossary-data'

/**
 * El curso donde se explica un término del glosario.
 *
 * DOS TÍTULOS, Y LA DIFERENCIA IMPORTA
 *   · «Dónde se explica en profundidad» cuando hay una lección concreta que lo
 *     explica. Es una afirmación comprobable: la lección existe y trata eso.
 *   · «Relacionado con este curso» cuando no la hay. Son 11 términos -siete de
 *     DeFi, los tres forks y el metaverso- para los que ninguna lección del
 *     catálogo entra en el tema. Decir «se explica en» de esos sería mandar a
 *     alguien a buscar algo que no va a encontrar.
 *
 *   El mismo criterio que en el bloque de los artículos: la palabra tiene que
 *   aguantar que alguien la compruebe.
 */
export function BloqueCursoDelTermino({ term }: { term: GlossaryTerm }) {
  const destino = destinoDelCurso(term.relatedCourse, term.relatedLesson)
  const hayLeccion = destino.esLeccion

  return (
    <div className="mt-8 p-6 bg-dark-surface border border-white/10 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-brand-light" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-white/60 mb-1">
              {hayLeccion ? 'Dónde se explica en profundidad' : 'Relacionado con este curso'}
            </p>
            <p className="text-lg font-semibold text-white">
              {destino.titulo}{' '}
              <span className="font-normal text-white/60">({destino.nivel})</span>
            </p>
          </div>
        </div>
        <EnlaceACurso
          url={destino.url}
          origen="glosario"
          slugOrigen={term.slug}
          courseSlug={term.relatedCourse}
          variante="texto"
        >
          {hayLeccion ? 'Ir a la lección' : 'Ver el curso'}
        </EnlaceACurso>
      </div>
    </div>
  )
}
