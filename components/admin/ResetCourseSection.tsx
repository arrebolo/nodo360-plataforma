'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface EnrolledCourse {
  courseId: string
  title: string
  slug: string
  progressPercentage: number
  completedAt: string | null
  xpEarned: number
  lessonsCompleted: number
  totalLessons: number
  hasCertificate: boolean
}

interface ResetCourseSectionProps {
  userId: string
}

export function ResetCourseSection({ userId }: ResetCourseSectionProps) {
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [preserveNotes, setPreserveNotes] = useState(true)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Cargar cursos del usuario
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/courses`)
        if (res.ok) {
          const data = await res.json()
          setCourses(data.courses || [])
        }
      } catch (err) {
        console.error('Error cargando cursos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [userId])

  const selectedCourse = courses.find(c => c.courseId === selectedCourseId)

  const handleReset = async () => {
    if (!selectedCourseId) return

    setResetting(true)
    setResult(null)

    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          preserveNotes,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResult({
          type: 'success',
          message: `Curso reiniciado: ${data.lessonsReset} lecciones, -${data.xpDeducted} XP${data.certificateDeleted ? ', certificado eliminado' : ''}`,
        })
        // Actualizar lista de cursos
        setCourses(prev => prev.map(c =>
          c.courseId === selectedCourseId
            ? { ...c, progressPercentage: 0, xpEarned: 0, lessonsCompleted: 0, completedAt: null, hasCertificate: false }
            : c
        ))
        setSelectedCourseId('')
        setShowConfirm(false)
      } else {
        setResult({ type: 'error', message: data.error || 'Error al reiniciar' })
      }
    } catch (err) {
      setResult({ type: 'error', message: 'Error de conexion' })
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-warning" />
          Reiniciar Curso
        </h3>
        <p className="text-sm text-white/50 mt-1">
          Elimina el progreso, XP y certificados del usuario en un curso
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Selector de curso */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Seleccionar curso</label>
          {loading ? (
            <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/50 text-sm">
              Cargando cursos...
            </div>
          ) : courses.length === 0 ? (
            <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/50 text-sm">
              El usuario no esta inscrito en ningun curso
            </div>
          ) : (
            <select
              value={selectedCourseId}
              onChange={e => {
                setSelectedCourseId(e.target.value)
                setShowConfirm(false)
                setResult(null)
              }}
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-[#1a1f2e]">-- Seleccionar curso --</option>
              {courses.map(course => (
                <option key={course.courseId} value={course.courseId} className="bg-[#1a1f2e]">
                  {course.title} ({course.progressPercentage}%)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Info del curso seleccionado */}
        {selectedCourse && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{selectedCourse.title}</span>
              <div className="flex items-center gap-2">
                {selectedCourse.hasCertificate && (
                  <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs rounded">
                    Certificado
                  </span>
                )}
                {selectedCourse.completedAt && (
                  <span className="px-2 py-0.5 bg-success/20 text-success text-xs rounded">
                    Completado
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-white">{selectedCourse.progressPercentage}%</p>
                <p className="text-xs text-white/50">Progreso</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-white">{selectedCourse.lessonsCompleted}/{selectedCourse.totalLessons}</p>
                <p className="text-xs text-white/50">Lecciones</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-brand-light">{selectedCourse.xpEarned}</p>
                <p className="text-xs text-white/50">XP ganado</p>
              </div>
            </div>

            {/* Checkbox preservar notas */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preserveNotes}
                onChange={e => setPreserveNotes(e.target.checked)}
                className="w-4 h-4 rounded bg-white/10 border-white/20 text-brand-light focus:ring-brand-light"
              />
              <span className="text-sm text-white/70">Preservar notas del usuario</span>
            </label>

            {/* Warning */}
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-warning text-sm font-medium mb-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Esta accion eliminara:
              </p>
              <ul className="text-warning/80 text-xs space-y-0.5 ml-5 list-disc">
                <li>{selectedCourse.lessonsCompleted} lecciones completadas</li>
                <li>{selectedCourse.xpEarned} XP (se descontara del total)</li>
                <li>Intentos de quiz del curso</li>
                {selectedCourse.hasCertificate && <li>Certificado del curso</li>}
                {!preserveNotes && <li>Notas del usuario</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Mensaje de resultado */}
        {result && (
          <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
            result.type === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-error/10 text-error border border-error/20'
          }`}>
            {result.type === 'success' ? (
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            {result.message}
          </div>
        )}

        {/* Botones */}
        {selectedCourse && !showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-2.5 bg-warning/20 text-warning font-medium rounded-xl hover:bg-warning/30 transition"
          >
            Reiniciar Curso
          </button>
        )}

        {showConfirm && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={resetting}
              className="flex-1 py-2.5 bg-white/10 text-white/70 rounded-xl hover:bg-white/15 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex-1 py-2.5 bg-error text-white font-medium rounded-xl hover:bg-error/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resetting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reiniciando...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Confirmar Reset
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetCourseSection
