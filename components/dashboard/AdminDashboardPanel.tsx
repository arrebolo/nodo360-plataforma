// components/dashboard/AdminDashboardPanel.tsx
'use client'

import { NButton } from '@/components/ui/NButton'

export function AdminDashboardPanel() {
  return (
    <div className="space-y-6">
      {/* Resumen Admin */}
      <section className="rounded-2xl border border-white/20 bg-black/60 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#6bd8f3] mb-1">
              Panel de administración
            </p>
            <h2 className="text-lg font-semibold text-white">Resumen de la plataforma</h2>
            <p className="mt-1 text-sm text-white/75 max-w-xl">
              Supervisión global: usuarios, cursos, comunidad y gobernanza.
            </p>
          </div>
          <NButton className="w-full sm:w-auto">Configurar plataforma</NButton>
        </div>

        {/* Stats globales */}
        <div className="mt-4 grid gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-xl border border-white/15 bg-black/50 p-3">
            <p className="text-white/60">Usuarios totales</p>
            <p className="mt-1 text-lg font-semibold text-white">1.024</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/50 p-3">
            <p className="text-white/60">Cursos activos</p>
            <p className="mt-1 text-lg font-semibold text-white">14</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/50 p-3">
            <p className="text-white/60">Mentores</p>
            <p className="mt-1 text-lg font-semibold text-white">6</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/50 p-3">
            <p className="text-white/60">Propuestas activas</p>
            <p className="mt-1 text-lg font-semibold text-white">9</p>
          </div>
        </div>
      </section>

      {/* Gobernanza - Veto */}
      <section className="rounded-2xl border border-red-500/40 bg-black/55 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Gobernanza – Supervisión y veto</h3>
            <p className="mt-1 text-xs text-white/80 max-w-xl">
              Supervisa propuestas y ejerce poder de veto cuando sea necesario.
            </p>
          </div>
          <NButton size="sm">Ver propuestas</NButton>
        </div>

        {/* Propuesta con veto */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
          <article className="rounded-xl border border-white/15 bg-black/60 p-3">
            <p className="font-semibold text-white">Ruta nodos Lightning</p>
            <p className="mt-1 text-white/65">Votación abierta · Cierre en 2 días</p>
            <div className="mt-2 flex gap-2">
              <NButton size="sm" variant="ghost" className="text-xs">Detalles</NButton>
              <NButton size="sm" variant="outline" className="text-xs border-red-500/50 text-red-300 hover:bg-red-500/10">
                Veto
              </NButton>
            </div>
          </article>
          <article className="rounded-xl border border-white/15 bg-black/40 p-3">
            <p className="font-semibold text-white">Grupo estudio Web3</p>
            <p className="mt-1 text-emerald-300">Aprobada</p>
          </article>
        </div>
      </section>
    </div>
  )
}
