'use client'

import React, { useEffect, useMemo, useState, useTransition } from 'react'
import { Save, GraduationCap, BookOpen, CheckCircle2, Flame, Trophy, Star } from 'lucide-react'

/**
 * Si tu API guarda esta config con otra key, cambia esto.
 * Ejemplos: 'xp_config', 'xp_actions', etc.
 */
const SETTINGS_KEY = 'xp_rules'

type XPKey =
  | 'lesson_complete'
  | 'module_complete'
  | 'course_complete'
  | 'quiz_complete'
  | 'daily_streak'
  | 'badge_earned'

type XPConfig = Record<XPKey, number>

const XP_ITEMS: Array<{
  key: XPKey
  label: string
  description: string
  icon: React.ReactNode
}> = [
  {
    key: 'lesson_complete',
    label: 'Lección completada',
    description: 'XP al completar una lección',
    icon: <BookOpen className="w-4 h-4 text-brand-light" />,
  },
  {
    key: 'module_complete',
    label: 'Módulo completado',
    description: 'XP al completar un módulo',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  },
  {
    key: 'course_complete',
    label: 'Curso completado',
    description: 'XP al completar un curso',
    icon: <GraduationCap className="w-4 h-4 text-blue-400" />,
  },
  {
    key: 'quiz_complete',
    label: 'Quiz completado',
    description: 'XP al completar un quiz',
    icon: <Star className="w-4 h-4 text-yellow-300" />,
  },
  {
    key: 'daily_streak',
    label: 'Racha diaria',
    description: 'XP por mantener una racha diaria',
    icon: <Flame className="w-4 h-4 text-orange-400" />,
  },
  {
    key: 'badge_earned',
    label: 'Badge obtenido',
    description: 'XP al ganar un badge',
    icon: <Trophy className="w-4 h-4 text-purple-400" />,
  },
]

const DEFAULT_XP_CONFIG: XPConfig = {
  lesson_complete: 10,
  module_complete: 30,
  course_complete: 150,
  quiz_complete: 20,
  daily_streak: 5,
  badge_earned: 50,
}

function coerceXPConfig(input: any, fallback: XPConfig): XPConfig {
  const merged: Record<string, any> = { ...fallback, ...(input ?? {}) }

  const out: XPConfig = { ...fallback }
  for (const item of XP_ITEMS) {
    const n = Number(merged[item.key])
    out[item.key] = Number.isFinite(n) ? n : fallback[item.key]
  }
  return out
}

export default function XPConfigForm({
  initialConfig,
}: {
  initialConfig?: Partial<XPConfig>
}) {
  const initial = useMemo(() => coerceXPConfig(initialConfig, DEFAULT_XP_CONFIG), [initialConfig])

  const [config, setConfig] = useState<XPConfig>(initial)
  const [message, setMessage] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch(`/api/admin/settings?key=${SETTINGS_KEY}`)
        const json = await res.json()

        if (json?.value) {
          setConfig((prev) => coerceXPConfig(json.value, prev))
        }
      } catch (error) {
        console.error(`Error cargando ${SETTINGS_KEY}`, error)
      }
    }

    loadConfig()
  }, [])

  const handleChange = (key: XPKey, raw: string) => {
    setConfig((prev) => {
      if (raw === '') return prev
      const n = Number(raw)
      if (!Number.isFinite(n)) return prev
      const safe = Math.max(0, Math.floor(n))
      return { ...prev, [key]: safe }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: SETTINGS_KEY,
            value: config,
          }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json?.error || json?.message || 'Error al guardar la configuración')
        }

        setMessage('✅ Configuración de XP guardada correctamente')
        setTimeout(() => setMessage(''), 3000)
      } catch (err: any) {
        setMessage(`❌ ${err?.message ?? 'Error al guardar la configuración'}`)
      }
    })
  }

  const totalPreview = useMemo(() => {
    return XP_ITEMS.reduce((acc, item) => acc + (config[item.key] ?? 0), 0)
  }, [config])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90">
          {message}
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <p className="text-sm text-white/80">
          Ajusta las recompensas de XP por evento. Valores recomendados: enteros positivos.
        </p>
        <p className="text-xs text-white/50 mt-1">
          Preview (suma total de valores configurados):{' '}
          <span className="text-white">{totalPreview}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {XP_ITEMS.map((item) => (
          <div
            key={item.key}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div className="space-y-1">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                {item.icon} {item.label}
              </label>
              <p className="text-xs text-white/60">{item.description}</p>
            </div>

            <div className="md:w-56">
              <input
                type="number"
                inputMode="numeric"
                value={config[item.key] ?? 0}
                onChange={(e) => handleChange(item.key, e.target.value)}
                className="w-full bg-black/30 p-3 rounded-lg text-white border border-white/10 focus:outline-none focus:border-brand-light/50"
                placeholder="0"
                min={0}
                step={1}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-3 bg-brand-light hover:bg-brand-light/80 disabled:opacity-60 rounded-lg text-white"
        >
          <Save size={18} />
          {isPending ? 'Guardando…' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  )
}


