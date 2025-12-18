// components/lesson/LessonSidebarBasic.tsx
'use client'

import Link from 'next/link'
import NotesPanel from '@/components/lesson/NotesPanel'

type LessonItem = {
  id: string
  slug: string
  title: string
  order_index: number
}

type LessonSidebarBasicProps = {
  courseSlug: string
  courseTitle: string
  currentLessonId: string
  lessons: LessonItem[]
  lessonIdForNotes: string
}

export function LessonSidebarBasic({
  courseSlug,
  courseTitle,
  currentLessonId,
  lessons,
  lessonIdForNotes,
}: LessonSidebarBasicProps) {
  return (
    <aside className="hidden h-fit flex-col border border-[rgba(250,244,237,0.1)] bg-[rgba(38,36,33,0.96)] p-4 text-xs text-[#D7D3CE] shadow-[0_16px_40px_rgba(0,0,0,0.4)] md:flex rounded-2xl sticky top-4">
      {/* Volver al curso */}
      <div className="mb-4 space-y-1">
        <Link
          href={`/cursos/${courseSlug}`}
          className="inline-flex items-center gap-1 text-[11px] text-[#F7931A]/90 hover:text-[#F7931A]"
        >
          <span aria-hidden>←</span>
          <span>Volver al curso</span>
        </Link>
        <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-[#FAF4ED]">
          {courseTitle}
        </h2>
      </div>

      {/* Lista de lecciones */}
      <div className="mb-3 border-t border-[rgba(250,244,237,0.08)] pt-3 text-[11px] uppercase tracking-[0.18em] text-[#6F665C]">
        Lecciones
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-1 max-h-[40vh]">
        {lessons.map((lesson) => {
          const isCurrent = lesson.id === currentLessonId

          const baseClasses =
            'flex items-center justify-between rounded-lg px-3 py-1.5 text-[11px] transition-colors'
          const visualClasses = isCurrent
            ? 'border border-[#F7931A]/70 bg-[#F7931A]/15 text-[#F7931A]'
            : 'border border-[rgba(250,244,237,0.1)] bg-[#2C2A28] text-[#D7D3CE] hover:border-[#F7931A]/50 hover:bg-[#3A3835]'

          return (
            <Link
              key={lesson.id}
              href={`/cursos/${courseSlug}/${lesson.slug}`}
              className={baseClasses + ' ' + visualClasses}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#6F665C]/70 text-[9px]">
                  {isCurrent ? '●' : lesson.order_index}
                </span>
                <span className="flex-1 truncate">
                  {lesson.title}
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Notas */}
      <div className="mt-4 border-t border-[rgba(250,244,237,0.08)] pt-3">
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[#6F665C]">
          Notas
        </p>
        <NotesPanel lessonId={lessonIdForNotes} />
      </div>
    </aside>
  )
}
