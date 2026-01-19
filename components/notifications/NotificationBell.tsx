'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Notification, NotificationsResponse } from '@/types/database'

// Iconos y colores por tipo de notificación
const notificationStyles: Record<string, { icon: string; color: string }> = {
  beta_granted: { icon: '🎉', color: 'text-green-400' },
  course_published: { icon: '📚', color: 'text-blue-400' },
  proposal_active: { icon: '🗳️', color: 'text-purple-400' },
  course_completed: { icon: '🏆', color: 'text-yellow-400' },
  certificate_issued: { icon: '📜', color: 'text-yellow-400' },
  badge_earned: { icon: '🏅', color: 'text-orange-400' },
  level_up: { icon: '⬆️', color: 'text-cyan-400' },
  feedback_reply: { icon: '💬', color: 'text-pink-400' },
  welcome: { icon: '👋', color: 'text-green-400' },
  system: { icon: '⚙️', color: 'text-gray-400' },
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Cargar notificaciones
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data: NotificationsResponse = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Marcar una como leída
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('❌ Error marking as read:', error)
    }
  }

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error)
    }
  }

  // Click en notificación
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    if (notification.link) {
      setIsOpen(false)
      router.push(notification.link)
    }
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cargar al montar y cada 30 segundos
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            <h3 className="font-semibold text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map(notification => {
                const style = notificationStyles[notification.type] || notificationStyles.system
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                      !notification.read ? 'bg-gray-800/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icono */}
                      <span className="text-xl flex-shrink-0">{style.icon}</span>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {notification.link && (
                            <ExternalLink className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
