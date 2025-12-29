import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'yellow'
}

const colorClasses = {
  blue: {
    card: 'border-blue-500/30 bg-blue-500/15',
    icon: 'bg-blue-500/20 text-blue-400',
  },
  green: {
    card: 'border-green-500/30 bg-green-500/15',
    icon: 'bg-green-500/20 text-green-400',
  },
  purple: {
    card: 'border-purple-500/30 bg-purple-500/15',
    icon: 'bg-purple-500/20 text-purple-400',
  },
  orange: {
    card: 'border-[#f7931a]/30 bg-[#f7931a]/15',
    icon: 'bg-[#f7931a]/20 text-[#f7931a]',
  },
  yellow: {
    card: 'border-yellow-500/30 bg-yellow-500/15',
    icon: 'bg-yellow-500/20 text-yellow-400',
  },
}

export function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const classes = colorClasses[color]

  return (
    <div className={`rounded-xl border p-5 ${classes.card}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${classes.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/60 mt-1">{title}</div>
    </div>
  )
}
