'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'

export function MentorApplicationForm() {
  const router = useRouter()
  const [motivation, setMotivation] = useState('')
  const [experience, setExperience] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const motivationValid = motivation.trim().length >= 50

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivationValid || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/mentor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivation: motivation.trim(),
          experience: experience.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al enviar la aplicación')
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard/mentor'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <Send className="w-7 h-7 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-green-400 mb-2">Aplicación enviada</h3>
        <p className="text-sm text-white/60">
          Tu solicitud ha sido recibida. Serás notificado cuando sea revisada.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Motivación */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Motivación <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-white/40 mb-2">
          Cuéntanos por qué quieres ser mentor y cómo ayudarías a la comunidad (mínimo 50 caracteres)
        </p>
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="Quiero ser mentor porque..."
          rows={5}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                     text-white placeholder-white/30 text-sm resize-none
                     focus:outline-none focus:border-brand-light transition-colors"
          maxLength={2000}
          required
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${motivationValid ? 'text-green-400' : 'text-white/40'}`}>
            {motivation.trim().length}/50 caracteres mínimo
          </span>
          <span className="text-xs text-white/30">
            {motivation.length}/2000
          </span>
        </div>
      </div>

      {/* Experiencia */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Experiencia <span className="text-white/40">(opcional)</span>
        </label>
        <p className="text-xs text-white/40 mb-2">
          Describe tu experiencia relevante: enseñanza, liderazgo, conocimientos técnicos, etc.
        </p>
        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="He trabajado como..."
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                     text-white placeholder-white/30 text-sm resize-none
                     focus:outline-none focus:border-brand-light transition-colors"
          maxLength={2000}
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-white/30">
            {experience.length}/2000
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!motivationValid || isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-brand-light hover:bg-brand-light/80
                   rounded-xl font-medium text-white transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar Aplicación
          </>
        )}
      </button>

      <p className="text-xs text-white/40 text-center">
        Tu aplicación será revisada por los mentores actuales mediante votación comunitaria.
      </p>
    </form>
  )
}
