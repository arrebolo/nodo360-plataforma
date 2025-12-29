import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, GraduationCap, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLearningPaths, getCoursesByLearningPathSlug } from '@/lib/db/learning-paths'
import { SelectPathButton } from '@/components/routes/SelectPathButton'
import { tw } from '@/lib/design-tokens'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: Promise<{ routeSlug: string }>
}): Promise<Metadata> {
  const { routeSlug } = await params
  return {
    title: `Ruta: ${routeSlug}`,
    description: 'Detalle de ruta de aprendizaje y cursos asociados.',
  }
}

export default async function RutaDetallePage({
  params,
}: {
  params: Promise<{ routeSlug: string }>
}) {
  const { routeSlug } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const paths = await getLearningPaths()
  const path = paths.find((p) => p.slug === routeSlug)
  if (!path) notFound()

  // Ruta activa del usuario
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

  const isActive = activePathId === path.id

  // Cursos de la ruta
  const courses = await getCoursesByLearningPathSlug(path.slug)
  const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || 0), 0)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      {/* Top */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/rutas"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a rutas
          </Link>
        </div>

        {user ? (
          isActive ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              Ir a mi dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <SelectPathButton pathSlug={path.slug} label="Elegir esta ruta" />
          )
        ) : (
          <Link
            href={`/login?redirect=/dashboard/rutas/${path.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
          >
            Iniciar sesión
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Header */}
      <div className={`${tw.card} p-8 mb-8`}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
            {path.emoji || '📚'}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              {path.name}
            </h1>
            <p className="mt-2 text-white/70 max-w-3xl">
              {path.short_description || path.long_description || 'Ruta de aprendizaje'}
            </p>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {courses.length} cursos
              </span>
              {totalLessons > 0 && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  {totalLessons} lecciones
                </span>
              )}
              {isActive && (
                <span className="rounded-full border border-[#ff6b35]/40 bg-[#ff6b35]/[0.06] px-3 py-1 text-xs font-semibold text-[#ff6b35]">
                  Tu ruta actual
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cursos */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white">Cursos de esta ruta</h2>
        <p className="text-sm text-white/50 mt-1">
          Recomendación: completa los cursos en orden para avanzar más rápido.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className={`${tw.card} p-8 text-center`}>
          <p className="text-white/60">Esta ruta todavía no tiene cursos asignados.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <div key={course.id} className={[tw.card, tw.cardHover, 'p-6'].join(' ')}>
              <h3 className="text-white font-semibold text-lg line-clamp-2">
                {course.title}
              </h3>
              <p className="mt-2 text-sm text-white/70 line-clamp-3">
                {course.subtitle || course.description || 'Curso de la ruta'}
              </p>

              <div className="mt-5 flex items-center justify-between text-sm text-white/50">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  {course.total_lessons || 0} lecciones
                </span>
              </div>

              <div className="mt-6">
                <Link
                  href={`/cursos/${course.slug}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all"
                >
                  Ver curso
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
