import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPathsWithPublishedCourses } from '@/lib/db/learning-paths'
import { getAllPosts } from '@/lib/blog-data'
import { getAllTerms } from '@/lib/glossary-data'

export const dynamic = 'force-dynamic'

type Frecuencia = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

/**
 * Fecha de la ultima revision del glosario COMO CONJUNTO.
 *
 * Los terminos no guardan fecha propia (ver GlossaryTerm en @/lib/glossary-data),
 * asi que no hay manera de saber cuando cambio cada uno. Antes los 72 salian con
 * `new Date()`, que es la version peor de no saberlo: afirmaba que los setenta y
 * dos se habian revisado hoy. Esta es la fecha del ultimo cambio real de
 * lib/glossary-data.ts. AL REVISAR EL GLOSARIO, actualizarla.
 */
const REVISION_GLOSARIO = '2026-09-21'

/**
 * Paginas fijas, con la fecha de su ultimo cambio real.
 *
 * Las fechas salen del historial de git (git log -1 --format=%cs sobre el
 * fichero de cada pagina) y se consultaron el 27/09/2026. Antes todas llevaban
 * `new Date()`: un sitemap que jura cada dia que sus dieciseis paginas fijas han
 * cambiado hoy no informa de nada, y un buscador que lo comprueba dos veces deja
 * de creerse las fechas del sitemap entero, incluidas las de los cursos, que si
 * son buenas.
 *
 * AL TOCAR UNA DE ESTAS PAGINAS, actualizar aqui su fecha.
 */
