import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLearningPaths, getCoursesByLearningPathSlug } from '@/lib/db/learning-paths'
import { RouteCardWrapper } from '@/components/learning-path/RouteCardWrapper'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Rutas de Aprendizaje',
  description:
    'Elige tu ruta de aprendizaje personalizada. Desde Bitcoin hasta desarrollo Web3 avanzado.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RutasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let activePathId: string | null = null
  if (user) {
    const { data: activePath } = await supabase
      .from('user_selected_paths')
      .select('path_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    activePathId = activePath?.path_id ?? null
  }

  const paths = await getLearningPaths()

  const pathsWithCounts = await Promise.all(
    paths.map(async (path) => {
      const courses = await getCoursesByLearningPathSlug(path.slug)
      const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || 0), 0)
      return {
        ...path,
        courseCount: courses.length,
        totalLessons,
        isActive: activePathId === path.id,
      }
    })
  )

  const getEducationalHint = (slug: string) => {
    const s = slug.toLowerCase()
    if (s.includes('bitcoin')) return 'Empieza desde cero y avanza con seguridad'
    if (s.includes('seguridad')) return 'Protege tu patrimonio y evita errores comunes'
    if (s.includes('web3') || s.includes('blockchain')) return 'Construye criterio antes de usar dApps'
    if (s.includes('trading')) return 'Entiende riesgos y crea un método básico'
    return 'Ruta guiada paso a paso'
  }

  const hasActiveRoute = pathsWithCounts.some((p) => p.isActive)
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* HERO COMPACTO - DARK THEME */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Elige tu <span className="text-brand-light">Ruta de Aprendizaje</span>
              </h1>
              <p className="text-white/70 leading-relaxed">
                Te guiamos paso a paso. Puedes cambiar de ruta cuando quieras.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-3 py-1 bg-white/5 text-white/70 text-sm rounded-full border border-white/10">
                  Cursos cortos y prácticos
                </span>
                <span className="px-3 py-1 bg-white/5 text-white/70 text-sm rounded-full border border-white/10">
                  Pensado para público hispano
                </span>
              </div>
            </div>

            {/* Status box */}
            {!hasActiveRoute ? (
              <div className="bg-dark-soft border border-white/10 rounded-xl p-4 text-sm lg:w-[300px] flex-shrink-0">
                <div className="font-medium text-white">Siguiente paso</div>
                <div className="mt-1 text-white/60">
                  Selecciona una ruta para ver los cursos recomendados y comenzar.
                </div>
                {!isLoggedIn && (
                  <Button variant="secondary" href="/login?redirect=/dashboard/rutas" className="mt-3 w-full">
                    Iniciar sesión
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-sm lg:w-[300px] flex-shrink-0">
                <div className="font-medium text-success">Ruta activa</div>
                <div className="mt-1 text-white/70">
                  Ya tienes una ruta seleccionada. Puedes continuar o cambiarla.
                </div>
                <Button variant="primary" href="/dashboard" className="mt-3 w-full">
                  Ir a mi dashboard
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN RUTAS */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Rutas disponibles</h2>
            <p className="text-sm text-white/60 mt-1">
              Explora las rutas y elige la que mejor se adapte a ti.
            </p>
          </div>

          {pathsWithCounts.length === 0 ? (
            <div className="bg-dark-surface border border-white/10 rounded-xl p-8 text-center">
              <p className="text-white/60">
                No hay rutas disponibles en este momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pathsWithCounts.map((path, index) => (
                <RouteCardWrapper
                  key={path.id}
                  path={path}
                  educationalHint={getEducationalHint(path.slug)}
                  isLoggedIn={isLoggedIn}
                  isRecommended={index === 0 && !hasActiveRoute}
                />
              ))}
            </div>
          )}
        </div>

        {/* Login prompt (solo si no hay user y hay rutas) */}
        {!isLoggedIn && pathsWithCounts.length > 0 && (
          <div className="bg-gradient-to-br from-brand/10 to-brand-light/5 border border-brand/20 rounded-2xl p-6 sm:p-8 text-center">
            <p className="text-white/80 mb-4">
              Inicia sesión para seleccionar tu ruta y guardar tu progreso.
            </p>
            <Button variant="primary" href="/login?redirect=/dashboard/rutas">
              Iniciar sesión
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
