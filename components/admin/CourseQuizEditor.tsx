'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface QuizQuestion {
  id?: string
  module_id: string
  question: string
  options: string[]
  correct_answer: number
  explanation?: string | null
  order_index: number
  difficulty?: string
  points?: number
}

interface Module {
  id: string
  title: string
  order_index: number
}

interface CourseQuizEditorProps {
  courseId: string
  courseName?: string
}

export function CourseQuizEditor({ courseId, courseName }: CourseQuizEditorProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  // Fetch questions and modules
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/quiz?courseId=${courseId}`)
        const json = await res.json()

        if (!res.ok) throw new Error(json.error || 'Error al cargar')

        setQuestions(json.questions || [])
        setModules(json.modules || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [courseId])

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  // Add new question
  const handleAddQuestion = useCallback(() => {
    if (modules.length === 0) {
      setError('El curso necesita al menos un modulo para agregar preguntas')
      return
    }

    const newQuestion: QuizQuestion = {
      module_id: modules[0].id,
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      order_index: questions.length,
      difficulty: 'medium',
      points: 1
    }
    setQuestions([...questions, newQuestion])
    setExpandedQuestion(questions.length)
  }, [modules, questions])

  // Update question field
  const handleUpdateQuestion = useCallback((index: number, field: keyof QuizQuestion, value: unknown) => {
    setQuestions(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  // Update option text
  const handleUpdateOption = useCallback((questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => {
      const updated = [...prev]
      const options = [...updated[questionIndex].options]
      options[optionIndex] = value
      updated[questionIndex] = { ...updated[questionIndex], options }
      return updated
    })
  }, [])

  // Delete question
  const handleDeleteQuestion = useCallback(async (index: number) => {
    const question = questions[index]

    if (!confirm('¿Eliminar esta pregunta?')) return

    if (question.id) {
      try {
        const res = await fetch(`/api/admin/quiz?id=${question.id}`, {
          method: 'DELETE'
        })
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error || 'Error al eliminar')
        }
        setSuccess('Pregunta eliminada')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar')
        return
      }
    }

    setQuestions(prev => prev.filter((_, i) => i !== index))
    if (expandedQuestion === index) setExpandedQuestion(null)
  }, [questions, expandedQuestion])

  // Save single question
  const handleSaveQuestion = useCallback(async (index: number) => {
    const question = questions[index]

    // Validation
    if (!question.question.trim()) {
      setError('La pregunta no puede estar vacia')
      return
    }

    const filledOptions = question.options.filter(opt => opt.trim())
    if (filledOptions.length < 2) {
      setError('Debe haber al menos 2 opciones con texto')
      return
    }

    if (!question.options[question.correct_answer]?.trim()) {
      setError('La respuesta correcta debe tener texto')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const method = question.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/quiz', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')

      // Update with server data (includes id for new questions)
      setQuestions(prev => {
        const updated = [...prev]
        updated[index] = json.data
        return updated
      })

      setSuccess('Pregunta guardada correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }, [questions])

  // Save all questions
  const handleSaveAll = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    let savedCount = 0
    let errorCount = 0

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      if (!question.question.trim()) continue

      try {
        const method = question.id ? 'PUT' : 'POST'
        const res = await fetch('/api/admin/quiz', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(question)
        })

        const json = await res.json()
        if (!res.ok) throw new Error(json.error)

        setQuestions(prev => {
          const updated = [...prev]
          updated[i] = json.data
          return updated
        })
        savedCount++
      } catch {
        errorCount++
      }
    }

    setIsSaving(false)

    if (errorCount > 0) {
      setError(`${errorCount} pregunta(s) no se pudieron guardar`)
    } else if (savedCount > 0) {
      setSuccess(`${savedCount} pregunta(s) guardadas`)
    }
  }, [questions])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-white/60">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Cargando quiz...
      </div>
    )
  }

  if (modules.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Sin modulos</h3>
        <p className="text-white/60 text-sm">
          Este curso necesita al menos un modulo para agregar preguntas de quiz.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-light" />
            Quiz Final del Curso
          </h2>
          {courseName && (
            <p className="text-sm text-white/50 mt-1">{courseName}</p>
          )}
          <p className="text-sm text-white/40 mt-1">
            {questions.length} pregunta{questions.length !== 1 ? 's' : ''} configuradas
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-light to-brand text-white font-medium rounded-lg hover:shadow-lg hover:shadow-brand-light/25 transition"
          >
            <Plus className="w-4 h-4" />
            Agregar pregunta
          </button>

          {questions.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-success/20 text-success border border-success/30 rounded-lg hover:bg-success/30 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar todo'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 bg-error/20 border border-error/30 text-error px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-success/20 border border-success/30 text-success px-4 py-3 rounded-lg">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Questions list */}
      {questions.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <HelpCircle className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin preguntas</h3>
          <p className="text-white/50 text-sm mb-6">
            Agrega preguntas para el quiz final del curso
          </p>
          <button
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-light/20 text-brand-light rounded-lg hover:bg-brand-light/30 transition"
          >
            <Plus className="w-4 h-4" />
            Agregar primera pregunta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => {
            const isExpanded = expandedQuestion === index
            const isNew = !question.id
            const moduleName = modules.find(m => m.id === question.module_id)?.title || 'Modulo'

            return (
              <div
                key={question.id || `new-${index}`}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                {/* Question header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setExpandedQuestion(isExpanded ? null : index)
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-light/20 text-brand-light text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">
                          {question.question || 'Nueva pregunta'}
                        </span>
                        {isNew && (
                          <span className="px-2 py-0.5 text-xs bg-warning/20 text-warning rounded">
                            sin guardar
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/40">{moduleName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteQuestion(index)
                      }}
                      className="p-2 text-white/40 hover:text-error transition"
                      title="Eliminar pregunta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-white/10 space-y-4">
                    {/* Module selector */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Modulo
                      </label>
                      <select
                        value={question.module_id}
                        onChange={(e) => handleUpdateQuestion(index, 'module_id', e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-light/50"
                      >
                        {modules.map(m => (
                          <option key={m.id} value={m.id} className="bg-dark">
                            {m.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Question text */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Pregunta *
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                        placeholder="Escribe la pregunta..."
                        className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-brand-light/50"
                        rows={2}
                      />
                    </div>

                    {/* Options */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Opciones * (selecciona la correcta)
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(index, 'correct_answer', optIndex)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                                question.correct_answer === optIndex
                                  ? 'border-success bg-success text-white'
                                  : 'border-white/30 hover:border-white/50'
                              }`}
                            >
                              {question.correct_answer === optIndex && (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleUpdateOption(index, optIndex, e.target.value)}
                              placeholder={`Opcion ${optIndex + 1}`}
                              className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-brand-light/50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Explicacion (opcional)
                      </label>
                      <textarea
                        value={question.explanation || ''}
                        onChange={(e) => handleUpdateQuestion(index, 'explanation', e.target.value)}
                        placeholder="Explica por que esta es la respuesta correcta..."
                        className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-brand-light/50"
                        rows={2}
                      />
                    </div>

                    {/* Difficulty and points */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Dificultad
                        </label>
                        <select
                          value={question.difficulty || 'medium'}
                          onChange={(e) => handleUpdateQuestion(index, 'difficulty', e.target.value)}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-light/50"
                        >
                          <option value="easy" className="bg-dark">Facil</option>
                          <option value="medium" className="bg-dark">Media</option>
                          <option value="hard" className="bg-dark">Dificil</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Puntos
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={question.points || 1}
                          onChange={(e) => handleUpdateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-light/50"
                        />
                      </div>
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveQuestion(index)}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-light to-brand text-white font-medium rounded-lg hover:shadow-lg transition disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Guardando...' : 'Guardar pregunta'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Help text */}
      {questions.length > 0 && (
        <div className="text-sm text-white/40 bg-white/5 border border-white/10 rounded-lg p-4">
          <strong className="text-white/60">Nota:</strong> Los usuarios veran todas las preguntas en el quiz final.
          El quiz se considera aprobado con 70% o mas de respuestas correctas.
        </div>
      )}
    </div>
  )
}

export default CourseQuizEditor
