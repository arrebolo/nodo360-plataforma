'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'

interface XPConfig {
  lesson_completed: number
  course_completed: number
  streak_bonus: number
  quiz_passed: number
  perfect_score: number
  daily_login: number
}

export default function XPConfigForm({
  initialConfig
}: {
  initialConfig: XPConfig
}) {
  const [config, setConfig] = useState(initialConfig)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Simular guardado (en producción sería una llamada a API)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setMessage('✅ Configuración de XP guardada correctamente')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const xpItems = [
    {
      key: 'lesson_completed' as keyof XPConfig,
      label: 'Lección Completada',
      description: 'XP otorgado al completar una lección',
      icon: '📚'
    },
    {
      key: 'course_completed' as keyof XPConfig,
      label: 'Curso Completado',
      description: 'XP otorgado al completar un curso completo',
      icon: '🎓'
    },
    {
      key: 'quiz_passed' as keyof XPConfig,
      label: 'Quiz Aprobado',
      description: 'XP por aprobar un quiz',
      icon: '✅'
    },
    {
      key: 'perfect_score' as keyof XPConfig,
      label: 'Puntuación Perfecta',
      description: 'XP bonus por obtener 100% en un quiz',
      icon: '⭐'
    },
    {
      key: 'streak_bonus' as keyof XPConfig,
      label: 'Bonus de Racha',
      description: 'XP extra por día de racha consecutiva',
      icon: '🔥'
    },
    {
      key: 'daily_login' as keyof XPConfig,
      label: 'Login Diario',
      description: 'XP por iniciar sesión cada día',
      icon: '📅'
    }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.startsWith('✅')
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {xpItems.map((item) => (
          <div
            key={item.key}
            className="bg-white/5 rounded-lg p-4 border border-white/10"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-1">
                  {item.label}
                </label>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name={item.key}
                value={config[item.key]}
                onChange={handleChange}
                min="0"
                max="10000"
                required
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
              />
              <span className="text-yellow-400 font-medium">XP</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total XP Preview */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Vista Previa de Ganancias
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-400 mb-1">1 Lección</p>
            <p className="text-2xl font-bold text-yellow-400">
              {config.lesson_completed} XP
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">1 Curso (10 lecciones)</p>
            <p className="text-2xl font-bold text-yellow-400">
              {config.lesson_completed * 10 + config.course_completed} XP
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Racha de 7 días</p>
            <p className="text-2xl font-bold text-yellow-400">
              {config.daily_login * 7 + config.streak_bonus * 7} XP
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-[#ff6b35] hover:bg-[#ff8c5a] disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
        >
          <Save size={20} />
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  )
}
