// app/(public)/rutas/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Rutas de Aprendizaje | Nodo360',
  description: 'Elige tu camino de aprendizaje en Bitcoin y Blockchain',
}

export default async function RoutesPage() {
  const supabase = await createClient()

  // Obtener rutas con conteo de cursos en una sola query
  const { data: routes, error } = await supabase
    .from('learning_paths')
    .select(`
      id,
      slug,
      name,
      emoji,
      short_description,
      position,
      is_active,
      learning_path_courses (
        id,
        course_id
      )
    `)
    .order('position', { ascending: true })

  if (error) {
    console.error('❌ [RoutesPage] Error:', error)
  }

  // Procesar rutas con conteo
  const routesWithCount = (routes ?? []).map((route) => ({
    ...route,
    courseCount: route.learning_path_courses?.length ?? 0,
  }))

  // Separar rutas activas e inactivas (coming soon)
  const activeRoutes = routesWithCount.filter((r) => r.is_active)
  const comingSoonRoutes = routesWithCount.filter((r) => !r.is_active)

  return (
    <main className="min-h-screen bg-[#050608]">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:pt-14">
        {/* HEADER */}
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Rutas de Aprendizaje
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-neutral-300">
            Elige tu camino. Cada ruta te guía paso a paso desde los fundamentos
            hasta dominar Bitcoin, Web3 y la seguridad de tus activos.
          </p>

          <div className="mx-auto mt-5 h-[3px] w-16 rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-emerald-400" />
        </header>

        {/* GRID DE RUTAS */}
        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {activeRoutes.length === 0 && comingSoonRoutes.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-white/5 bg-[#101018]/95 px-6 py-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.65)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/40 via-emerald-500/30 to-sky-500/30">
                <span className="text-3xl">🚧</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                Próximamente
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                Estamos preparando nuevas rutas de aprendizaje para ti.
              </p>
            </div>
          ) : (
            <>
              {/* Rutas activas */}
              {activeRoutes.map((path) => (
                <Link
                  key={path.id}
                  href={`/rutas/${path.slug}`}
                  className="group relative flex h-full flex-col rounded-3xl border border-white/6 bg-[#101018]/95 px-5 py-4 shadow-[0_20px_45px_rgba(0,0,0,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/60 hover:bg-[#15141f]"
                >
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-amber-500/10 via-emerald-500/6 to-sky-500/8 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-gradient-to-br from-[#20140a] via-[#141822] to-[#102018] shadow-inner">
                      <span className="text-2xl">
                        {path.emoji ??
                          (path.slug?.includes('bitcoin')
                            ? '₿'
                            : path.slug?.includes('seguridad')
                            ? '🔐'
                            : path.slug?.includes('trading')
                            ? '📈'
                            : '📘')}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col">
                      <h2 className="text-base md:text-lg font-semibold text-white group-hover:text-amber-50">
                        {path.name}
                      </h2>

                      {path.short_description && (
                        <p className="mt-1 text-xs md:text-sm leading-relaxed text-neutral-300 line-clamp-3">
                          {path.short_description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
                          {path.courseCount}{' '}
                          {path.courseCount === 1 ? 'curso' : 'cursos'}
                        </span>

                        <span className="hidden items-center gap-1 md:inline-flex">
                          <span className="h-2 w-2 rounded-full bg-sky-400/70" />
                          Progreso lineal
                        </span>
                      </div>
                    </div>

                    <div className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-neutral-200 transition-all duration-300 group-hover:border-amber-400/60 group-hover:bg-amber-500/20 group-hover:text-amber-200">
                      →
                    </div>
                  </div>
                </Link>
              ))}

              {/* Rutas coming soon */}
              {comingSoonRoutes.map((path) => (
                <div
                  key={path.id}
                  className="relative flex h-full flex-col rounded-3xl border border-white/6 bg-[#101018]/60 px-5 py-4 shadow-[0_20px_45px_rgba(0,0,0,0.65)] opacity-70"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-gradient-to-br from-[#20140a] via-[#141822] to-[#102018] shadow-inner">
                      <span className="text-2xl">
                        {path.emoji ?? (path.slug?.includes('trading') ? '📈' : '📘')}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base md:text-lg font-semibold text-white/80">
                          {path.name}
                        </h2>
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          Próximamente
                        </span>
                      </div>

                      {path.short_description && (
                        <p className="mt-1 text-xs md:text-sm leading-relaxed text-neutral-400 line-clamp-3">
                          {path.short_description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-neutral-500/50" />
                          En desarrollo
                        </span>
                      </div>
                    </div>

                    <div className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-neutral-500">
                      🔒
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      </div>
    </main>
  )
}
