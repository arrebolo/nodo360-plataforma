'use client'

import { StickyNote, Users, MessageCircle } from 'lucide-react'
import { useState } from 'react'

interface PersistentButtonsProps {
  onNotesClick: () => void
  onMentoringClick: () => void
  onCommunityClick: () => void
}

export function PersistentButtons({
  onNotesClick,
  onMentoringClick,
  onCommunityClick,
}: PersistentButtonsProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const buttons = [
    {
      id: 'notes',
      label: 'Notas',
      icon: StickyNote,
      onClick: onNotesClick,
      ariaLabel: 'Abrir notas personales',
    },
    {
      id: 'mentoring',
      label: 'Mentoría',
      icon: Users,
      onClick: onMentoringClick,
      ariaLabel: 'Ir a mentoría',
    },
    {
      id: 'community',
      label: 'Comunidad',
      icon: MessageCircle,
      onClick: onCommunityClick,
      ariaLabel: 'Ir a comunidad',
    },
  ]

  return (
    <>
      {/* Desktop: Floating buttons (bottom-right) */}
      <div className="hidden lg:flex fixed bottom-6 right-6 flex-col gap-3 z-40">
        {buttons.map((button) => {
          const Icon = button.icon
          const showThisTooltip = showTooltip === button.id

          return (
            <div key={button.id} className="relative">
              {showThisTooltip && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-nodo-card border border-nodo-icon rounded-lg text-sm text-white whitespace-nowrap">
                  {button.label}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-nodo-card border-r border-b border-nodo-icon rotate-[-45deg]" />
                </div>
              )}
              <button
                onClick={button.onClick}
                onMouseEnter={() => setShowTooltip(button.id)}
                onMouseLeave={() => setShowTooltip(null)}
                onFocus={() => setShowTooltip(button.id)}
                onBlur={() => setShowTooltip(null)}
                aria-label={button.ariaLabel}
                className="w-14 h-14 rounded-full bg-[#F7931A] hover:bg-[#FDB931] text-black shadow-lg hover:shadow-xl hover:shadow-[#F7931A]/30 transition-all flex items-center justify-center group"
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Mobile: Bottom toolbar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-nodo-bg border-t border-nodo-icon safe-area-inset-bottom">
        <div className="flex items-center justify-around px-4 py-3">
          {buttons.map((button) => {
            const Icon = button.icon

            return (
              <button
                key={button.id}
                onClick={button.onClick}
                aria-label={button.ariaLabel}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-[#F7931A] transition-colors"
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="text-xs font-medium">{button.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
