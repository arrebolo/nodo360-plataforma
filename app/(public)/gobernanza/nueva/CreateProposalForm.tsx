'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GovernanceCategory } from '@/types/governance'
import { Info, Send, FileText, Tag } from 'lucide-react'

interface CreateProposalFormProps {
  categories: GovernanceCategory[]
  canCreateLevel2: boolean
  userRole: string
}

export function CreateProposalForm({
  categories,
  canCreateLevel2,
  userRole
}: CreateProposalFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    detailed_content: '',
    category_id: '',
    proposal_level: 1,
    tags: '',
  })

  // Filtrar categorías según nivel seleccionado
  const filteredCategories = categories.filter(
    c => c.proposal_level === formData.proposal_level
  )

  const handleSubmit = async (e: React.FormEvent, submitType: 'draft' | 'review') => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validaciones
      if (!formData.title.trim()) {
        throw new Error('El título es requerido')
      }
      if (formData.title.length < 10) {
        throw new Error('El título debe tener al menos 10 caracteres')
      }
      if (!formData.description.trim()) {
        throw new Error('La descripción es requerida')
      }
      if (formData.description.length < 50) {
        throw new Error('La descripción debe tener al menos 50 caracteres')
      }
      if (!formData.category_id) {
        throw new Error('Selecciona una categoría')
      }

      const response = await fetch('/api/governance/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          status: submitType === 'review' ? 'pending_review' : 'draft',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear propuesta')
      }

      // Redirigir a la propuesta creada
      router.push(`/gobernanza/${result.data.slug}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCategory = categories.find(c => c.id === formData.category_id)

  return (
    <form className="space-y-6">
      {/* Selector de nivel (solo si puede crear nivel 2) */}
      {canCreateLevel2 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <label className="block text-sm font-medium text-white/80 mb-3">
            Nivel de Propuesta
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, proposal_level: 1, category_id: '' })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                formData.proposal_level === 1
                  ? 'border-brand-light bg-brand-light/10'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="font-semibold mb-1 text-white">Nivel 1</div>
              <div className="text-xs text-white/60">
                Sugerencias y mejoras menores
              </div>
              <div className="text-xs text-white/50 mt-2">
                Quorum: 10 votos - Aprobación: 60%
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, proposal_level: 2, category_id: '' })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                formData.proposal_level === 2
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="font-semibold mb-1 text-white">Nivel 2</div>
              <div className="text-xs text-white/60">
                Cambios importantes y nuevos cursos
              </div>
              <div className="text-xs text-white/50 mt-2">
                Quorum: 25 votos - Aprobación: 66%
              </div>
            </button>
          </div>

          {formData.proposal_level === 2 && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400">
              Las propuestas de Nivel 2 requieren validación del Consejo antes de pasar a votación.
            </div>
          )}
        </div>
      )}

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Título de la Propuesta *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ej: Agregar modo oscuro a la plataforma"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg
                     text-white placeholder-white/40
                     focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light"
          maxLength={100}
        />
        <p className="text-xs text-white/50 mt-1">
          {formData.title.length}/100 caracteres (mínimo 10)
        </p>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Categoría *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setFormData({ ...formData, category_id: category.id })}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                formData.category_id === category.id
                  ? 'border-brand-light bg-brand-light/10'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-xs font-medium text-white">{category.name}</div>
            </button>
          ))}
        </div>
        {filteredCategories.length === 0 && (
          <p className="text-white/50 text-sm mt-2">
            No hay categorías disponibles para este nivel.
          </p>
        )}
      </div>

      {/* Descripción corta */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Descripción Breve *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Resume tu propuesta en 2-3 oraciones. ¿Qué problema resuelve? ¿Qué beneficio trae?"
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg
                     text-white placeholder-white/40 resize-none
                     focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light"
          maxLength={500}
        />
        <p className="text-xs text-white/50 mt-1">
          {formData.description.length}/500 caracteres (mínimo 50)
        </p>
      </div>

      {/* Contenido detallado */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          <FileText className="inline w-4 h-4 mr-1" />
          Detalles (opcional)
        </label>
        <textarea
          value={formData.detailed_content}
          onChange={(e) => setFormData({ ...formData, detailed_content: e.target.value })}
          placeholder="Aquí puedes expandir tu propuesta con más detalles, ejemplos, referencias, etc."
          rows={6}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg
                     text-white placeholder-white/40 resize-none
                     focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          <Tag className="inline w-4 h-4 mr-1" />
          Etiquetas (opcional)
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="bitcoin, educación, mejora (separadas por comas)"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg
                     text-white placeholder-white/40
                     focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light"
        />
      </div>

      {/* Info box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/80">
            <p className="font-medium text-blue-400 mb-1">¿Cómo funciona?</p>
            <ol className="list-decimal list-inside space-y-1 text-white/60">
              <li>Creas tu propuesta (borrador o envío directo)</li>
              <li>Un {formData.proposal_level === 1 ? 'Mentor' : 'miembro del Consejo'} la revisa</li>
              <li>Si es aprobada, pasa a votación pública</li>
              <li>La comunidad vota durante 7 días</li>
              <li>Si alcanza quorum y mayoría, se implementa</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'draft')}
          disabled={isLoading}
          className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 rounded-lg font-medium
                     transition-colors disabled:opacity-50 text-white"
        >
          Guardar Borrador
        </button>

        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'review')}
          disabled={isLoading}
          className="flex-1 py-3 px-6 bg-brand-light hover:bg-brand-light/80 rounded-lg font-medium
                     transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-white"
        >
          <Send className="w-4 h-4" />
          {isLoading ? 'Enviando...' : 'Enviar a Revisión'}
        </button>
      </div>

      {/* Preview */}
      {(formData.title || formData.description) && (
        <div className="mt-8 pt-8 border-t border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">Vista Previa</h3>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              {selectedCategory && (
                <span className="text-sm bg-white/10 px-2 py-0.5 rounded text-white">
                  {selectedCategory.icon} {selectedCategory.name}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded ${
                formData.proposal_level === 2
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-white/50/20 text-white/60'
              }`}>
                Nivel {formData.proposal_level}
              </span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-white">
              {formData.title || 'Título de tu propuesta'}
            </h4>
            <p className="text-white/60">
              {formData.description || 'Tu descripción aparecerá aquí...'}
            </p>
            {formData.tags && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {formData.tags.split(',').map((tag, i) => (
                  tag.trim() && (
                    <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">
                      #{tag.trim()}
                    </span>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  )
}


