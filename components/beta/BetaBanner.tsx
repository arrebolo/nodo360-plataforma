'use client'

import { useState } from 'react'
import { MessageSquarePlus, X } from 'lucide-react'
import FeedbackModal from './FeedbackModal'

interface BetaBannerProps {
  userEmail: string
  userId: string
}

export default function BetaBanner({ userEmail, userId }: BetaBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <>
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#f7931a]/10 to-[#ff6b35]/10 border-b border-[#f7931a]/20">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#f7931a]/20 text-[#f7931a] text-xs font-medium rounded-full">
              BETA
            </span>
            <p className="text-sm text-gray-300">
              <span className="sm:hidden font-medium text-[#f7931a]">BETA · </span>
              Estas usando la version beta de Nodo360.{' '}
              <span className="hidden sm:inline text-gray-400">Tu feedback es clave para mejorar.</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f7931a] text-white text-sm font-medium rounded-lg hover:bg-[#f7931a]/90 transition"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar feedback</span>
              <span className="sm:hidden">Feedback</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/10"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userEmail={userEmail}
        userId={userId}
      />
    </>
  )
}
