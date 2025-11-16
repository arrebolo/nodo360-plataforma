'use client'

import { useState } from 'react'
import type { QuizBlock as QuizBlockType } from '@/types/lesson-content'

interface QuizBlockProps {
  block: QuizBlockType
}

export function QuizBlock({ block }: QuizBlockProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  const handleOptionClick = (optionId: string) => {
    setSelectedOption(optionId)
    setShowExplanation(true)
  }

  const selectedAnswer = block.options.find((opt) => opt.id === selectedOption)
  const isCorrect = selectedAnswer?.correct || false

  return (
    <div className="my-8 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-1">Pregunta de autoevaluación</h4>
          <p className="text-gray-300">{block.question}</p>
        </div>
      </div>

      <div className="space-y-2">
        {block.options.map((option) => {
          const isSelected = selectedOption === option.id
          const showCorrect = showExplanation && option.correct
          const showIncorrect = showExplanation && isSelected && !option.correct

          return (
            <button
              key={option.id}
              onClick={() => !showExplanation && handleOptionClick(option.id)}
              disabled={showExplanation}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                showCorrect
                  ? 'bg-green-500/10 border-green-500 cursor-default'
                  : showIncorrect
                  ? 'bg-red-500/10 border-red-500 cursor-default'
                  : isSelected
                  ? 'bg-orange-500/10 border-orange-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  showCorrect
                    ? 'border-green-500 bg-green-500'
                    : showIncorrect
                    ? 'border-red-500 bg-red-500'
                    : isSelected
                    ? 'border-orange-500'
                    : 'border-gray-600'
                }`}>
                  {showCorrect && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {showIncorrect && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-300">{option.text}</span>
              </div>
            </button>
          )
        })}
      </div>

      {showExplanation && (
        <div className={`mt-4 p-4 rounded-lg ${
          isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          <div className="flex items-start gap-2">
            {isCorrect ? (
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <div>
              <p className={`font-semibold mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </p>
              {block.explanation && (
                <p className="text-gray-300 text-sm">{block.explanation}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
