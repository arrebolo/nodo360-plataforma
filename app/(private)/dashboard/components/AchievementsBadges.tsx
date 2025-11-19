'use client'

import { motion } from 'framer-motion'

const badges = [
  { id: 1, name: 'Primer Paso', icon: '🏆', unlocked: true },
  { id: 2, name: 'Estudiante Activo', icon: '📖', unlocked: true },
  { id: 3, name: 'Semana de Racha', icon: '🔥', unlocked: false, requirement: '7 días faltantes' },
  { id: 4, name: 'Maestro Bitcoin', icon: '💎', unlocked: false, requirement: 'Completa 3 cursos' }
]

export default function AchievementsBadges() {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">🏆 Tus Logros y Badges</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={badge.unlocked ? { scale: 1.1, rotate: 5 } : {}}
            className={`
              relative rounded-2xl p-6 text-center border-2 transition-all
              ${badge.unlocked
                ? 'bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 border-[#f7931a] hover:shadow-lg hover:shadow-[#f7931a]/50'
                : 'bg-white/5 border-white/10 opacity-40 grayscale'
              }
            `}
          >
            <div className="text-6xl mb-3">{badge.icon}</div>
            <h3 className="font-bold mb-1">{badge.name}</h3>
            {badge.unlocked ? (
              <div className="flex justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/60 mt-2">{badge.requirement}</p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
