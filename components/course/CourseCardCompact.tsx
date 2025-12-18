// components/course/CourseCardCompact.tsx
import Link from 'next/link'
import Image from 'next/image'

type CourseCardCompactProps = {
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
    total_lessons?: number | null
    duration_label?: string | null
  }
}

function getLevelBadge(level?: string | null, difficulty?: string | null) {
  const value = (difficulty || level || '').toLowerCase()

  if (value.includes('inter')) {
    return { text: 'Intermedio', color: 'bg-blue-500/90' }
  }
  if (value.includes('avan') || value.includes('adv')) {
    return { text: 'Avanzado', color: 'bg-purple-500/90' }
  }
  if (value.includes('bas') || value.includes('begin')) {
    return { text: 'Basico', color: 'bg-emerald-500/90' }
  }
  return null
}

export function CourseCardCompact({ course }: CourseCardCompactProps) {
  const levelBadge = getLevelBadge(course.level, course.difficulty_level)
  const isPremium = course.is_premium ?? !course.is_free
  const isFree = course.is_free && !isPremium
  const shortDesc = course.subtitle || course.description || ''

  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-[#18171c]/90 overflow-hidden shadow-lg hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Imagen 16:10 */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-amber-500/20 via-emerald-500/10 to-sky-500/10">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-40">📚</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {isFree && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-black">
              Gratis
            </span>
          )}
          {isPremium && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-black">
              Premium
            </span>
          )}
          {levelBadge && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${levelBadge.color}`}>
              {levelBadge.text}
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-semibold text-neutral-100 line-clamp-2 group-hover:text-amber-200 transition-colors">
          {course.title}
        </h3>

        {shortDesc && (
          <p className="mt-2 text-xs text-neutral-400 line-clamp-2 flex-1">
            {shortDesc}
          </p>
        )}

        {/* CTA */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-neutral-500">Empieza este curso</span>
          <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      </div>
    </Link>
  )
}
