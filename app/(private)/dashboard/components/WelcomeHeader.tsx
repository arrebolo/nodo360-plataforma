'use client'

import { motion } from 'framer-motion'

interface WelcomeHeaderProps {
  name: string
  streak: number
}

export default function WelcomeHeader({ name, streak }: WelcomeHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <h1 className="text-4xl font-bold mb-2">
          👋 ¡Hola, {name}!
        </h1>
        <p className="text-xl text-white/80">
          ✨ Estás a punto de dominar Bitcoin
        </p>
        <p className="text-lg text-[#f7931a] mt-2">
          🔥 Racha de {streak} días - ¡Sigue así!
        </p>
      </div>
    </motion.div>
  )
}
