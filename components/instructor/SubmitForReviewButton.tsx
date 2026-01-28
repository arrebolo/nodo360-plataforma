'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SubmitForReviewButtonProps {
  courseId: string
  currentStatus: string
}

export function SubmitForReviewButton({ courseId, currentStatus }: SubmitForReviewButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/submit-review`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error
        throw new Error(errorMsg || 'Error al enviar a revisión')
      }

      router.refresh()
      setShowConfirm(false)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al enviar a revisión')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/60">¿Enviar a revisión?</span>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-3 py-1.5 bg-brand-light text-white text-sm font-medium rounded-lg hover:bg-brand transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Sí, enviar'
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isSubmitting}
          className="px-3 py-1.5 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20 transition"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-light/20 border border-brand-light/30 text-brand-light font-semibold rounded-xl hover:bg-brand-light/30 transition"
    >
      <Send className="w-4 h-4" />
      {currentStatus === 'rejected' ? 'Reenviar a revisión' : 'Enviar a revisión'}
    </button>
  )
}