const PAGINAS_FIJAS: ReadonlyArray<{
  ruta: string
  revisada: string
  frecuencia: Frecuencia
  prioridad: number
}> = [
  // Principal
  { ruta: '', revisada: '2026-09-26', frecuencia: 'daily', prioridad: 1.0 },
  // Cursos y aprendizaje
  { ruta: '/cursos', revisada: '2026-09-22', frecuencia: 'daily', prioridad: 0.9 },
  { ruta: '/rutas', revisada: '2026-09-27', frecuencia: 'weekly', prioridad: 0.8 },
  { ruta: '/pricing', revisada: '2026-09-22', frecuencia: 'monthly', prioridad: 0.8 },
  // Contenido educativo. La fecha de /blog casi nunca se usa: se calcula mas
  // abajo a partir de la entrada mas reciente, que es un dato exacto y que no
  // hay que mantener a mano.
  { ruta: '/blog', revisada: '2026-09-27', frecuencia: 'daily', prioridad: 0.9 },
  { ruta: '/glosario', revisada: REVISION_GLOSARIO, frecuencia: 'weekly', prioridad: 0.8 },
  { ruta: '/faq', revisada: '2026-09-22', frecuencia: 'monthly', prioridad: 0.7 },
  // Comunidad y personas
  { ruta: '/comunidad', revisada: '2026-09-24', frecuencia: 'weekly', prioridad: 0.8 },
  { ruta: '/mentoria', revisada: '2026-09-21', frecuencia: 'monthly', prioridad: 0.8 },
  { ruta: '/mentores', revisada: '2026-02-06', frecuencia: 'weekly', prioridad: 0.7 },
  { ruta: '/instructores', revisada: '2026-09-22', frecuencia: 'weekly', prioridad: 0.7 },
  { ruta: '/proyectos', revisada: '2026-09-24', frecuencia: 'weekly', prioridad: 0.7 },
  // Gobernanza
  { ruta: '/gobernanza', revisada: '2026-09-22', frecuencia: 'weekly', prioridad: 0.7 },
  // Informacion
  { ruta: '/sobre-nosotros', revisada: '2026-09-21', frecuencia: 'monthly', prioridad: 0.6 },
  { ruta: '/privacidad', revisada: '2026-01-15', frecuencia: 'yearly', prioridad: 0.3 },
  { ruta: '/terminos', revisada: '2026-01-15', frecuencia: 'yearly', prioridad: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  try {
    const supabase = await createClient()

    // Obtener todos los cursos publicados
    const { data: courses } = await supabase
      .from('courses')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    // Obtener todas las lecciones de cursos publicados
    const { data: lessons } = await supabase
      .from('lessons')
      .select(`
        slug,
        updated_at,
        module:modules!inner(
          course:courses!inner(slug, status)
        )
      `)

    // Filtrar solo lecciones de cursos publicados
    const publishedLessons = lessons?.filter(
      (lesson: any) => lesson?.module?.course?.status === 'published'
    ) || []

    // Rutas de aprendizaje: activas Y con al menos un curso publicado.
    // Antes se pedian todas, sin ningun filtro, de modo que el sitemap anunciaba
    // rutas desactivadas y rutas cuya pagina solo dice "en preparacion". Es la
    // misma funcion que usa el listado /rutas, asi que el sitemap y la web ya no
    // pueden discrepar sobre que rutas existen.
    const learningPaths = await getPathsWithPublishedCourses()

    // URLs de artículos del blog
    const blogPosts = getAllPosts()
    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    // El indice del blog cambia cuando cambia alguna entrada, y esa fecha si se
    // sabe con exactitud. Si algun dia no hubiera ninguna, cae en la fecha fija.
    const ultimoCambioDelBlog = blogPages.reduce<Date | null>((max, pagina) => {
      const fecha = pagina.lastModified as Date
      return !max || fecha > max ? fecha : max
    }, null)

    // URLs estáticas principales
    const staticPages: MetadataRoute.Sitemap = PAGINAS_FIJAS.map((pagina) => ({
      url: `${baseUrl}${pagina.ruta}`,
      lastModified:
        pagina.ruta === '/blog' && ultimoCambioDelBlog
          ? ultimoCambioDelBlog
          : new Date(pagina.revisada),
      changeFrequency: pagina.frecuencia,
      priority: pagina.prioridad,
    }))

    // URLs de términos del glosario
    const glossaryTerms = getAllTerms()
    const glossaryPages: MetadataRoute.Sitemap = glossaryTerms.map((term) => ({
      url: `${baseUrl}/glosario/${term.slug}`,
      lastModified: new Date(REVISION_GLOSARIO),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    // URLs de rutas de aprendizaje
    const pathPages: MetadataRoute.Sitemap = learningPaths.map((path) => ({
      url: `${baseUrl}/rutas/${path.slug}`,
      lastModified: path.updated_at ? new Date(path.updated_at) : new Date(REVISION_GLOSARIO),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // URLs de cursos
    const coursePages: MetadataRoute.Sitemap = courses?.map((course) => ({
      url: `${baseUrl}/cursos/${course.slug}`,
      lastModified: new Date(course.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    })) || []

    // URLs de lecciones
    // Descarta las que tengan datos incompletos (modulo huerfano, curso borrado,
    // sin updated_at): sin este filtro un solo registro roto revienta todo el sitemap.
    const lessonPages: MetadataRoute.Sitemap = publishedLessons
      .filter(
        (lesson: any) =>
          lesson?.slug && lesson?.module?.course?.slug && lesson?.updated_at
      )
      .map((lesson: any) => ({
        url: `${baseUrl}/cursos/${lesson.module.course.slug}/${lesson.slug}`,
        lastModified: new Date(lesson.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

    return [...staticPages, ...glossaryPages, ...blogPages, ...pathPages, ...coursePages, ...lessonPages]

  } catch (error) {
    console.error('Error generating sitemap:', error)

    // Si la base de datos falla, al menos las paginas fijas, que no dependen de
    // ella. Con su fecha real: un sitemap de emergencia tampoco tiene por que
    // mentir sobre cuando cambiaron.
    return PAGINAS_FIJAS.map((pagina) => ({
      url: `${baseUrl}${pagina.ruta}`,
      lastModified: new Date(pagina.revisada),
      changeFrequency: pagina.frecuencia,
      priority: pagina.prioridad,
    }))
  }
}
