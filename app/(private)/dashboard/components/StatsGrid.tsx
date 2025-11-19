'use client'

import { motion } from 'framer-motion'

interface Stat {
  icon: string
  label: string
  value: number
  change?: string
}

interface StatsGridProps {
  stats: Stat[]
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-[#ff6b35]/50 transition-all cursor-pointer group"
        >
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
            {stat.icon}
          </div>
          <div className="text-5xl font-black mb-2 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
            {stat.value}
          </div>
          <div className="text-white/80 font-medium mb-2">{stat.label}</div>
          {stat.change && (
            <div className="text-sm text-[#f7931a]">{stat.change}</div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
