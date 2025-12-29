'use client'

import { useState, useEffect, useMemo } from 'react'
import { Save } from 'lucide-react'

interface LevelConfig {
  xp_base: number
  xp_multiplier: number
  max_level: number
}

const DEFAULT_CONFIG: LevelConfig = {
  xp_base: 100,
  xp_multiplier: 1.2,
  max_level: 50
}

function coerceLevelConfig(input: any, fallback: LevelConfig): LevelConfig {
  // Merge + coerción numérica defensiva
  const merged = { ...fallback, ...(input ?? {}) }

  const xp_base = Number(merged.xp_base)
  const xp_multiplier = Number(merged.xp_multiplier)
  const max_level = Number(merged.max_level)

  return {
    xp_base: Number.isFinite(xp_base) ? xp_base : fallback.xp_base,
    xp_multiplier: Number.isFinite(xp_multiplier) ? xp_multiplier : fallback.xp_multiplier,
    max_level: Number.isFinite(max_level) ? max_level : fallback.max_level
  }
}

export default function LevelConfigForm({
  initialConfig
}: {
  initialConfig: LevelConfig
}) {
  // Blindaje: aunque initialConfig venga raro, garantizamos números válidos
  const initial = useMemo(
    () => coerceLevelConfig(initialConfig, DEFAULT_CONFIG),
    [initialConfig]
  )

  const [config, setConfig] = useState<LevelConfig>(initial)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  /* ===============================
     CARGA INICIAL DESDE SETTINGS
     =============================== */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/settings?key=level_rules')
        const json = await res.json()

        if (json?.value) {
          // Importante: merge con lo que ya hay para evitar undefined
          setConfig((prev) => coerceLevelConfig(json.value, prev))
        }
      } catch (error) {
        console.error('Error cargando level_rules', error)
      }
    }

    loadConfig()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setConfig((prev) => {
      // Si el usuario borra el input, value = "" (no queremos NaN)
      if (value === '') {
        return {
          ...prev,
          [name]:
            name === 'xp_multiplier'
              ? prev.xp_multiplier
              : name === 'xp_base'
                ? prev.xp_base
                : prev.max_level
        } as LevelConfig
      }

      const nextNumber = name === 'xp_multiplier' ? parseFloat(value) : parseInt(value, 10)

      return {
        ...prev,
        [name]: Number.isFinite(nextNumber)
          ? nextNumber
          : (prev as any)[name]
      }
    })
  }

  /* ===============================
     HANDLE SUBMIT (GUARDAR NIVELES)
     =============================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'level_rules',
          value: config
        })
      })

      if (!res.ok) throw new Error()

      setMessage('✅ Configuración de niveles guardada correctamente')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const levelExamples = useMemo(() => {
    const calc = (lvl: number) =>
      Math.floor(config.xp_base * Math.pow(config.xp_multiplier, lvl - 1))

    return [1, 5, 10, 20].map((lvl) => ({
      level: lvl,
      xp: calc(lvl)
    }))
  }, [config])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <input
          type="number"
          name="xp_base"
          value={config.xp_base ?? DEFAULT_CONFIG.xp_base}
          onChange={handleChange}
          className="bg-black/30 p-3 rounded-lg text-white"
          placeholder="XP base"
        />

        <input
          type="number"
          name="xp_multiplier"
          value={config.xp_multiplier ?? DEFAULT_CONFIG.xp_multiplier}
          onChange={handleChange}
          step="0.1"
          className="bg-black/30 p-3 rounded-lg text-white"
          placeholder="Multiplicador"
        />

        <input
          type="number"
          name="max_level"
          value={config.max_level ?? DEFAULT_CONFIG.max_level}
          onChange={handleChange}
          className="bg-black/30 p-3 rounded-lg text-white"
          placeholder="Nivel máximo"
        />
      </div>

      <div className="bg-white/5 p-4 rounded-lg text-sm text-gray-300">
        {levelExamples.map((l) => (
          <div key={l.level}>
            Nivel {l.level}: {l.xp} XP
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-[#ff6b35] rounded-lg text-white disabled:opacity-60"
        >
          <Save size={18} />
          {loading ? 'Guardando…' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  )
}
