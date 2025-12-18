// app/(private)/dashboard/formador/disponibilidad/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 0, label: 'Domingo' }
]

interface Educator {
  id: string
  is_available: boolean
}

interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export default function DisponibilidadPage() {
  const supabase = createClient()
  const router = useRouter()

  const [educator, setEducator] = useState<Educator | null>(null)
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form para nuevo slot
  const [newDay, setNewDay] = useState(1)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('17:00')

  // Toggle disponibilidad general
  const [isAvailable, setIsAvailable] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Obtener educador
    const { data: educatorData } = await supabase
      .from('educators')
      .select('id, is_available')
      .eq('user_id', user.id)
      .single()

    if (!educatorData) {
      router.push('/dashboard/ser-formador')
      return
    }

    const typedEducator = educatorData as Educator
    setEducator(typedEducator)
    setIsAvailable(typedEducator.is_available)

    // Obtener disponibilidad
    const { data: availData } = await supabase
      .from('educator_availability')
      .select('*')
      .eq('educator_id', typedEducator.id)
      .order('day_of_week', { ascending: true })

    setAvailability((availData || []) as AvailabilitySlot[])
    setLoading(false)
  }

  const toggleGeneralAvailability = async () => {
    if (!educator) return

    const newValue = !isAvailable
    setIsAvailable(newValue)

    await supabase
      .from('educators' as never)
      .update({ is_available: newValue } as never)
      .eq('id', educator.id)
  }

  const addSlot = async () => {
    if (!educator) return

    setSaving(true)

    const response = await fetch('/api/mentorship/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_of_week: newDay,
        start_time: newStart,
        end_time: newEnd,
        timezone: 'Europe/Madrid'
      })
    })

    if (response.ok) {
      await loadData()
    }

    setSaving(false)
  }

  const removeSlot = async (slotId: string) => {
    if (!confirm('Eliminar este horario?')) return

    await fetch(`/api/mentorship/availability?id=${slotId}`, {
      method: 'DELETE'
    })

    await loadData()
  }

  const toggleSlotActive = async (slot: AvailabilitySlot) => {
    await supabase
      .from('educator_availability' as never)
      .update({ is_active: !slot.is_active } as never)
      .eq('id', slot.id)

    await loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Agrupar por dia
  const slotsByDay = DIAS_SEMANA.map(dia => ({
    ...dia,
    slots: availability.filter(s => s.day_of_week === dia.value)
  }))

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/formador" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Volver al panel
          </Link>
          <h1 className="text-2xl font-bold">Configurar Disponibilidad</h1>
          <p className="text-gray-400 text-sm mt-1">
            Define los horarios en los que estas disponible para sesiones
          </p>
        </div>

        {/* Toggle general */}
        <div className={`mb-8 p-4 rounded-xl border ${isAvailable ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {isAvailable ? 'Disponible para sesiones' : 'No disponible'}
              </h3>
              <p className="text-sm text-gray-400">
                {isAvailable
                  ? 'Los alumnos pueden solicitar sesiones contigo'
                  : 'Tu perfil aparece como no disponible'}
              </p>
            </div>
            <button
              onClick={toggleGeneralAvailability}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isAvailable ? 'bg-emerald-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Agregar nuevo horario */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Agregar horario</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Dia</label>
              <select
                value={newDay}
                onChange={(e) => setNewDay(Number(e.target.value))}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f7931a]"
              >
                {DIAS_SEMANA.map(dia => (
                  <option key={dia.value} value={dia.value}>{dia.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Desde</label>
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f7931a]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Hasta</label>
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f7931a]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addSlot}
                disabled={saving}
                className="w-full bg-[#f7931a] hover:bg-[#f7931a]/90 text-black py-2 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>

        {/* Horarios por dia */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Mis horarios</h2>

          {availability.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
              <p>No tienes horarios configurados</p>
              <p className="text-sm mt-1">Agrega tus horarios disponibles arriba</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slotsByDay.filter(d => d.slots.length > 0).map(dia => (
                <div key={dia.value} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">{dia.label}</h3>
                  <div className="space-y-2">
                    {dia.slots.map(slot => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${slot.is_active ? 'bg-emerald-500/10' : 'bg-gray-500/10 opacity-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${slot.is_active ? 'bg-emerald-400' : 'bg-gray-500'}`}></span>
                          <span>
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSlotActive(slot)}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            {slot.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => removeSlot(slot.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info zona horaria */}
        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400">
          <p>Zona horaria: Europe/Madrid (UTC+1/+2)</p>
          <p className="mt-1">Los alumnos veran los horarios convertidos a su zona horaria local.</p>
        </div>
      </div>
    </div>
  )
}
