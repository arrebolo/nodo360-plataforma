'use client'

import { useState, useMemo } from 'react'
import { Save, TrendingUp } from 'lucide-react'

interface LevelConfig {
  xp_base: number
  xp_multiplier: number
  max_level: number
}

export default function LevelConfigForm({
  initialConfig
}: {
  initialConfig: LevelConfig
}) {
  const [config, setConfig] = useState(initialConfig)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({
      ...prev,
      [name]: name === 'xp_multiplier' ? parseFloat(value) : parseInt(value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Simular guardado (en producción sería una llamada a API)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setMessage('✅ Configuración de niveles guardada correctamente')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  // Calcular XP requerido para niveles de ejemplo
  const levelExamples = useMemo(() => {
    const calculateXPForLevel = (level: number) => {
      // Fórmula: XP_base * (multiplier ^ (level - 1))
      return Math.floor(config.xp_base * Math.pow(config.xp_multiplier, level - 1))
    }

    return [1, 5, 10, 20, 50, 100].map((level) => ({
      level,
      xp: calculateXPForLevel(level),
      totalXP:
        level === 1
          ? 0
          : Array.from({ length: level - 1 }, (_, i) => calculateXPForLevel(i + 1)).reduce(
              (sum, xp) => sum + xp,
              0
            )
    }))
  }, [config.xp_base, config.xp_multiplier])

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* XP Base */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="mb-3">
            <label className="block text-sm font-medium text-white mb-1">
              XP Base (Nivel 1)
            </label>
            <p className="text-xs text-gray-400">
              XP requerido para alcanzar nivel 2
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="xp_base"
              value={config.xp_base}
              onChange={handleChange}
              min="10"
              max="1000"
              step="10"
              required
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
            />
            <span className="text-purple-400 font-medium">XP</span>
          </div>
        </div>

        {/* Multiplicador */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="mb-3">
            <label className="block text-sm font-medium text-white mb-1">
              Multiplicador
            </label>
            <p className="text-xs text-gray-400">
              Incremento de dificultad por nivel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="xp_multiplier"
              value={config.xp_multiplier}
              onChange={handleChange}
              min="1"
              max="3"
              step="0.1"
              required
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
            />
            <span className="text-blue-400 font-medium">×</span>
          </div>
        </div>

        {/* Nivel Máximo */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="mb-3">
            <label className="block text-sm font-medium text-white mb-1">
              Nivel Máximo
            </label>
            <p className="text-xs text-gray-400">Límite superior de niveles</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="max_level"
              value={config.max_level}
              onChange={handleChange}
              min="10"
              max="999"
              step="1"
              required
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
            />
            <TrendingUp className="text-emerald-400" size={20} />
          </div>
        </div>
      </div>

      {/* Fórmula Explicada */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-sm text-blue-400">
          <strong>Fórmula:</strong> XP_requerido = {config.xp_base} ×{' '}
          {config.xp_multiplier}
          <sup>(nivel - 1)</sup>
        </p>
        <p className="text-xs text-blue-300 mt-2">
          Esta fórmula exponencial hace que cada nivel sea progresivamente más
          difícil de alcanzar.
        </p>
      </div>

      {/* Tabla de Niveles de Ejemplo */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="bg-white/5 border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">
            Progresión de Niveles (Ejemplos)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                  Nivel
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                  XP para Siguiente Nivel
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                  XP Total Acumulado
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                  Dificultad
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {levelExamples.map((example, index) => (
                <tr key={example.level} className="hover:bg-white/5 transition">
                  <td className="px-6 py-3">
                    <span className="text-white font-bold">
                      Nivel {example.level}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-purple-400 font-medium">
                      {example.xp.toLocaleString()} XP
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-blue-400">
                      {example.totalXP.toLocaleString()} XP
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500"
                          style={{
                            width: `${Math.min((index / levelExamples.length) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-12">
                        {index === 0
                          ? 'Fácil'
                          : index === 1
                          ? 'Normal'
                          : index === 2
                          ? 'Medio'
                          : index === 3
                          ? 'Difícil'
                          : index === 4
                          ? 'Muy Difícil'
                          : 'Extremo'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <p className="text-sm text-yellow-400">
          <strong>💡 Recomendaciones:</strong>
        </p>
        <ul className="text-xs text-yellow-300 mt-2 space-y-1 ml-4 list-disc">
          <li>
            <strong>XP Base:</strong> 100-200 para progresión equilibrada
          </li>
          <li>
            <strong>Multiplicador:</strong> 1.2-1.5 para curva suave, 1.5-2.0 para
            mayor desafío
          </li>
          <li>
            <strong>Nivel Máximo:</strong> 50-100 niveles es ideal para mantener
            engagement
          </li>
        </ul>
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
