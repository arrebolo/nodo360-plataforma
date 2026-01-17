import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface DashboardIconCardProps {
  href: string
  icon: LucideIcon
  label: string
  description?: string
  color?: 'orange' | 'blue' | 'green' | 'emerald' | 'purple' | 'pink' | 'cyan' | 'red' | 'yellow'
}

const colorClasses = {
  orange: 'from-[#ff6b35]/20 to-[#f7931a]/10 hover:from-[#ff6b35]/30 hover:to-[#f7931a]/20 text-[#f7931a]',
  blue: 'from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 text-blue-400',
  green: 'from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 text-green-400',
  emerald: 'from-emerald-500/20 to-emerald-600/10 hover:from-emerald-500/30 hover:to-emerald-600/20 text-emerald-400',
  purple: 'from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 text-purple-400',
  pink: 'from-pink-500/20 to-pink-600/10 hover:from-pink-500/30 hover:to-pink-600/20 text-pink-400',
  cyan: 'from-cyan-500/20 to-cyan-600/10 hover:from-cyan-500/30 hover:to-cyan-600/20 text-cyan-400',
  red: 'from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 text-red-400',
  yellow: 'from-yellow-500/20 to-yellow-600/10 hover:from-yellow-500/30 hover:to-yellow-600/20 text-yellow-400',
}

export default function DashboardIconCard({
  href,
  icon: Icon,
  label,
  description,
  color = 'orange'
}: DashboardIconCardProps) {
  return (
    <Link
      href={href}
      className={`
        group flex flex-col items-center justify-center p-5 rounded-2xl
        bg-gradient-to-br ${colorClasses[color]}
        border border-white/10 hover:border-white/20
        transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20
        min-h-[120px]
      `}
    >
      <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <span className="text-sm font-medium text-white text-center">{label}</span>
      {description && (
        <span className="text-xs text-white/50 text-center mt-1">{description}</span>
      )}
    </Link>
  )
}
