'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
}

interface CreateReferralLinkFormProps {
  courses: Course[]
}

export default function CreateReferralLinkForm({ courses }: CreateReferralLinkFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [formData, setFormData] = useState({
    course_id: '',
    custom_slug: '',
    utm_medium: '',
    utm_campaign: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/instructor/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: formData.course_id || null,
          custom_slug: formData.custom_slug.trim() || null,
          utm_medium: formData.utm_medium.trim() || null,
          utm_campaign: formData.utm_campaign.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear enlace')
      }

      router.push('/dashboard/instructor/referidos')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const utmMediumOptions = [
    { value: '', label: 'Sin especificar' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'email', label: 'Email' },
    { value: 'blog', label: 'Blog' },
    { value: 'other', label: 'Otro' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Curso */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Curso (opcional)
        </label>
        <p className="text-xs text-white/50 mb-2">
          Si no seleccionas un curso, el enlace llevará a tu página de cursos
        </p>
        <select
          value={formData.course_id}
          onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                     text-white text-sm focus:outline-none focus:border-[#f7931a] transition"
        >
          <option value="">Todos mis cursos</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* UTM Medium */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Canal de promoción
        </label>
        <p className="text-xs text-white/50 mb-2">
          ¿Dónde compartirás este enlace? Esto te ayudará a medir qué canales funcionan mejor
        </p>
        <select
          value={formData.utm_medium}
          onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                     text-white text-sm focus:outline-none focus:border-[#f7931a] transition"
        >
          {utmMediumOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Opciones avanzadas */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
        >
          <span>Opciones avanzadas</span>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-white/10">
            {/* Custom slug */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Slug personalizado
              </label>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-sm">/r/</span>
                <input
                  type="text"
                  value={formData.custom_slug}
                  onChange={(e) => setFormData({
                    ...formData,
                    custom_slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                  })}
                  placeholder="mi-enlace"
                  maxLength={30}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                             text-white text-sm font-mono focus:outline-none focus:border-[#f7931a] transition"
                />
              </div>
              <p className="text-xs text-white/40 mt-1">
                Solo letras, números, guiones y guiones bajos. Deja vacío para código aleatorio.
              </p>
            </div>

            {/* UTM Campaign */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nombre de campaña (utm_campaign)
              </label>
              <input
                type="text"
                value={formData.utm_campaign}
                onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                placeholder="ej: lanzamiento-enero-2026"
                maxLength={100}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                           text-white text-sm focus:outline-none focus:border-[#f7931a] transition"
              />
            </div>

            {/* Info UTM */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-400/80">
                  Los parámetros UTM se añadirán automáticamente a la URL de destino para
                  tracking en Google Analytics y otras herramientas.
                </p>
              </div>
            </div>
          </div>
        )}
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
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3
                   bg-gradient-to-r from-[#ff6b35] to-[#f7931a]
                   rounded-xl font-medium text-white transition-opacity
                   hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creando...
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Crear Enlace de Referido
          </>
        )}
      </button>
    </form>
  )
}
