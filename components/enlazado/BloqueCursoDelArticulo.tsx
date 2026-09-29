import { BookOpen } from 'lucide-react'
import { destinoDelCurso, SIN_CURSO_DEL_TEMA, CUBIERTO_EN_PARTE } from '@/lib/enlazado/enlace'
import { EnlaceACurso } from './EnlaceACurso'
import type { BlogPost } from '@/lib/blog-data'

/**
 * El bloque del final de cada artículo, con el curso concreto al que lleva.
 *
 * Sustituye al genérico «Explora nuestros cursos completos con ejercicios
 * prácticos y certificados», que no llevaba a ningún sitio en particular y
 * prometía cosas en general.
 *
 * TRES VARIANTES, Y LA RAZÓN DE QUE SEAN TRES
 *   1. Normal: hay un curso del tema. Se dice cuál y a qué lección lleva.
 *   2. Cubierto en parte (staking): no hay curso del tema, pero una lección sí
 *      explica el mecanismo de fondo. Se dice así, de frente.
 *   3. Sin curso del tema (DeFi, DAOs): NO se puede presentar el curso más
 *      cercano como si tratara el tema. Se dice que no lo tenemos y qué parte
 *      relacionada cubre el que se enlaza.
 *
 *   La tercera variante existe porque la alternativa era una promesa falsa, y
 *   el Principio #7 la prohíbe. Reconocer un hueco cuesta menos que perder la
 *   confianza de quien llega esperando un curso de DeFi.
 */
export function BloqueCursoDelArticulo({ post }: { post: BlogPost }) {
  const destino = destinoDelCurso(post.relatedCourse, post.relatedLesson)
  const sinCurso = SIN_CURSO_DEL_TEMA[post.slug]
  const enParte = CUBIERTO_EN_PARTE[post.slug]

  let titulo: string
  let cuerpo: React.ReactNode
  let textoEnlace: string

  if (sinCurso) {
    titulo = `Todavía no tenemos un curso sobre ${sinCurso.tema}`
    cuerpo = (
      <>
        Lo más cercano es <strong className="text-white">{destino.titulo}</strong>{' '}
        ({destino.nivel}), que explica {sinCurso.queSiCubre}.
      </>
    )
    textoEnlace = 'Ver ese curso'
  } else if (enParte) {
    titulo = `No hay un curso de ${enParte.tema}, pero el fondo sí está`
    cuerpo = (
      <>
        <strong className="text-white">{destino.titulo}</strong> ({destino.nivel}){' '}
        explica {enParte.queSiCubre}.
      </>
    )
    textoEnlace = destino.esLeccion ? 'Ir a esa lección' : 'Ver ese curso'
  } else {
    titulo = 'Si quieres entenderlo a fondo'
    cuerpo = (
      <>
        <strong className="text-white">{destino.titulo}</strong> ({destino.nivel})
        {destino.esLeccion ? ', empezando por la lección que trata justo esto.' : '.'}
      </>
    )
    textoEnlace = destino.esLeccion ? 'Ir a esa lección' : 'Ver el curso'
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-gradient-to-br from-brand/10 to-brand-light/5 border border-brand/20 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-brand-light/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-brand-light" aria-hidden="true" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white mb-2">{titulo}</h3>
            <p className="text-white/70">{cuerpo}</p>
          </div>
          <EnlaceACurso
            url={destino.url}
            origen="blog"
            slugOrigen={post.slug}
            courseSlug={post.relatedCourse}
          >
            {textoEnlace}
          </EnlaceACurso>
        </div>
      </div>
    </section>
  )
}
