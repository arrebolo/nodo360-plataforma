import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAllPosts } from '@/lib/blog-data'
import { getAllTerms } from '@/lib/glossary-data'

export const dynamic = 'force-dynamic'

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
      (lesson: any) => lesson.module?.course?.status === 'published'
    ) || []

    // Obtener rutas de aprendizaje
    const { data: learningPaths } = await supabase
      .from('learning_paths')
      .select('slug, updated_at')

    // URLs estáticas principales
    const staticPages: MetadataRoute.Sitemap = [
      // Página principal
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      // Cursos y aprendizaje
      {
        url: `${baseUrl}/cursos`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/rutas`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      // Contenido educativo
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/glosario`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      // Comunidad y personas
      {
        url: `${baseUrl}/comunidad`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/mentoria`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/mentores`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/instructores`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/proyectos`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      // Gobernanza
      {
        url: `${baseUrl}/gobernanza`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      // Información
      {
        url: `${baseUrl}/sobre-nosotros`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/privacidad`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terminos`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
    ]

    // URLs de términos del glosario
    const glossaryTerms = getAllTerms()
    const glossaryPages: MetadataRoute.Sitemap = glossaryTerms.map((term) => ({
      url: `${baseUrl}/glosario/${term.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    // URLs de artículos del blog
    const blogPosts = getAllPosts()
    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    // URLs de rutas de aprendizaje (públicas)
    const pathPages: MetadataRoute.Sitemap = (learningPaths || []).map((path) => ({
      url: `${baseUrl}/rutas/${path.slug}`,
      lastModified: path.updated_at ? new Date(path.updated_at) : new Date(),
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
    const lessonPages: MetadataRoute.Sitemap = publishedLessons.map((lesson: any) => ({
      url: `${baseUrl}/cursos/${lesson.module.course.slug}/${lesson.slug}`,
      lastModified: new Date(lesson.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticPages, ...glossaryPages, ...blogPages, ...pathPages, ...coursePages, ...lessonPages]

  } catch (error) {
    console.error('Error generating sitemap:', error)

    // Return at least static pages if there's an error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/cursos`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/comunidad`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ]
  }
}
