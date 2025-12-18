// components/course/LessonLinkItem.tsx

import Link from 'next/link'
import { Lock, CheckCircle2, PlayCircle, Clock } from 'lucide-react'

interface LessonLinkItemProps {
  lesson: any
  lessonIndex: number
  courseSlug: string
  isModuleLocked: boolean
}

export function LessonLinkItem({
  lesson,
  lessonIndex,
  courseSlug,
  isModuleLocked,
}: LessonLinkItemProps) {
  const isCompleted = !!lesson.isCompleted
  const isUnlocked = !isModuleLocked && (lesson.isUnlocked ?? true)
  const isFreePreview = !!lesson.is_free_preview
  const duration = lesson.video_duration_minutes

  // HREF correcto SIEMPRE a la lección
  const href = `/cursos/${courseSlug}/${lesson.slug}`

  // Lección bloqueada (sin preview)
  if (!isUnlocked && !isFreePreview) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-white/40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
            <Lock className="h-3 w-3" />
          </div>
          <div>
            <p className="font-medium">
              Lección {lessonIndex + 1}: {lesson.title}
            </p>
            {duration && (
              <p className="text-[10px] text-white/40">{duration} min</p>
            )}
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px]">
          Bloqueada
        </span>
      </div>
    )
  }

  // Lección accesible (normal o free preview)
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:border-[#f8a94a] hover:bg-white/10"
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-[#f8a94a]/15 text-[#f8a94a]'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <PlayCircle className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="font-medium text-white">
            Lección {lessonIndex + 1}: {lesson.title}
          </p>
          <div className="mt-0.5 flex items-center gap-3 text-[10px] text-white/50">
            {duration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration} min
              </span>
            )}
            {isFreePreview && (
              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px]">
                Preview gratuita
              </span>
            )}
          </div>
        </div>
      </div>
      {isCompleted && (
        <span className="text-[10px] font-semibold text-emerald-400">
          Completada
        </span>
      )}
    </Link>
  )
}
