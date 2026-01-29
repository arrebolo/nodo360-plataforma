'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export default function MessageBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error)
      }
    }

    fetchUnread()

    // Poll every 30 seconds
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/dashboard/mensajes"
      className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
      aria-label={`Mensajes${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
    >
      <MessageCircle className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand-light text-dark text-[10px] font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
