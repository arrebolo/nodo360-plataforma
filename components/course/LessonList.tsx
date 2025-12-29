'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, Circle, Clock } from 'lucide-react'

interface Lesson {
  id: string
  slug: string
  title: string
  order_index: number
  video_duration_minutes: number
  is_free_preview: boolean
}

interface Module {
  id: string
  slug: string
  title: string
  description: string | null
  order_index: number
  lessons: Lesson[]
}

interface LessonListProps {
  courseSlug: string
  modules: Module[]
  isPremium: boolean

  /**
   * Opcional (recomendado): pásalo desde server con getCourseProgress.
   * Si no lo pasas, la lista mostrará “no completada” hasta refresh.
   */
  completedLessonSlugs?: string[]
}

export function LessonList({ courseSlug, modules, completedLessonSlugs = [] }: LessonListProps) {
  const router = useRouter()

  const completedSet = useMemo(() => new Set(completedLessonSlugs), [completedLessonSlugs])

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.order_index - b.order_index),
    [modules]
  )

  useEffect(() => {
    const onCompleted = () => {
      // Forzamos revalidación UI (server components / queries SSR)
      router.refresh()
    }

    window.addEventListener('lesson-completed', onCompleted)
    window.addEventListener('focus', onCompleted)

    return () => {
      window.removeEventListener('lesson-completed', onCompleted)
      window.removeEventListener('focus', onCompleted)
    }
  }, [router])

  return (
    <div className="space-y-4">
      {sortedModules.map((module, moduleIndex) => (
        <div
          key={module.id}
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
        >
          {/* Module Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                {module.description && <p className="text-white/60 text-sm">{module.description}</p>}
              </div>
              <div className="text-sm text-white/50">
                {module.lessons.length} lección{module.lessons.length !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>

          {/* Lessons */}
          <div className="divide-y divide-white/5">
            {[...module.lessons]
              .sort((a, b) => a.order_index - b.order_index)
              .map((lesson, lessonIndex) => {
                const isCompleted = completedSet.has(lesson.slug)

                return (
                  <Link
                    key={lesson.id}
                    href={`/cursos/${courseSlug}/${lesson.slug}`}
                    className="block p-4 bg-white/0 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Lesson Number */}
                      <div
                        className={`w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-medium transition-colors ${
                          isCompleted
                            ? 'border-green-500 text-green-500'
                            : 'text-white/50 group-hover:border-[#ff6b35] group-hover:text-[#ff6b35]'
                        }`}
                      >
                        {moduleIndex + 1}.{lessonIndex + 1}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1">
                        <h4
                          className={`font-medium transition-colors ${
                            isCompleted ? 'text-white/90' : 'text-white group-hover:text-[#ff6b35]'
                          }`}
                        >
                          {lesson.title}
                        </h4>

                        <div className="flex items-center gap-3 mt-1">
                          {lesson.video_duration_minutes > 0 && (
                            <p className="text-xs text-white/40 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.video_duration_minutes} min
                            </p>
                          )}

                          {lesson.is_free_preview && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#4caf50]/20 text-[#4caf50]">
                              Vista previa
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Icon */}
                      {isCompleted ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-green-500 font-medium">Completada</span>
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-white/30 group-hover:text-[#ff6b35] transition-colors" />
                      )}
                    </div>
                  </Link>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
