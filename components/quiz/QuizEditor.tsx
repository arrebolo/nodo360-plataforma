'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Quiz, Question } from '@/types/quiz'
import { QuestionEditor } from './QuestionEditor'
import { Plus, Save, Trash2, Settings, HelpCircle } from 'lucide-react'

interface QuizEditorProps {
  lessonId: string
  quiz?: Quiz | null
  onSave?: (quiz: Quiz) => void
  onDelete?: () => void
}

export function QuizEditor({ lessonId, quiz, onSave, onDelete }: QuizEditorProps) {
  const [isExpanded, setIsExpanded] = useState(!!quiz)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Quiz settings
  const [title, setTitle] = useState(quiz?.title || 'Quiz de la leccion')
  const [description, setDescription] = useState(quiz?.description || '')
  const [passingScore, setPassingScore] = useState(quiz?.passing_score || 70)
  const [maxAttempts, setMaxAttempts] = useState(quiz?.max_attempts || 3)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(quiz?.time_limit_minutes || 0)
  const [shuffleQuestions, setShuffleQuestions] = useState(quiz?.shuffle_questions ?? true)
  const [shuffleOptions, setShuffleOptions] = useState(quiz?.shuffle_options ?? true)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(quiz?.show_correct_answers ?? true)
  const [xpReward, setXpReward] = useState(quiz?.xp_reward || 50)
  const [isRequired, setIsRequired] = useState(quiz?.is_required ?? false)

  // Questions state
  const [questions, setQuestions] = useState<Question[]>(quiz?.questions || [])
  const [showSettings, setShowSettings] = useState(false)

  const handleSaveQuiz = useCallback(async () => {
    if (questions.length === 0) {
      setError('Debes agregar al menos una pregunta')
      return
    }

    setSaving(true)
    setError(null)
    const supabase = createClient()

    try {
      const quizData = {
        lesson_id: lessonId,
        title,
        description: description || null,
        passing_score: passingScore,
        max_attempts: maxAttempts,
        time_limit_minutes: timeLimitMinutes || null,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_correct_answers: showCorrectAnswers,
        xp_reward: xpReward,
        is_required: isRequired
      }

      let quizId = quiz?.id

      if (quizId) {
        // Update existing quiz
        const { error: updateError } = await (supabase as any)
          .from('quizzes')
          .update(quizData)
          .eq('id', quizId)

        if (updateError) throw updateError
      } else {
        // Create new quiz
        const { data: newQuiz, error: createError } = await (supabase as any)
          .from('quizzes')
          .insert(quizData)
          .select()
          .single()

        if (createError) throw createError
        quizId = newQuiz.id
      }

      // Handle questions
      // First delete removed questions
      if (quiz?.questions) {
        const currentIds = questions.filter(q => q.id && !q.id.startsWith('temp_')).map(q => q.id)
        const originalIds = quiz.questions.map(q => q.id)
        const deletedIds = originalIds.filter(id => !currentIds.includes(id))

        if (deletedIds.length > 0) {
          await (supabase as any)
            .from('quiz_questions')
            .delete()
            .in('id', deletedIds)
        }
      }

      // Save questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const questionData = {
          quiz_id: quizId,
          question_text: q.question_text,
          question_type: q.question_type,
          explanation: q.explanation || null,
          points: q.points,
          order_index: i
        }

        let questionId = q.id

        if (questionId && !questionId.startsWith('temp_')) {
          // Update existing question
          await (supabase as any)
            .from('quiz_questions')
            .update(questionData)
            .eq('id', questionId)
        } else {
          // Create new question
          const { data: newQuestion } = await (supabase as any)
            .from('quiz_questions')
            .insert(questionData)
            .select()
            .single()
          questionId = newQuestion.id
        }

        // Handle options for this question
        if (q.options) {
          // Delete existing options and recreate
          await (supabase as any)
            .from('quiz_options')
            .delete()
            .eq('question_id', questionId)

          // Create new options
          const optionsData = q.options.map((opt, optIndex) => ({
            question_id: questionId,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order_index: optIndex
          }))

          await (supabase as any)
            .from('quiz_options')
            .insert(optionsData)
        }
      }

      // Fetch updated quiz
      const { data: savedQuiz } = await (supabase as any)
        .from('quizzes')
        .select(`
          *,
          questions:quiz_questions(
            *,
            options:quiz_options(*)
          )
        `)
        .eq('id', quizId)
        .single()

      if (onSave && savedQuiz) {
        onSave(savedQuiz)
      }

    } catch (err) {
      console.error('[QuizEditor] Save error:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar el quiz')
    } finally {
      setSaving(false)
    }
  }, [lessonId, quiz, title, description, passingScore, maxAttempts, timeLimitMinutes, shuffleQuestions, shuffleOptions, showCorrectAnswers, xpReward, isRequired, questions, onSave])

  const handleDeleteQuiz = useCallback(async () => {
    if (!quiz?.id) return
    if (!confirm('¿Eliminar este quiz y todas sus preguntas?')) return

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await (supabase as any)
        .from('quizzes')
        .delete()
        .eq('id', quiz.id)

      if (error) throw error

      setIsExpanded(false)
      setQuestions([])
      if (onDelete) onDelete()
    } catch (err) {
      console.error('[QuizEditor] Delete error:', err)
      setError('Error al eliminar el quiz')
    } finally {
      setSaving(false)
    }
  }, [quiz, onDelete])

  const addQuestion = useCallback(() => {
    const newQuestion: Question = {
      id: `temp_${Date.now()}`,
      quiz_id: quiz?.id || '',
      question_text: '',
      question_type: 'single',
      points: 10,
      order_index: questions.length,
      options: [
        { id: `temp_opt_1`, question_id: '', option_text: '', is_correct: true, order_index: 0 },
        { id: `temp_opt_2`, question_id: '', option_text: '', is_correct: false, order_index: 1 }
      ]
    }
    setQuestions([...questions, newQuestion])
  }, [quiz, questions])

  const updateQuestion = useCallback((index: number, updated: Question) => {
    const newQuestions = [...questions]
    newQuestions[index] = updated
    setQuestions(newQuestions)
  }, [questions])

  const removeQuestion = useCallback((index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }, [questions])

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition flex items-center justify-center gap-2"
      >
        <HelpCircle className="w-5 h-5" />
        <span>Agregar Quiz a esta leccion</span>
      </button>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-brand-light" />
          <h3 className="font-semibold text-white">Quiz de la Leccion</h3>
          <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">
            {questions.length} pregunta{questions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition ${showSettings ? 'bg-brand-light/20 text-brand-light' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            title="Configuracion"
          >
            <Settings className="w-4 h-4" />
          </button>
          {quiz?.id && (
            <button
              type="button"
              onClick={handleDeleteQuiz}
              className="p-2 text-white/60 hover:text-error hover:bg-error/20 rounded-lg transition"
              title="Eliminar quiz"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-4 border-b border-white/10 bg-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-white/60 mb-1">Titulo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Puntaje para aprobar (%)</label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              min={0}
              max={100}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Max intentos</label>
            <input
              type="number"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              min={1}
              max={10}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">XP Recompensa</label>
            <input
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Limite tiempo (min)</label>
            <input
              type="number"
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
              min={0}
              placeholder="0 = sin limite"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shuffle_questions"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-light"
            />
            <label htmlFor="shuffle_questions" className="text-sm text-white/80">
              Mezclar preguntas
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shuffle_options"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-light"
            />
            <label htmlFor="shuffle_options" className="text-sm text-white/80">
              Mezclar opciones
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_required"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-light"
            />
            <label htmlFor="is_required" className="text-sm text-white/80">
              Requerido para avanzar
            </label>
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="p-4 space-y-4">
        {questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={index}
            onChange={(updated) => updateQuestion(index, updated)}
            onRemove={() => removeQuestion(index)}
          />
        ))}

        {/* Add question button */}
        <button
          type="button"
          onClick={addQuestion}
          className="w-full p-3 border border-dashed border-white/20 rounded-lg text-white/60 hover:text-white hover:border-white/40 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar pregunta</span>
        </button>

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSaveQuiz}
          disabled={saving || questions.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-brand-light/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Quiz'}
        </button>
      </div>
    </div>
  )
}
