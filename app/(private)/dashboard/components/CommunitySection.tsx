'use client'

import { motion } from 'framer-motion'

export default function CommunitySection() {
  const socials = [
    { icon: '💬', name: 'Discord', members: '234 online', link: '#' },
    { icon: '📱', name: 'Telegram', members: '567 miembros', link: '#' },
    { icon: '🌐', name: 'Foro', members: '89 posts', link: '#' },
    { icon: '🎥', name: 'YouTube', members: '12 videos', link: '#' }
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
    >
      <h2 className="text-2xl font-bold mb-4">👥 Únete a la Comunidad Nodo360</h2>
      <p className="text-white/80 mb-6">
        Conecta con +1,234 estudiantes • Comparte ideas • Aprende juntos
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.link}
            className="bg-white/5 hover:bg-white/10 rounded-xl p-4 text-center transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">{social.icon}</div>
            <p className="font-bold">{social.name}</p>
            <p className="text-sm text-white/60">{social.members}</p>
          </a>
        ))}
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <p className="font-bold mb-2">🔔 Próximos Eventos:</p>
        <ul className="space-y-2 text-sm">
          <li>• 🎯 Webinar: "El Futuro de Bitcoin" - 20/11/2025 18:00</li>
          <li>• 💬 AMA con expertos DeFi - 25/11/2025 19:00</li>
        </ul>
      </div>
    </motion.section>
  )
}
