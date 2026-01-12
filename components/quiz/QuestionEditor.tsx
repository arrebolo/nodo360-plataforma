'use client'

import { useState, useCallback } from 'react'
import { Question, Option } from '@/types/quiz'
import { Trash2, Plus, GripVertical, ChevronDown, ChevronUp, Check } from 'lucide-react'

interface QuestionEditorProps {
  question: Question
  index: number
  onChange: (question: Question) => void
  onRemove: () => void
}

export function QuestionEditor({ question, index, onChange, onRemove }: QuestionEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const updateField = useCallback(<K extends keyof Question>(field: K, value: Question[K]) => {
    onChange({ ...question, [field]: value })
  }, [question, onChange])

  const addOption = useCallback(() => {
    const newOption: Option = {
      id: `temp_opt_${Date.now()}`,
      question_id: question.id,
      option_text: '',
      is_correct: false,
      order_index: (question.options?.length || 0)
    }
    onChange({
      ...question,
      options: [...(question.options || []), newOption]
    })
  }, [question, onChange])

  const updateOption = useCallback((optIndex: number, updated: Partial<Option>) => {
    const newOptions = [...(question.options || [])]
    newOptions[optIndex] = { ...newOptions[optIndex], ...updated }

    // If single choice and marking as correct, unmark others
    if (question.question_type === 'single' && updated.is_correct) {
      newOptions.forEach((opt, i) => {
        if (i !== optIndex) opt.is_correct = false
      })
    }

    onChange({ ...question, options: newOptions })
  }, [question, onChange])

  const removeOption = useCallback((optIndex: number) => {
    if ((question.options?.length || 0) <= 2) {
      return // Keep minimum 2 options
    }
    onChange({
      ...question,
      options: question.options?.filter((_, i) => i !== optIndex)
    })
  }, [question, onChange])

  const handleTypeChange = useCallback((type: Question['question_type']) => {
    let options = question.options || []
    const previousType = question.question_type

    // Adjust options for boolean type
    if (type === 'boolean') {
      options = [
        { id: `temp_opt_1`, question_id: question.id, option_text: 'Verdadero', is_correct: true, order_index: 0 },
        { id: `temp_opt_2`, question_id: question.id, option_text: 'Falso', is_correct: false, order_index: 1 }
      ]
    } else if (previousType === 'boolean') {
      // Coming from boolean, reset options
      options = [
        { id: `temp_opt_1`, question_id: question.id, option_text: '', is_correct: true, order_index: 0 },
        { id: `temp_opt_2`, question_id: question.id, option_text: '', is_correct: false, order_index: 1 }
      ]
    }

    // For single choice, ensure only one correct answer
    if (type === 'single') {
      let foundCorrect = false
      options = options.map(opt => {
        if (opt.is_correct && !foundCorrect) {
          foundCorrect = true
          return opt
        }
        return { ...opt, is_correct: false }
      })
      if (!foundCorrect && options.length > 0) {
        options[0].is_correct = true
      }
    }

    onChange({ ...question, question_type: type, options })
  }, [question, onChange])

  const correctCount = question.options?.filter(o => o.is_correct).length || 0

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Question header */}
      <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-white/5">
        <div className="text-white/40 cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white/60">
          Pregunta {index + 1}
        </span>
        <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
          {question.points} pts
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-white/60 hover:text-white transition"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-white/60 hover:text-error transition"
          title="Eliminar pregunta"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Question text */}
          <div>
            <label className="block text-xs text-white/60 mb-1">Texto de la pregunta</label>
            <textarea
              value={question.question_text}
              onChange={(e) => updateField('question_text', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none resize-none"
              placeholder="Escribe la pregunta..."
            />
          </div>

          {/* Question type and points */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1">Tipo de respuesta</label>
              <select
                value={question.question_type}
                onChange={(e) => handleTypeChange(e.target.value as Question['question_type'])}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none"
              >
                <option value="single">Opcion unica</option>
                <option value="multiple">Opcion multiple</option>
                <option value="boolean">Verdadero/Falso</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Puntos</label>
              <input
                type="number"
                value={question.points}
                onChange={(e) => updateField('points', Number(e.target.value))}
                min={1}
                max={100}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none"
              />
            </div>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/60">
                Opciones de respuesta
                {question.question_type === 'multiple' && (
                  <span className="ml-2 text-brand-light">
                    ({correctCount} correcta{correctCount !== 1 ? 's' : ''})
                  </span>
                )}
              </label>
              {question.question_type !== 'boolean' && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-brand-light hover:text-brand transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Agregar opcion
                </button>
              )}
            </div>

            <div className="space-y-2">
              {question.options?.map((option, optIndex) => (
                <div key={option.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateOption(optIndex, { is_correct: !option.is_correct })}
                    className={`p-2 rounded-lg border transition ${
                      option.is_correct
                        ? 'bg-success/20 border-success text-success'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                    }`}
                    title={option.is_correct ? 'Respuesta correcta' : 'Marcar como correcta'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={option.option_text}
                    onChange={(e) => updateOption(optIndex, { option_text: e.target.value })}
                    disabled={question.question_type === 'boolean'}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none disabled:opacity-50"
                    placeholder={`Opcion ${optIndex + 1}`}
                  />
                  {question.question_type !== 'boolean' && (question.options?.length || 0) > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(optIndex)}
                      className="p-2 text-white/40 hover:text-error transition"
                      title="Eliminar opcion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation (optional) */}
          <div>
            <label className="block text-xs text-white/60 mb-1">
              Explicacion (opcional)
            </label>
            <textarea
              value={question.explanation || ''}
              onChange={(e) => updateField('explanation', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-brand-light focus:outline-none resize-none"
              placeholder="Explicacion que se mostrara despues de responder..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
