'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  progress: number
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="relative">
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-full relative"
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </motion.div>
      </div>
      <span className="text-sm font-bold text-white absolute -right-12 top-0">
        {progress}%
      </span>
    </div>
  )
}
