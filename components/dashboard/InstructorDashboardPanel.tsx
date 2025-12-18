// components/dashboard/InstructorDashboardPanel.tsx
'use client'

import { NButton } from '@/components/ui/NButton'

export function InstructorDashboardPanel() {
  return (
    <div className="space-y-6">
      {/* Resumen Instructor */}
      <section className="rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#6bd8f3] mb-1">
              Panel de instructor
            </p>
            <h2 className="text-lg font-semibold text-white">Gestión de cursos</h2>
            <p className="mt-1 text-sm text-white/70 max-w-xl">
              Crea, edita y gestiona tus cursos y el progreso de tus alumnos.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <NButton className="w-full sm:w-auto">Crear nuevo curso</NButton>
            <NButton variant="ghost" size="sm" className="text-xs">Ver mis cursos</NButton>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <p className="text-white/60">Cursos publicados</p>
            <p className="mt-1 text-lg font-semibold text-white">3</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <p className="text-white/60">Alumnos activos</p>
            <p className="mt-1 text-lg font-semibold text-white">128</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <p className="text-white/60">Tasa de finalización</p>
            <p className="mt-1 text-lg font-semibold text-white">72%</p>
          </div>
        </div>
      </section>

      {/* Gobernanza */}
      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
        <h3 className="text-sm font-semibold text-white">Gobernanza – Rol instructor</h3>
        <p className="mt-1 text-xs text-white/70">
          Propón cambios en rutas formativas, nuevos cursos y mejoras en la experiencia de los alumnos.
        </p>
        <NButton size="sm" className="mt-3">Proponer iniciativa</NButton>
      </section>
    </div>
  )
}
