'use client'

import { motion } from 'framer-motion'
import { BookOpen, GraduationCap, Users, TrendingUp, LucideIcon } from 'lucide-react'

// Mapeo de strings a componentes de iconos
const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  GraduationCap,
  Users,
  TrendingUp,
}

interface StatsCardProps {
  title: string
  value: number | string
  icon: string  // ✅ Ahora acepta string
  description?: string
  trend?: {
    value: string
    positive: boolean
  }
}

export default function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
  // Obtener el componente de icono del mapa
  const IconComponent = iconMap[icon] || BookOpen

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:border-[#ff6b35]/50 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-white/60">{title}</p>
      {description && (
        <p className="text-xs text-white/40 mt-2">{description}</p>
      )}
    </motion.div>
  )
}
