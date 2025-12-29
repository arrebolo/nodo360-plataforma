'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

const emojis = [
  '🏆', '⭐', '🎯', '🔥', '💎', '👑', '🚀', '⚡',
  '🎓', '📚', '💪', '🌟', '✨', '🎉', '🏅', '🎖️',
  '💡', '🎨', '🔧', '🛠️', '⚙️', '🎭', '🎪', '🎬'
]

const rarityColors = {
  common: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
}

export default function NuevoHitoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    icon: '🏆',
    category: 'logro',
    rarity: 'common',
    requirement_type: 'lessons_completed',
    requirement_value: 1,
    xp_reward: 50,
    is_active: true
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
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear hito')
      }

      router.push('/admin/gamificacion/hitos')
      router.refresh()
    } catch (err: any) {
      console.error('Error al crear hito:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/gamificacion/hitos"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Crear Nuevo Hito</h1>
          <p className="text-gray-400 mt-1">
            Define un nuevo logro para los usuarios
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Vista Previa */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
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
          <h3 className="text-xl font-bold text-white">
            {formData.title || 'Título del Hito'}
          </h3>
          <p className="text-sm text-gray-400">
            {formData.description || 'Descripción del hito...'}
          </p>
          <div className="pt-4 border-t border-white/10 space-y-2">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Requisito
              </p>
              <p className="text-sm text-white">
                {formData.requirement_type?.replace(/_/g, ' ')}:{' '}
                {formData.requirement_value}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Recompensa
              </p>
              <p className="text-sm text-white">
                {formData.xp_reward} XP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">
            Información Básica
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Título
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
              placeholder="Ej: Primer Paso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Slug (auto-generado)
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
              placeholder="primer-paso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35] resize-none"
              placeholder="Describe qué significa este hito..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
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
                      ? 'bg-[#ff6b35] scale-110'
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
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Categoría
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#1a1f2e] border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
            >
              <option value="logro" style={{backgroundColor: '#1a1f2e', color: 'white'}}>Logro</option>
              <option value="hito" style={{backgroundColor: '#1a1f2e', color: 'white'}}>Hito</option>
              <option value="especial" style={{backgroundColor: '#1a1f2e', color: 'white'}}>Especial</option>
              <option value="evento" style={{backgroundColor: '#1a1f2e', color: 'white'}}>Evento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
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
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
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
            Requisitos y Recompensa
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Tipo de Requisito
            </label>
            <select
              name="requirement_type"
              value={formData.requirement_type}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#1a1f2e] border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
            >
              <option value="lessons_completed" style={{backgroundColor: '#1a1f2e', color: 'white'}}>Lecciones Completadas</option>
              <option value="courses_completed" style={{backgroundColor: '#1a1f2e', color: 'white'}}>Cursos Completados</option>
              <option value="total_xp" style={{backgroundColor: '#1a1f2e', color: 'white'}}>XP Total</option>
              <option value="level_reached" style={{backgroundColor: '#1a1f2e', color: 'white'}}>Nivel Alcanzado</option>
              <option value="streak_days" style={{backgroundColor: '#1a1f2e', color: 'white'}}>Días de Racha</option>
              <option value="badges_earned" style={{backgroundColor: '#1a1f2e', color: 'white'}}>Hitos Obtenidos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Valor Requerido
            </label>
            <input
              type="number"
              name="requirement_value"
              value={formData.requirement_value}
              onChange={handleChange}
              min="1"
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Recompensa XP
            </label>
            <input
              type="number"
              name="xp_reward"
              value={formData.xp_reward}
              onChange={handleChange}
              min="0"
              step="10"
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
            />
            <p className="text-xs text-gray-500 mt-1">
              XP otorgado al desbloquear este hito
            </p>
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
              className="w-5 h-5 rounded bg-white/5 border-white/10 text-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]"
            />
            <div>
              <p className="text-white font-medium">Hito Activo</p>
              <p className="text-sm text-gray-400">
                Los usuarios pueden desbloquear este hito
              </p>
            </div>
          </label>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#ff6b35] hover:bg-[#ff8c5a] disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
          >
            <Save size={20} />
            {loading ? 'Creando...' : 'Crear Hito'}
          </button>
          <Link
            href="/admin/gamificacion/hitos"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
