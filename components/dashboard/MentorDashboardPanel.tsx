// components/dashboard/MentorDashboardPanel.tsx
'use client'

import { NButton } from '@/components/ui/NButton'

export function MentorDashboardPanel() {
  return (
    <div className="space-y-6">
      {/* Resumen Mentor */}
      <section className="rounded-2xl border border-[#f8a94a]/40 bg-black/60 p-5 shadow-[0_0_25px_rgba(248,169,74,0.2)] backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#6bd8f3] mb-1">
              Panel de mentor
            </p>
            <h2 className="text-lg font-semibold text-white">Mentorías y gobernanza</h2>
            <p className="mt-1 text-sm text-white/75 max-w-xl">
              Acompaña alumnos, gestiona sesiones y revisa propuestas de la comunidad.
            </p>
          </div>
          <NButton className="w-full sm:w-auto">Ver sesiones</NButton>
        </div>

        {/* Stats */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-white/15 bg-black/50 p-3">
            <p className="text-white/60">Alumnos mentorizados</p>
            <p className="mt-1 text-lg font-semibold text-white">18</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/50 p-3">
            <p className="text-white/60">Sesiones esta semana</p>
            <p className="mt-1 text-lg font-semibold text-white">5</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/50 p-3">
            <p className="text-white/60">Valoración media</p>
            <p className="mt-1 text-lg font-semibold text-white">4,8 / 5</p>
          </div>
        </div>
      </section>

      {/* Gobernanza - Revisión */}
      <section className="rounded-2xl border border-[#6bd8f3]/40 bg-black/50 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Gobernanza – Revisión y voto</h3>
            <p className="mt-1 text-xs text-white/75 max-w-xl">
              Revisa propuestas pendientes y decide cuáles pasan a votación general.
            </p>
          </div>
          <div className="flex gap-2">
            <NButton size="sm">Propuestas pendientes</NButton>
            <NButton size="sm" variant="ghost">En votación</NButton>
          </div>
        </div>

        {/* Propuestas ejemplo */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
          <article className="rounded-xl border border-white/15 bg-black/60 p-3">
            <p className="font-semibold text-white">Itinerario DeFi intermedio</p>
            <p className="mt-1 text-yellow-300">Pendiente de revisión</p>
            <div className="mt-2 flex gap-2">
              <NButton size="sm" className="flex-1 text-xs">Aprobar</NButton>
              <NButton size="sm" variant="outline" className="flex-1 text-xs">Rechazar</NButton>
            </div>
          </article>
          <article className="rounded-xl border border-white/15 bg-black/40 p-3">
            <p className="font-semibold text-white">Comunidad nodos Lightning</p>
            <p className="mt-1 text-emerald-300">Votación abierta</p>
            <NButton size="sm" variant="ghost" className="mt-2 w-full text-xs">Votar</NButton>
          </article>
        </div>
      </section>
    </div>
  )
}
