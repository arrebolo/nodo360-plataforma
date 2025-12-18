'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Check, X, Award, BookOpen, Loader2, AlertTriangle } from 'lucide-react'

interface Enrollment {
  id: string
  course_id: string
  course: {
    id: string
    title: string
    slug: string
    thumbnail_url: string | null
  }
  totalLessons: number
  completedLessons: number
  hasCertificate: boolean
  certificateNumber: string | null
}

interface ResetCoursesClientProps {
  userId: string
  enrollments: Enrollment[]
}

interface ResetResult {
  courseId: string
  courseTitle: string
  success: boolean
  deletedProgress: number
  xpRemoved: number
  certificateDeleted: boolean
  error?: string
}

export function ResetCoursesClient({ userId, enrollments }: ResetCoursesClientProps) {
  const router = useRouter()
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [deleteCertificates, setDeleteCertificates] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ResetResult[]>([])
  const [showResults, setShowResults] = useState(false)

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const selectAll = () => {
    setSelectedCourses(enrollments.map(e => e.course_id))
  }

  const deselectAll = () => {
    setSelectedCourses([])
  }

  const handleReset = async () => {
    if (selectedCourses.length === 0) return

    const confirmMessage = deleteCertificates
      ? `¿Estás seguro de reiniciar ${selectedCourses.length} curso(s) Y ELIMINAR sus certificados? Esta acción es IRREVERSIBLE.`
      : `¿Estás seguro de reiniciar ${selectedCourses.length} curso(s)? Esta acción es IRREVERSIBLE.`

    if (!confirm(confirmMessage)) return

    setIsLoading(true)
    setResults([])

    const newResults: ResetResult[] = []

    for (const courseId of selectedCourses) {
      const enrollment = enrollments.find(e => e.course_id === courseId)
      const courseTitle = enrollment?.course?.title || 'Curso'

      try {
        const response = await fetch('/api/admin/reset-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            course_id: courseId,
            delete_certificate: deleteCertificates
          })
        })

        const data = await response.json()

        if (response.ok) {
          newResults.push({
            courseId,
            courseTitle,
            success: true,
            deletedProgress: data.deleted_progress || 0,
            xpRemoved: data.xp_removed || 0,
            certificateDeleted: data.certificate_deleted || false
          })
        } else {
          newResults.push({
            courseId,
            courseTitle,
            success: false,
            deletedProgress: 0,
            xpRemoved: 0,
            certificateDeleted: false,
            error: data.error || 'Error desconocido'
          })
        }
      } catch (error) {
        newResults.push({
          courseId,
          courseTitle,
          success: false,
          deletedProgress: 0,
          xpRemoved: 0,
          certificateDeleted: false,
          error: 'Error de conexión'
        })
      }
    }

    setResults(newResults)
    setShowResults(true)
    setIsLoading(false)
    setSelectedCourses([])
    setConfirmChecked(false)

    // Refrescar después de mostrar resultados
    setTimeout(() => {
      router.refresh()
    }, 2000)
  }

  const selectedCount = selectedCourses.length
  const hasProgress = enrollments.some(e => e.completedLessons > 0)

  return (
    <div className="space-y-6">
      {/* Results Modal */}
      {showResults && results.length > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d24] rounded-xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Resultados</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.courseId}
                  className={`p-3 rounded-lg ${
                    result.success
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                        {result.courseTitle}
                      </p>
                      {result.success ? (
                        <p className="text-sm text-gray-400">
                          {result.deletedProgress} lecciones, -{result.xpRemoved} XP
                          {result.certificateDeleted && ', certificado eliminado'}
                        </p>
                      ) : (
                        <p className="text-sm text-red-300">{result.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowResults(false)}
              className="w-full mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={selectAll}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Seleccionar todos
          </button>
          <button
            onClick={deselectAll}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Deseleccionar todos
          </button>
        </div>
        <span className="text-sm text-gray-400">
          {selectedCount} de {enrollments.length} seleccionados
        </span>
      </div>

      {/* Course Cards */}
      <div className="space-y-3">
        {enrollments.map((enrollment) => {
          const isSelected = selectedCourses.includes(enrollment.course_id)
          const progress = enrollment.totalLessons > 0
            ? Math.round((enrollment.completedLessons / enrollment.totalLessons) * 100)
            : 0

          return (
            <div
              key={enrollment.id}
              onClick={() => toggleCourse(enrollment.course_id)}
              className={`
                p-4 rounded-xl border cursor-pointer transition-all
                ${isSelected
                  ? 'bg-red-500/10 border-red-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
                }
              `}
            >
              <div className="flex items-center gap-4">
                {/* Checkbox */}
                <div className={`
                  w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected
                    ? 'bg-red-500 border-red-500'
                    : 'border-gray-500'
                  }
                `}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>

                {/* Thumbnail */}
                {enrollment.course.thumbnail_url ? (
                  <img
                    src={enrollment.course.thumbnail_url}
                    alt=""
                    className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-gray-500" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">
                    {enrollment.course.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      {enrollment.completedLessons} de {enrollment.totalLessons} lecciones ({progress}%)
                    </span>
                    {enrollment.hasCertificate && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Award className="w-4 h-4" />
                        Certificado
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress indicator */}
                {enrollment.completedLessons > 0 && (
                  <div className="w-20 flex-shrink-0">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${isSelected ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Options */}
      {selectedCount > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
          {/* Delete certificates toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={deleteCertificates}
              onChange={(e) => setDeleteCertificates(e.target.checked)}
              className="w-5 h-5 rounded border-gray-500 bg-white/10 text-red-500 focus:ring-red-500"
            />
            <div>
              <span className="text-white font-medium">También eliminar certificados</span>
              <p className="text-sm text-gray-400">
                Los certificados emitidos para estos cursos serán eliminados permanentemente
              </p>
            </div>
          </label>

          {/* Confirmation checkbox */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-red-500/10 rounded-lg border border-red-500/30">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              className="w-5 h-5 rounded border-red-500 bg-white/10 text-red-500 focus:ring-red-500"
            />
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">
                Entiendo que esta acción es irreversible
              </span>
            </div>
          </label>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={!confirmChecked || isLoading}
            className={`
              w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
              ${confirmChecked && !isLoading
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Reiniciando...
              </>
            ) : (
              <>
                <RotateCcw className="w-5 h-5" />
                Reiniciar {selectedCount} Curso{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty selection message */}
      {selectedCount === 0 && hasProgress && (
        <div className="text-center py-6 text-gray-400">
          Selecciona los cursos cuyo progreso deseas reiniciar
        </div>
      )}
    </div>
  )
}
