'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, ChevronDown, ChevronRight, BookOpen, Folder, FileText, Video, HelpCircle, Loader2 } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  slug: string
  video_url: string | null
  video_duration_minutes: number | null
  order_index: number
  is_free_preview: boolean | null
}

interface Module {
  id: string
  title: string
  order_index: number
  lessons: Lesson[]
}

interface CourseOutlineData {
  id: string
  title: string
  slug: string
  status: string
  modules: Module[]
}

interface CourseOutlineModalProps {
  courseId: string
  isOpen: boolean
  onClose: () => void
}

function getLessonIcon(lesson: Lesson) {
  if (lesson.video_url) {
    return <Video className="w-4 h-4 text-red-400" />
  }
  return <FileText className="w-4 h-4 text-blue-400" />
}

function getLessonTypeLabel(lesson: Lesson) {
  if (lesson.video_url) {
    return 'Video'
  }
  return 'Texto'
}

function ModuleItem({ module, defaultOpen = false }: { module: Module; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-white/60 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/60 shrink-0" />
        )}
        <Folder className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-white font-medium truncate block">
            {module.order_index + 1}. {module.title}
          </span>
          <span className="text-xs text-white/50">
            {module.lessons.length} {module.lessons.length === 1 ? 'lección' : 'lecciones'}
          </span>
        </div>
      </button>

      {isOpen && module.lessons.length > 0 && (
        <div className="border-t border-white/10 bg-white/[0.02]">
          {module.lessons
            .sort((a, b) => a.order_index - b.order_index)
            .map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center gap-3 px-4 py-2.5 pl-12 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
              >
                {getLessonIcon(lesson)}
                <div className="flex-1 min-w-0">
                  <span className="text-white/90 text-sm truncate block">
                    {lesson.order_index + 1}. {lesson.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lesson.is_free_preview && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                      Gratis
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">
                    {getLessonTypeLabel(lesson)}
                  </span>
                  {lesson.video_duration_minutes && (
                    <span className="text-xs text-white/40">
                      {lesson.video_duration_minutes} min
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {isOpen && module.lessons.length === 0 && (
        <div className="border-t border-white/10 p-4 text-center">
          <span className="text-white/40 text-sm">Sin lecciones</span>
        </div>
      )}
    </div>
  )
}

export function CourseOutlineModal({
  courseId,
  isOpen,
  onClose,
}: CourseOutlineModalProps) {
  const [course, setCourse] = useState<CourseOutlineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Fetch course data
  useEffect(() => {
    if (!isOpen || !courseId) return

    const fetchCourse = async () => {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const { data, error: queryError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          slug,
          status,
          modules (
            id,
            title,
            order_index,
            lessons (
              id,
              title,
              slug,
              video_url,
              video_duration_minutes,
              order_index,
              is_free_preview
            )
          )
        `)
        .eq('id', courseId)
        .single()

      if (queryError || !data) {
        setError('No se pudo cargar el esquema del curso')
        setLoading(false)
        return
      }

      // Sort modules by order_index
      const sortedModules = (data.modules || []).sort(
        (a: Module, b: Module) => a.order_index - b.order_index
      )

      setCourse({
        ...data,
        modules: sortedModules,
      })
      setLoading(false)
    }

    fetchCourse()
  }, [isOpen, courseId])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const totalLessons = course?.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  ) || 0

  const totalDuration = course?.modules.reduce(
    (acc, module) =>
      acc +
      module.lessons.reduce(
        (lessonAcc, lesson) => lessonAcc + (lesson.video_duration_minutes || 0),
        0
      ),
    0
  ) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[85vh] mx-4 animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col"
      >
        <div className="rounded-xl bg-[#0a0f1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-5 border-b border-white/10 shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-light to-brand flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-white truncate">
                  {loading ? 'Cargando...' : course?.title || 'Esquema del Curso'}
                </h2>
                {course && (
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
                    <span>{course.modules.length} módulos</span>
                    <span>·</span>
                    <span>{totalLessons} lecciones</span>
                    {totalDuration > 0 && (
                      <>
                        <span>·</span>
                        <span>{totalDuration} min total</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : course ? (
              <div className="space-y-3">
                {course.modules.length > 0 ? (
                  course.modules.map((module, index) => (
                    <ModuleItem
                      key={module.id}
                      module={module}
                      defaultOpen={index === 0}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 border border-white/10 rounded-lg bg-white/5">
                    <Folder className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60">Este curso no tiene módulos todavía</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-white/50">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Texto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-red-400" />
                  <span>Video</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Quiz</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to manage the modal state
export function useCourseOutline() {
  const [isOpen, setIsOpen] = useState(false)
  const [courseId, setCourseId] = useState<string | null>(null)

  const openOutline = (id: string) => {
    setCourseId(id)
    setIsOpen(true)
  }

  const closeOutline = () => {
    setIsOpen(false)
    setCourseId(null)
  }

  return {
    isOpen,
    courseId,
    openOutline,
    closeOutline,
  }
}
