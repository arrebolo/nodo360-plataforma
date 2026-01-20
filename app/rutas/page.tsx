import type { Metadata } from 'next'
import Link from 'next/link'
import { getLearningPaths, getCoursesByLearningPathSlug } from '@/lib/db/learning-paths'
import { Footer } from '@/components/navigation/Footer'
import { Layers, BookOpen, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Rutas de Aprendizaje | Nodo360',
  description: 'Elige tu ruta de aprendizaje personalizada. Desde Bitcoin hasta desarrollo Web3 avanzado.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RutasPublicPage() {
  const paths = await getLearningPaths()

  // Obtener conteos de cursos y lecciones para cada ruta
  const pathsWithCounts = await Promise.all(
    paths.map(async (path) => {
      const courses = await getCoursesByLearningPathSlug(path.slug)
      const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || 0), 0)
      return {
        ...path,
        courseCount: courses.length,
        totalLessons,
      }
    })
  )

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* HERO COMPACTO - DARK THEME */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Rutas de <span className="text-brand-light">Aprendizaje</span>
            </h1>
            <p className="text-white/70 max-w-2xl">
              Te guiamos paso a paso. Elige la ruta que mejor se adapte a tus objetivos.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1 bg-white/5 text-white/70 text-sm rounded-full border border-white/10">
                Cursos organizados por nivel
              </span>
              <span className="px-3 py-1 bg-white/5 text-white/70 text-sm rounded-full border border-white/10">
                Progreso guiado
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN RUTAS */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Rutas disponibles</h2>
            <p className="text-sm text-white/60 mt-1">
              {pathsWithCounts.length} rutas para elegir
            </p>
          </div>

          {pathsWithCounts.length === 0 ? (
            <div className="bg-dark-surface border border-white/10 rounded-xl p-8 text-center">
              <Layers className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">No hay rutas disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pathsWithCounts.map((path) => (
                <Link
                  key={path.id}
                  href={`/rutas/${path.slug}`}
                  className="block group"
                >
                  <div className="relative overflow-hidden bg-dark-surface border border-white/10 rounded-2xl min-h-[280px] flex flex-col transition-all duration-150 hover:-translate-y-1 hover:border-brand-light/30 hover:shadow-lg hover:shadow-brand-light/5">
                    {/* Línea de acento */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-light to-brand" />

                    <div className="p-5 pt-6 flex-1 flex flex-col">
                      {/* Emoji y título */}
                      <div className="flex items-center gap-3 mb-3">
                        {path.emoji && (
                          <span className="text-3xl">{path.emoji}</span>
                        )}
                        <h3 className="text-lg font-semibold text-white group-hover:text-brand-light transition-colors">
                          {path.name}
                        </h3>
                      </div>

                      {/* Descripción */}
                      {path.short_description && (
                        <p className="text-sm text-white/60 line-clamp-3 mb-4">
                          {path.short_description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-white/50 mt-auto">
                        <span className="inline-flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          {path.courseCount} cursos
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          {path.totalLessons} lecciones
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <span className="inline-flex items-center text-sm font-medium text-brand-light group-hover:text-brand transition-colors">
                          Ver ruta
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA para registro */}
        <div className="bg-gradient-to-br from-brand/10 to-brand-light/5 border border-brand/20 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            ¿Listo para empezar?
          </h3>
          <p className="text-white/70 mb-4">
            Crea tu cuenta gratis y comienza tu ruta de aprendizaje.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-light hover:bg-brand text-white font-medium rounded-lg transition-colors"
          >
            Comenzar ahora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
