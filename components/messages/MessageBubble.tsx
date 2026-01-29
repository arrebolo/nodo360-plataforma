'use client'

import { Check, CheckCheck } from 'lucide-react'

interface MessageBubbleProps {
  content: string
  createdAt: string
  isOwn: boolean
  isRead: boolean
}

export default function MessageBubble({
  content,
  createdAt,
  isOwn,
  isRead,
}: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-2.5
          ${isOwn
            ? 'bg-brand-light/20 text-white rounded-br-md'
            : 'bg-white/10 text-white/90 rounded-bl-md'
          }
        `}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-white/40">{formatTime(createdAt)}</span>
          {isOwn && (
            isRead ? (
              <CheckCheck className="w-3.5 h-3.5 text-brand-light" />
            ) : (
              <Check className="w-3.5 h-3.5 text-white/40" />
            )
          )}
        </div>
      </div>
    </div>
  )
}
