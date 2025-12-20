'use client'

import Link from 'next/link'
import { BookOpen, Route, Users, GraduationCap, Rocket, ArrowRight } from 'lucide-react'

type QuickAction = {
  href: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  gradient: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: '/cursos',
    label: 'Explorar Cursos',
    description: 'Aprende a tu ritmo',
    icon: BookOpen,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-600/20',
  },
  {
    href: '/rutas',
    label: 'Rutas de Aprendizaje',
    description: 'Caminos estructurados',
    icon: Route,
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-orange-600/20',
  },
  {
    href: '/comunidad',
    label: 'Comunidad',
    description: 'Conecta con otros',
    icon: Users,
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-green-600/20',
  },
  {
    href: '/mentoria',
    label: 'Mentoria 1:1',
    description: 'Aprende de expertos',
    icon: GraduationCap,
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-600/20',
  },
]

export function QuickActions() {
  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Accesos Rapidos</h2>
            <p className="text-sm text-neutral-400 mt-1">
              Encuentra lo que necesitas rapidamente
            </p>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group relative p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-6 h-6 ${action.color}`} />
                </div>

                {/* Text */}
                <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {action.label}
                </h3>
                <p className="text-sm text-neutral-500 mt-1">{action.description}</p>

                {/* Arrow */}
                <ArrowRight className="absolute top-5 right-5 w-4 h-4 text-neutral-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Compact version for sidebars or smaller spaces
export function QuickActionsCompact() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2 mb-3">
        Accesos Rapidos
      </p>
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div
              className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} border border-white/10 flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-4 h-4 ${action.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors truncate">
                {action.label}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}
