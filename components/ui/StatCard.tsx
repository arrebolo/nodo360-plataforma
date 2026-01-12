'use client'

import { type ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

function StatCard({ title, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white/60">{title}</span>
        {icon && <span className="text-brand-orange">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && (
        <div className={`text-sm mt-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}%
        </div>
      )}
    </div>
  )
}

export default StatCard
