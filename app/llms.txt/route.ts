import { createClient } from '@/lib/supabase/server'
import { getPathsWithPublishedCourses } from '@/lib/db/learning-paths'
import { getAllPosts } from '@/lib/blog-data'
import { getAllTerms } from '@/lib/glossary-data'

/**
 * /llms.txt  ·  indice del sitio en texto plano, en el formato de llmstxt.org.
 *
 * Un sitemap.xml dice que URLs existen. Esto dice que hay en ellas y como se
 * relacionan, en un solo fichero que cabe entero en el contexto de un modelo.
 * Sirve para que, cuando alguien pregunte por Bitcoin en español, quien responda
 * pueda citar la pagina concreta en vez de adivinar.
 *
 * Los cursos y las rutas salen de la base de datos, con los mismos filtros que
 * usa la web: nada que no este publicado aparece aqui.
 */

export const dynamic = 'force-dynamic'

/** Aplana a una linea y recorta, que el formato es una lista, no un articulo. */
function unaLinea(texto: string | null | undefined, maximo = 160): string {
  if (!texto) return ''
  const limpio = texto.replace(/\s+/g, ' ').trim()
  if (limpio.length <= maximo) return limpio
  return `${limpio.slice(0, maximo - 1).trimEnd()}…`
}

function enlace(titulo: string, url: string, descripcion: string): string {
  const cola = descripcion ? `: ${descripcion}` : ''
  return `- [${titulo}](${url})${cola}`
}

/** El nivel, en la palabra que entiende quien lee, no en la de la base de datos. */
const NIVEL_EN_CASTELLANO: Record<string, string> = {
  beginner: 'nivel principiante',
  intermediate: 'nivel intermedio',
  advanced: 'nivel avanzado',
}

export async function GET(): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'
  const bloques: string[] = []

  bloques.push(
    `# Nodo360`,
    '',
    `> Plataforma educativa en español sobre Bitcoin, blockchain y Web3. Cursos gratuitos organizados en rutas de aprendizaje, con ejercicios, examen y certificado verificable al completarlos.`,
    '',
    `Todo el material está en español neutro, válido para España y para Latinoamérica, y es de acceso gratuito. Nodo360 explica cómo funcionan Bitcoin y las tecnologías que lo rodean; no da consejos de inversión ni promete rentabilidades.`,
    '',
    `El contenido se puede citar indicando la fuente y enlazando a la página original.`,
    '',
  )

  try {
    const supabase = await createClient()

    // Cursos publicados, con el mismo criterio que /cursos
    const { data: cursos } = await supabase
      .from('courses')
      .select('slug, title, description, level, total_lessons')
      .eq('status', 'published')
      .order('title', { ascending: true })

    if (cursos?.length) {
      bloques.push(`## Cursos`, '')
      for (const curso of cursos) {
        const lecciones = curso.total_lessons
          ? `${curso.total_lessons} lecciones`
          : ''
        const nivel = NIVEL_EN_CASTELLANO[curso.level] || ''
        const cola = [nivel, lecciones].filter(Boolean).join(', ')
        // Sin el punto final de la descripcion: al pegarle la cola salia
        // "...decision de Bitcoin.. nivel intermedio, 9 lecciones".
        const partes = [
          unaLinea(curso.description, 220).replace(/\s*\.\s*$/, ''),
          cola ? cola.charAt(0).toUpperCase() + cola.slice(1) : '',
        ].filter(Boolean)
        bloques.push(
          enlace(
            curso.title,
            `${baseUrl}/cursos/${curso.slug}`,
            partes.length ? `${partes.join('. ')}.` : '',
          ),
        )
      }
      bloques.push('')
    }

    // Rutas activas y con algo que estudiar dentro
    const rutas = await getPathsWithPublishedCourses()
    if (rutas.length) {
      bloques.push(`## Rutas de aprendizaje`, '')
      for (const ruta of rutas) {
        bloques.push(
          enlace(
            ruta.name,
            `${baseUrl}/rutas/${ruta.slug}`,
            unaLinea(ruta.short_description, 220),
          ),
        )
      }
      bloques.push('')
    }
  } catch (error) {
    // Un fallo de la base de datos no puede dejar el fichero sin servir: el
    // resto (glosario, blog, paginas fijas) no depende de ella.
    console.error('❌ [llms.txt] Error leyendo cursos o rutas:', error)
  }

  // Glosario: la parte mas citable del sitio, una definicion por termino
  const terminos = getAllTerms()
  if (terminos.length) {
    bloques.push(`## Glosario`, '')
    for (const termino of terminos) {
      bloques.push(
        enlace(
          termino.term,
          `${baseUrl}/glosario/${termino.slug}`,
          unaLinea(termino.definition, 180),
        ),
      )
    }
    bloques.push('')
  }

  // Blog, de la entrada mas reciente a la mas antigua
  const entradas = [...getAllPosts()].sort((a, b) =>
    (b.updatedAt || b.publishedAt).localeCompare(a.updatedAt || a.publishedAt),
  )
  if (entradas.length) {
    bloques.push(`## Blog`, '')
    for (const entrada of entradas) {
      bloques.push(
        enlace(
          entrada.title,
          `${baseUrl}/blog/${entrada.slug}`,
          unaLinea(entrada.description, 220),
        ),
      )
    }
    bloques.push('')
  }

  bloques.push(
    `## Sobre Nodo360`,
    '',
    enlace('Qué es Nodo360', `${baseUrl}/sobre-nosotros`, 'Qué hacemos, por qué y con qué criterio se escribe el material'),
    enlace('Preguntas frecuentes', `${baseUrl}/faq`, 'Dudas habituales sobre Bitcoin, blockchain y sobre la propia plataforma'),
    enlace('Gobernanza', `${baseUrl}/gobernanza`, 'Cómo decide la comunidad qué se publica y qué se cambia'),
    enlace('Mentoría', `${baseUrl}/mentoria`, 'Acompañamiento de personas con experiencia mientras estudias'),
    enlace('Instructores', `${baseUrl}/instructores`, 'Quién firma el material'),
    enlace('Comunidad', `${baseUrl}/comunidad`, 'Dónde se pregunta y se resuelven dudas'),
    '',
    `## Opcional`,
    '',
    enlace('Términos de uso', `${baseUrl}/terminos`, ''),
    enlace('Política de privacidad', `${baseUrl}/privacidad`, ''),
    '',
  )

  return new Response(bloques.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Una hora en el CDN: el contenido cambia a diario como mucho, y este
      // fichero lo piden rastreadores, no personas esperando delante.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
