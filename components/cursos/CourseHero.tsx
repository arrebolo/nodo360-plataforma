import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Clock, GraduationCap } from "lucide-react"

export function CourseHero({
  title,
  description,
  level,
  isFree,
  isEnrolled,
  progress,
  lessonsCompleted,
  lessonsTotal,
  continueHref,
  certificateHref,
  isCompleted,
}: {
  title: string
  description: string
  level?: string | null
  isFree?: boolean
  isEnrolled?: boolean
  progress?: number
  lessonsCompleted?: number
  lessonsTotal?: number
  continueHref?: string
  certificateHref?: string
  isCompleted?: boolean
}) {
  const pct = Math.max(0, Math.min(100, Math.round(progress ?? 0)))

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="grid lg:grid-cols-5">
        <div className="lg:col-span-3 p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
            {level ? (
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-white/70 capitalize">
                {level}
              </span>
            ) : null}
            {isFree ? (
              <span className="px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-300">
                100% gratis
              </span>
            ) : null}
            {isEnrolled ? (
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-white/70">
                Inscrito
              </span>
            ) : null}
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight">
            {title}
          </h1>

          <p className="mt-3 text-white/70 leading-relaxed max-w-2xl">
            {description}
          </p>

          {isEnrolled ? (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-white/55 mb-2">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Progreso
                </span>
                <span>{pct}%</span>
              </div>

              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a]"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {typeof lessonsCompleted === "number" && typeof lessonsTotal === "number" ? (
                <p className="mt-2 text-xs text-white/50">
                  {lessonsCompleted} de {lessonsTotal} lecciones completadas
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-white/10 p-8 bg-black/20">
          <div className="space-y-3">
            {isCompleted && certificateHref ? (
              <Link
                href={certificateHref}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                Ver certificado
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : continueHref ? (
              <Link
                href={continueHref}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                Continuar curso
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/70">
                <BookOpen className="h-4 w-4" />
                Selecciona una lección
              </span>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs text-white/55">
                  <GraduationCap className="h-4 w-4" />
                  Nivel
                </div>
                <div className="mt-1 text-sm font-semibold text-white capitalize">
                  {level || "básico"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs text-white/55">
                  <Clock className="h-4 w-4" />
                  Lecciones
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {typeof lessonsTotal === "number" ? lessonsTotal : "-"}
                </div>
              </div>
            </div>

            <p className="text-xs text-white/45 leading-relaxed pt-1">
              Diseño neutro para aprendizaje. El naranja se reserva para acciones clave.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
