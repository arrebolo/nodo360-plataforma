// components/dashboard/RoleDashboardWrapper.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { StudentDashboardPanel } from './StudentDashboardPanel'
import { InstructorDashboardPanel } from './InstructorDashboardPanel'
import { MentorDashboardPanel } from './MentorDashboardPanel'
import { AdminDashboardPanel } from './AdminDashboardPanel'

type Role = 'student' | 'instructor' | 'mentor' | 'admin'

// TODO: Obtener roles reales del usuario desde Supabase
const AVAILABLE_ROLES: Role[] = ['student', 'instructor', 'mentor', 'admin']

const ROLE_LABELS: Record<Role, string> = {
  student: 'Estudiante',
  instructor: 'Instructor',
  mentor: 'Mentor',
  admin: 'Administrador',
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  student: 'Ver tu progreso, cursos y proponer iniciativas',
  instructor: 'Gestionar cursos y crear contenido',
  mentor: 'Mentorías, revisar y votar propuestas',
  admin: 'Supervisión global y poder de veto',
}

export function RoleDashboardWrapper() {
  const [activeRole, setActiveRole] = useState<Role>('student')

  return (
    <section className="mt-8 space-y-6">
      {/* Selector de rol */}
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 backdrop-blur-md">
        <p className="mb-3 text-xs font-medium text-white/70">
          Selecciona el rol con el que quieres trabajar:
        </p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setActiveRole(role)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200',
                'hover:scale-[1.02]',
                activeRole === role
                  ? 'bg-[#f8a94a] text-black border-[#f8a94a] shadow-[0_0_15px_rgba(248,169,74,0.3)]'
                  : 'bg-black/40 border-white/15 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/25'
              )}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-white/50">
          {ROLE_DESCRIPTIONS[activeRole]}
        </p>
      </div>

      {/* Contenido según rol */}
      {activeRole === 'student' && <StudentDashboardPanel />}
      {activeRole === 'instructor' && <InstructorDashboardPanel />}
      {activeRole === 'mentor' && <MentorDashboardPanel />}
      {activeRole === 'admin' && <AdminDashboardPanel />}
    </section>
  )
}
