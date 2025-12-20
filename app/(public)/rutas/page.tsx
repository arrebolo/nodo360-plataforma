import { createClient } from '@/lib/supabase/server'
import { RouteCard } from '@/components/routes/RouteCard'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rutas de Aprendizaje | Nodo360',
  description: 'Elige tu camino y domina Bitcoin y blockchain paso a paso con nuestras rutas de aprendizaje estructuradas.',
}

interface LearningPath {
  id: string
  slug: string
  title: string
  description: string | null
  short_description: string | null
  icon: string | null
  order_index: number
  is_active: boolean
  created_at: string
}

interface LearningPathWithCourses extends LearningPath {
  course_count: number
}

async function getLearningPaths(): Promise<LearningPathWithCourses[]> {
  const supabase = await createClient()

  // Obtener rutas de aprendizaje
  const { data: paths, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('[Rutas] Error fetching learning paths:', error)
    return []
  }

  if (!paths || paths.length === 0) {
    return []
  }

  // Obtener conteo de cursos para cada ruta
  const pathsWithCounts = await Promise.all(
    paths.map(async (path) => {
      const { count } = await supabase
        .from('learning_path_courses')
        .select('*', { count: 'exact', head: true })
        .eq('learning_path_id', path.id)

      return {
        ...path,
        course_count: count || 0,
      }
    })
  )

  return pathsWithCounts
}

export default async function RutasPage() {
  const paths = await getLearningPaths()

  return (
    <div className="min-h-screen bg-[#070a10]">
      {/* Header de pagina */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Rutas de Aprendizaje
        </h1>
        <p className="mt-2 text-neutral-400">
          Elige tu camino y domina Bitcoin y blockchain paso a paso.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {paths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paths.map((path) => (
              <RouteCard
                key={path.id}
                slug={path.slug}
                title={path.title}
                short_description={path.short_description}
                description={path.description}
                icon={path.icon}
                course_count={path.course_count}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 flex items-center justify-center mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Proximamente</h2>
            <p className="text-neutral-400 max-w-md mx-auto">
              Estamos preparando rutas de aprendizaje estructuradas para que puedas dominar Bitcoin y blockchain de forma progresiva.
            </p>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Ver cursos disponibles
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
