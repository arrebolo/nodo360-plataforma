'use client'

import { UserRole } from '@/types/roles'
import { RoleBadge } from '@/components/ui/RoleBadge'
import Link from 'next/link'
import {
  Users,
  Shield,
  Crown,
  Clock,
  ArrowRight
} from 'lucide-react'

interface RoleBasedDashboardProps {
  highestRole: UserRole
  roles: UserRole[]
  userName?: string
}

export function RoleBasedDashboard({
  highestRole,
  roles,
  userName
}: RoleBasedDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Banner según rol */}
      {highestRole === 'candidate_mentor' && (
        <CandidateMentorBanner />
      )}

      {/* Paneles de acceso rápido según rol */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Panel de Mentor */}
        {(roles.includes('mentor') || roles.includes('admin') || roles.includes('council')) && (
          <RolePanelCard
            title="Panel de Mentor"
            description="Gestiona tus estudiantes y sesiones"
            href="/mentor"
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
        )}

        {/* Panel de Admin */}
        {(roles.includes('admin') || roles.includes('council')) && (
          <RolePanelCard
            title="Panel de Administración"
            description="Gestiona usuarios, cursos y contenido"
            href="/admin"
            icon={<Shield className="w-6 h-6" />}
            color="purple"
          />
        )}

        {/* Panel de Consejo */}
        {roles.includes('council') && (
          <RolePanelCard
            title="Panel de Gobernanza"
            description="Decisiones y votaciones del consejo"
            href="/council"
            icon={<Crown className="w-6 h-6" />}
            color="amber"
          />
        )}
      </div>

      {/* Mostrar todos los roles del usuario */}
      {roles.length > 1 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-sm text-gray-400 mb-2">Tus roles activos:</p>
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <RoleBadge key={role} role={role} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Banner para candidatos a mentor
function CandidateMentorBanner() {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Clock className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-yellow-400">
            Solicitud de Mentor en Revisión
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            Tu solicitud para ser mentor está siendo revisada por nuestro equipo.
            Te notificaremos cuando tengamos una respuesta.
          </p>
          <Link
            href="/mentoria/estado"
            className="inline-flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300 mt-2"
          >
            Ver estado de solicitud
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// Card de panel por rol
function RolePanelCard({
  title,
  description,
  href,
  icon,
  color
}: {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: 'blue' | 'purple' | 'amber'
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400/50',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400/50',
  }

  const iconColors = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
  }

  return (
    <Link href={href}>
      <div className={`
        bg-gradient-to-br ${colorClasses[color]}
        border rounded-xl p-5
        transition-all duration-200 hover:scale-[1.02]
        cursor-pointer group
      `}>
        <div className={`${iconColors[color]} mb-3`}>
          {icon}
        </div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
        <div className="flex items-center gap-1 text-sm mt-3 text-gray-500 group-hover:text-gray-300 transition-colors">
          Acceder
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}
