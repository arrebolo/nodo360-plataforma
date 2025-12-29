import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Compass,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLearningPaths, getCoursesByLearningPathSlug } from '@/lib/db/learning-paths'
import { SelectPathButton } from '@/components/routes/SelectPathButton'

export const metadata: Metadata = {
  title: 'Rutas de Aprendizaje',
  description:
    'Elige tu ruta de aprendizaje personalizada. Desde Bitcoin hasta desarrollo Web3 avanzado.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RutasPage() {
  const supabase = await createClient()

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Active path
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

  // Paths + counts
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

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* HERO (gradiente sutil solo aquí) */}
      <section className="mb-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="pointer-events-none absolute inset-0">
            {/* Radial MUY sutil (educativo, no cripto-loud) */}
            <div className="absolute -top-24 left-1/2 h-72 w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,107,53,0.12),transparent_60%)]" />
          </div>

          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 p-4">
              <Compass className="h-7 w-7 text-white/80" />
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight">
              Elige tu{' '}
              <span className="bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
                Ruta de Aprendizaje
              </span>
            </h1>

            <p className="mt-3 text-white/70 max-w-2xl">
              Te guiamos paso a paso. Cambia de ruta cuando quieras.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/60">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <Sparkles className="h-4 w-4 text-white/70" />
                Rutas pensadas para usuarios españoles
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <BookOpen className="h-4 w-4 text-white/70" />
                Cursos cortos, prácticos y claros
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* GRID SECTION (fondo neutro, sin pelear con el layout global) */}
      <section className="rounded-3xl border border-white/10 bg-[#0b0f17]/60 p-6 md:p-7">
        {pathsWithCounts.length === 0 ? (
          <div className="n360-panel p-8 text-center">
            <p className="text-white/60">No hay rutas disponibles en este momento.</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Rutas disponibles</h2>
                <p className="text-sm text-white/55">
                  Elige una ruta. Puedes cambiarla cuando quieras.
                </p>
              </div>

              {!user ? (
                <Link
                  href="/login?redirect=/dashboard/rutas"
                  className="n360-btn-secondary px-4 py-2.5"
                >
                  Iniciar sesión
                </Link>
              ) : null}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pathsWithCounts.map((path) => (
                <div
                  key={path.id}
                  className={[
                    'relative h-full',
                    'rounded-3xl border border-white/10 bg-white/[0.04]',
                    'hover:border-white/20 hover:bg-white/[0.06] transition-all',
                    path.isActive ? 'border-[#ff6b35]/35 bg-[#ff6b35]/[0.06]' : '',
                  ].join(' ')}
                >
                  {/* Active badge */}
                  {path.isActive && (
                    <div className="absolute -top-3 left-5 px-3 py-1 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-xs font-semibold text-white flex items-center gap-1 border border-white/10">
                      <CheckCircle2 className="w-3 h-3" />
                      Tu ruta actual
                    </div>
                  )}

                  <div className="p-7 flex flex-col h-full">
                    {/* Header */}
                    <div className="mb-5 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                        {path.emoji || '📚'}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xl font-semibold text-white truncate">
                          {path.name}
                        </h3>
                        <p className="text-sm text-white/50">
                          {path.courseCount} cursos
                          {path.totalLessons > 0 ? ` · ${path.totalLessons} lecciones` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Educational hint (señal educativa) */}
                    <div className="mb-4">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-[#f7931a]/90">
                        {getEducationalHint(path.slug)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-white/70 text-sm leading-relaxed mb-6 line-clamp-3">
                      {path.short_description || 'Ruta de aprendizaje personalizada'}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-white/55 mb-6">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        {path.courseCount} cursos
                      </span>
                      {path.totalLessons > 0 && (
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4" />
                          {path.totalLessons} lecciones
                        </span>
                      )}
                    </div>

                    {/* Actions (más aire, CTA menos agresivo) */}
                    <div className="mt-auto flex gap-3">
                      <Link
                        href={`/dashboard/rutas/${path.slug}`}
                        className="flex-1 text-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/85 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        Ver detalles
                      </Link>

                      {user && !path.isActive && (
                        <div className="shrink-0">
                          {/* Deja tu componente, pero visualmente “soft”: el naranja entra por hover dentro del botón */}
                          <SelectPathButton pathSlug={path.slug} variant="small" label="Elegir" />
                        </div>
                      )}

                      {path.isActive && (
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
                        >
                          Continuar
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Login prompt (solo si no hay user) */}
            {!user && pathsWithCounts.length > 0 && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center">
                <p className="text-white/70 mb-4">
                  Inicia sesión para seleccionar tu ruta y guardar tu progreso.
                </p>
                <Link
                  href="/login?redirect=/dashboard/rutas"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-6 py-3 font-semibold text-white hover:opacity-90 transition-all"
                >
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
