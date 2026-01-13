import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

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
      {
        url: `${baseUrl}/proyectos`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/mentoria`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/sobre-nosotros`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/gobernanza`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
    ]

    // URLs de rutas de aprendizaje
    const pathPages: MetadataRoute.Sitemap = (learningPaths || []).map((path) => ({
      url: `${baseUrl}/dashboard/rutas/${path.slug}`,
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

    return [...staticPages, ...pathPages, ...coursePages, ...lessonPages]

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
