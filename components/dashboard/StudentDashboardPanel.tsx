// components/dashboard/StudentDashboardPanel.tsx
'use client'

import { NButton } from '@/components/ui/NButton'
import { cn } from '@/lib/utils'

export function StudentDashboardPanel() {
  return (
    <div className="space-y-6">
      {/* Curso en progreso */}
      <section className="rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#6bd8f3] mb-1">
              Curso en progreso
            </p>
            <h2 className="text-lg font-semibold text-white">Bitcoin para principiantes</h2>
            <p className="mt-1 text-sm text-white/70 max-w-xl">
              Continúa donde lo dejaste y avanza en tu itinerario formativo.
            </p>
            <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#f8a94a] to-[#ff6b35]" />
            </div>
            <p className="mt-1 text-xs text-white/60">Progreso: 67%</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <NButton className="w-full sm:w-auto">Continuar aprendizaje</NButton>
            <NButton variant="ghost" size="sm" className="text-xs">
              Ver camino completo
            </NButton>
          </div>
        </div>
      </section>

      {/* Camino de aprendizaje */}
      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
        <h3 className="text-sm font-semibold text-white mb-3">Camino de aprendizaje</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          {[
            { label: 'Nivel básico', status: 'completed' },
            { label: 'Nivel intermedio', status: 'current' },
            { label: 'Nivel avanzado', status: 'locked' },
          ].map((step, index) => (
            <div
              key={step.label}
              className={cn(
                'flex-1 rounded-xl border p-4 text-sm flex flex-col justify-between',
                'border-white/15 bg-black/60',
                step.status === 'current' && 'border-[#f8a94a]/80',
                step.status === 'locked' && 'opacity-60'
              )}
            >
              <div>
                <p className="text-xs text-white/50 mb-1">Paso {index + 1}</p>
                <h4 className="font-semibold text-white">{step.label}</h4>
              </div>
              <p className="mt-2 text-xs text-white/60">
                {step.status === 'completed' && 'Completado. Puedes revisar cuando quieras.'}
                {step.status === 'current' && 'Estás avanzando en este nivel.'}
                {step.status === 'locked' && 'Se desbloqueará al completar el anterior.'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Gobernanza */}
      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Gobernanza de la comunidad</h3>
            <p className="mt-1 text-xs text-white/70 max-w-xl">
              Propón iniciativas para mejorar Nodo360. Los mentores las revisan y, si las aprueban,
              pasan a votación de toda la comunidad.
            </p>
          </div>
          <NButton size="sm" className="w-full sm:w-auto">
            Proponer iniciativa
          </NButton>
        </div>
      </section>
    </div>
  )
}
