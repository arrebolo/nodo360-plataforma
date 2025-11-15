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
    console.log('🗺️  [Sitemap] Obteniendo lecciones para sitemap...')

    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        slug,
        updated_at,
        module:modules!inner(
          course:courses!inner(slug, status)
        )
      `)

    if (lessonsError) {
      console.error('❌ [Sitemap] Error obteniendo lecciones:', lessonsError)
    }

    console.log('📊 [Sitemap] Lecciones obtenidas:', {
      total: lessons?.length || 0,
      sample: lessons?.[0] ? {
        slug: lessons[0].slug,
        hasModule: !!lessons[0].module,
        hasCourse: !!(lessons[0] as any).module?.course,
        courseSlug: (lessons[0] as any).module?.course?.slug
      } : 'No hay lecciones'
    })

    // Filtrar solo lecciones de cursos publicados con validación null-safe
    const publishedLessons = lessons?.filter(
      (lesson: any) => {
        const isPublished = lesson?.module?.course?.status === 'published'
        if (!isPublished && lesson) {
          console.warn('⚠️  [Sitemap] Lección excluida:', {
            lessonSlug: lesson.slug,
            hasModule: !!lesson.module,
            hasCourse: !!lesson.module?.course,
            status: lesson.module?.course?.status
          })
        }
        return isPublished
      }
    ) || []

    console.log('✅ [Sitemap] Lecciones publicadas filtradas:', publishedLessons.length)

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
    ]

    // URLs de cursos
    const coursePages: MetadataRoute.Sitemap = courses?.map((course) => ({
      url: `${baseUrl}/cursos/${course.slug}`,
      lastModified: new Date(course.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    })) || []

    // URLs de lecciones con validación null-safe
    const lessonPages: MetadataRoute.Sitemap = publishedLessons
      .filter((lesson: any) => {
        // Doble validación para asegurar que tenemos todos los datos necesarios
        const hasValidData = lesson?.slug &&
                             lesson?.module?.course?.slug &&
                             lesson?.updated_at
        if (!hasValidData) {
          console.warn('⚠️  [Sitemap] Lección sin datos completos:', {
            lessonSlug: lesson?.slug,
            courseSlug: lesson?.module?.course?.slug,
            hasUpdatedAt: !!lesson?.updated_at
          })
        }
        return hasValidData
      })
      .map((lesson: any) => ({
        url: `${baseUrl}/cursos/${lesson.module.course.slug}/${lesson.slug}`,
        lastModified: new Date(lesson.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

    return [...staticPages, ...coursePages, ...lessonPages]

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
