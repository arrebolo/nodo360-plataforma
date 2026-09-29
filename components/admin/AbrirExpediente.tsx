'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Persona = { id: string; full_name: string | null; email: string; role: string }
type Especialidad = { id: string; nombre: string; requiere_acreditacion: boolean }

/**
 * Abre un expediente de verificacion en «pendiente».
 *
 * Hace falta porque nadie los crea: la 092 quito de submit/route.ts la emision
 * automatica, y sin esto la pantalla del evaluador no tendria nada que evaluar.
 */
export default function AbrirExpediente({
  candidatos,
  especialidades,
}: {
  candidatos: Persona[]
  especialidades: Especialidad[]
}) {
  const router = useRouter()
  const [persona, setPersona] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listo = persona !== '' && especialidad !== ''

  async function abrir() {
    if (!listo) return
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/verificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: persona, specialty_id: especialidad }),
      })
      const datos = await res.json()
      if (!res.ok || !datos.success) {
        setError(datos.error ?? 'No se pudo abrir el expediente')
        return
      }
      setPersona('')
      setEspecialidad('')
      router.refresh()
    } catch {
      setError('No se pudo abrir el expediente')
    } finally {
      setCargando(false)
    }
  }

  const clase =
    'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30'

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-white/50 block mb-1">Persona</span>
          <select className={clase} value={persona} onChange={(ev) => setPersona(ev.target.value)}>
            <option value="">Elige…</option>
            {candidatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.email} · {c.role}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-white/50 block mb-1">Especialidad</span>
          <select
            className={clase}
            value={especialidad}
            onChange={(ev) => setEspecialidad(ev.target.value)}
          >
            <option value="">Elige…</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
                {e.requiere_acreditacion ? ' (requiere acreditación)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={abrir}
        disabled={!listo || cargando}
        className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 text-sm hover:bg-orange-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cargando ? 'Abriendo…' : 'Abrir expediente'}
      </button>
    </div>
  )
}
