'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, Trash2 } from 'lucide-react'

const emojis = [
  '🏆', '⭐', '🎯', '🔥', '💎', '👑', '🚀', '⚡',
  '🎓', '📚', '💪', '🌟', '✨', '🎉', '🏅', '🎖️',
  '💡', '🎨', '🔧', '🛠️', '⚙️', '🎭', '🎪', '🎬'
]

const rarityColors = {
  common: 'bg-white/50/20 text-white/60 border-white/30/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
}

interface Badge {
  id: string
  title: string
  slug: string
  description: string | null
  icon: string
  category: string
  rarity: string
  requirement_type: string | null
  requirement_value: number | null
  is_active: boolean
  userCount: number
}

export default function EditBadgeForm({ badge }: { badge: Badge }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    title: badge.title,
    slug: badge.slug,
    description: badge.description || '',
    icon: badge.icon,
    category: badge.category,
    rarity: badge.rarity,
    requirement_type: badge.requirement_type || 'lessons_completed',
    requirement_value: badge.requirement_value || 1,
    is_active: badge.is_active
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? parseInt(value)
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value
    }))

    // Auto-generar slug desde el título
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/badges/${badge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar hito')
      }

      router.push('/admin/gamificacion/hitos')
      router.refresh()
    } catch (err: any) {
      console.error('Error al actualizar hito:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/badges/${badge.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar hito')
      }

      router.push('/admin/gamificacion/hitos')
      router.refresh()
    } catch (err: any) {
      console.error('Error al eliminar hito:', err)
      setError(err.message)
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Información Básica
              </h2>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-light"
                  placeholder="Ej: Primer Paso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-light"
                  placeholder="primer-paso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-light resize-none"
                  placeholder="Describe qué significa este hito..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Icono
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, icon: emoji }))
                      }
                      className={`p-3 text-2xl rounded-lg transition-all ${
                        formData.icon === emoji
                          ? 'bg-brand-light scale-110'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Categoría y Rareza */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Clasificación
              </h2>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Categoría
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-surface border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-light"
                >
                  <option value="achievement" className="bg-dark-surface text-white">Logro</option>
                  <option value="milestone" className="bg-dark-surface text-white">Hito</option>
                  <option value="special" className="bg-dark-surface text-white">Especial</option>
                  <option value="seasonal" className="bg-dark-surface text-white">Temporada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Rareza
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(rarityColors).map(([rarity, classes]) => (
                    <button
                      key={rarity}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, rarity }))
                      }
                      className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                        formData.rarity === rarity
                          ? classes + ' ring-2 ring-white/30'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {rarity}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Requisitos */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Requisitos
              </h2>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Tipo de Requisito
                </label>
                <select
                  name="requirement_type"
                  value={formData.requirement_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-surface border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-light"
                >
                  <option value="lessons_completed" className="bg-dark-surface text-white">Lecciones Completadas</option>
                  <option value="courses_completed" className="bg-dark-surface text-white">Cursos Completados</option>
                  <option value="total_xp" className="bg-dark-surface text-white">XP Total</option>
                  <option value="level_reached" className="bg-dark-surface text-white">Nivel Alcanzado</option>
                  <option value="streak_days" className="bg-dark-surface text-white">Días de Racha</option>
                  <option value="badges_earned" className="bg-dark-surface text-white">Hitos Obtenidos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Valor Requerido
                </label>
                <input
                  type="number"
                  name="requirement_value"
                  value={formData.requirement_value}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>
            </div>

            {/* Estado */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked
                    }))
                  }
                  className="w-5 h-5 rounded bg-white/5 border-white/10 text-brand-light focus:ring-2 focus:ring-brand-light"
                />
                <div>
                  <p className="text-white font-medium">Hito Activo</p>
                  <p className="text-sm text-white/60">
                    Los usuarios pueden desbloquear este hito
                  </p>
                </div>
              </label>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-light hover:bg-brand-light disabled:bg-white/50 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
                >
                  <Save size={20} />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <Link
                  href="/admin/gamificacion/hitos"
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white font-medium"
                >
                  Cancelar
                </Link>
              </div>

              {badge.userCount === 0 && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors text-red-400 font-medium"
                >
                  <Trash2 size={20} />
                  Eliminar
                </button>
              )}
            </div>

            {badge.userCount > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-sm text-yellow-400">
                  ⚠️ Este hito no puede eliminarse porque {badge.userCount}{' '}
                  usuario{badge.userCount > 1 ? 's' : ''} ya lo{' '}
                  {badge.userCount > 1 ? 'han' : 'ha'} desbloqueado. Puedes
                  desactivarlo si quieres que no aparezca en el sistema.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 sticky top-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Vista Previa
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 border border-white/10 text-center space-y-4">
              <div className="text-6xl">{formData.icon}</div>
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs border ${
                  rarityColors[formData.rarity as keyof typeof rarityColors]
                }`}
              >
                {formData.rarity}
              </div>
              <h3 className="text-xl font-bold text-white">{formData.title}</h3>
              <p className="text-sm text-white/60">
                {formData.description || 'Sin descripción'}
              </p>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/50 uppercase font-medium mb-1">
                  Requisito
                </p>
                <p className="text-sm text-white">
                  {formData.requirement_type?.replace(/_/g, ' ')}:{' '}
                  {formData.requirement_value}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-deep border border-red-500/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">
              ¿Eliminar Hito?
            </h3>
            <p className="text-white/80 mb-6">
              Esta acción no se puede deshacer. El hito "{badge.title}" será
              eliminado permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-white/50 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
              >
                <Trash2 size={20} />
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
