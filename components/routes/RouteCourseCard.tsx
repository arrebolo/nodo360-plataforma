// components/routes/RouteCourseCard.tsx
import Link from 'next/link'
import Image from 'next/image'

type RouteCourseCardProps = {
  course: {
    id: string
    slug: string
    title: string
    subtitle?: string | null
    description?: string | null
    thumbnail_url?: string | null
    is_free: boolean
    is_premium?: boolean | null
    level?: string | null
    difficulty_level?: string | null
  }
  index?: number
}

function getDifficultyLabel(level?: string | null, difficulty?: string | null) {
  const value = (difficulty || level || '').toLowerCase()

  if (value.includes('inter')) return 'Intermedio'
  if (value.includes('avan')) return 'Avanzado'
  if (value.includes('bas') || value.includes('begin')) return 'Basico'

  return null
}

export function RouteCourseCard({ course, index }: RouteCourseCardProps) {
  const difficulty = getDifficultyLabel(course.level, course.difficulty_level)
  const isPremium = course.is_premium ?? !course.is_free
  const isFree = course.is_free && !isPremium

  const shortDescription =
    course.subtitle && course.subtitle.trim().length > 0
      ? course.subtitle
      : course.description ?? ''

  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="group block rounded-3xl border border-white/8 bg-[#111015]/95 px-5 pb-5 pt-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition hover:border-amber-500/60 hover:bg-[#141319]"
    >
      {/* Cabecera con titulo */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {typeof index === 'number' && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/60 bg-amber-500/10 text-xs font-semibold text-amber-200">
              {index}
            </span>
          )}
          <h3 className="text-base md:text-lg font-semibold text-neutral-50 group-hover:text-amber-100">
            {course.title}
          </h3>
        </div>
      </div>

      {/* Bloque de imagen */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-amber-500/20 via-emerald-500/10 to-sky-500/10">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            width={960}
            height={540}
            className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-amber-500/25 via-emerald-500/15 to-sky-500/25 flex items-center justify-center">
            <span className="text-4xl opacity-50">📚</span>
          </div>
        )}

        {/* Overlay oscuro ligero */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

        {/* Badges dentro de la imagen, arriba izquierda */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2 text-[11px]">
          {isFree && (
            <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 font-medium text-black">
              Gratis
            </span>
          )}
          {isPremium && (
            <span className="rounded-full bg-amber-500/90 px-2 py-0.5 font-medium text-black">
              Premium
            </span>
          )}
          {difficulty && (
            <span className="rounded-full bg-black/60 px-2 py-0.5 font-medium text-emerald-200 border border-emerald-400/40">
              {difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Descripcion corta debajo de la imagen */}
      {shortDescription && (
        <p className="mt-3 text-sm leading-relaxed text-neutral-300 line-clamp-3">
          {shortDescription}
        </p>
      )}

      {/* Flecha / CTA */}
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-emerald-400/80" />
          Empieza este curso
        </span>
        <span className="text-amber-300 group-hover:translate-x-0.5 transition-transform">
          →
        </span>
      </div>
    </Link>
  )
}
