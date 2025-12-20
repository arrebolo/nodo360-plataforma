import { createClient } from '@/lib/supabase/server'
import { CourseCardV2 } from '@/components/courses/CourseCardV2'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface LearningPath {
  id: string
  slug: string
  title: string
  description: string | null
  short_description: string | null
  long_description: string | null
  icon: string | null
  order_index: number
  is_active: boolean
}

interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  banner_url: string | null
  thumbnail_url: string | null
  is_free: boolean
  is_premium: boolean
  level: string
}

async function getLearningPath(
  slug: string
): Promise<{ path: LearningPath; courses: Course[] } | null> {
  const supabase = await createClient()

  const { data: path, error: pathError } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (pathError || !path) {
    console.error('[RutaDetail] Error fetching learning path:', pathError)
    return null
  }

  const { data: pathCourses, error: coursesError } = await supabase
    .from('learning_path_courses')
    .select(`
      course_id,
      order_index,
      courses (
        id,
        slug,
        title,
        description,
        banner_url,
        thumbnail_url,
        is_free,
        is_premium,
        level
      )
    `)
    .eq('learning_path_id', path.id)
    .order('order_index', { ascending: true })

  if (coursesError) {
    console.error('[RutaDetail] Error fetching courses:', coursesError)
    return { path, courses: [] }
  }

  const courses = (pathCourses || [])
    .map((pc: any) => pc.courses as Course | null)
    .filter(Boolean) as Course[]

  console.log('[RutaDetail] Ruta cargada:', path.title, '- Cursos:', courses.length)

  return { path, courses }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const result = await getLearningPath(slug)

  if (!result) {
    return { title: 'Ruta no encontrada | Nodo360' }
  }

  const desc =
    result.path.short_description ||
    result.path.description ||
    `Aprende ${result.path.title} con una ruta estructurada.`

  return {
    title: `${result.path.title} | Rutas de Aprendizaje | Nodo360`,
    description: desc,
  }
}

export default async function RutaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await getLearningPath(slug)

  if (!result) notFound()

  const { path, courses } = result

  return (
    <div className="min-h-screen bg-[#070a10]">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <nav className="flex items-center gap-2 text-sm text-neutral-500">
          <Link href="/rutas" className="hover:text-white transition-colors">
            Rutas
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-white">{path.title}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex items-start gap-5">
          {/* Icono */}
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl sm:text-4xl">
            {path.icon || '🎯'}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {path.title}
            </h1>

            <p className="mt-2 text-neutral-400 max-w-2xl">
              {path.short_description ||
                path.description ||
                'Explora esta ruta de aprendizaje estructurada.'}
            </p>

            {/* Badge de cursos */}
            <div className="mt-4 flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-300">
                {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Long description (si existe) */}
      {path.long_description && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 sm:p-6">
            <p className="text-neutral-400 whitespace-pre-line leading-relaxed">
              {path.long_description}
            </p>
          </div>
        </div>
      )}

      {/* Grid de Cursos - 4 columnas */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Cursos de esta ruta
          </h2>
          <Link
            href="/rutas"
            className="text-sm text-neutral-500 hover:text-white transition-colors"
          >
            ← Volver a rutas
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {courses.map((course) => (
              <CourseCardV2
                key={course.id}
                slug={course.slug}
                title={course.title}
                description={course.description}
                banner_url={course.banner_url}
                thumbnail_url={course.thumbnail_url}
                is_free={course.is_free}
                is_premium={course.is_premium}
                level={course.level}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 flex items-center justify-center">
              <span className="text-3xl">📚</span>
            </div>
            <p className="text-neutral-400 mb-4">
              No hay cursos en esta ruta todavia.
            </p>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Ver todos los cursos
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
