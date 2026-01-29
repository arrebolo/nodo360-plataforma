'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, MessageSquare, Search } from 'lucide-react'

interface OtherUser {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
}

interface LastMessage {
  id: string
  content: string
  sender_id: string
  created_at: string
  read_at: string | null
}

interface Conversation {
  id: string
  otherUser: OtherUser
  lastMessage: LastMessage | null
  unreadCount: number
  lastMessageAt: string | null
}

interface ConversationListProps {
  currentUserId: string
}

export default function ConversationList({ currentUserId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/conversations')
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al cargar conversaciones')
        return
      }

      setConversations(data.conversations)
      setError(null)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()

    // Poll every 10 seconds
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Ayer'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }
  }

  const truncateMessage = (content: string, maxLength = 50) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-white/60">{error}</p>
        <button
          onClick={fetchConversations}
          className="text-brand-light hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Buscar conversación..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="
            w-full pl-10 pr-4 py-2.5
            bg-white/5 border border-white/10 rounded-xl
            text-sm text-white placeholder:text-white/40
            focus:outline-none focus:border-brand-light/50
            transition-colors
          "
        />
      </div>

      {/* Conversations list */}
      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/60">
            {searchQuery
              ? 'No se encontraron conversaciones'
              : 'No tienes conversaciones aún'}
          </p>
          {!searchQuery && (
            <p className="text-sm text-white/40">
              Envía un mensaje a un instructor desde su perfil
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/dashboard/mensajes/${conv.id}`}
              className="
                flex items-center gap-3 p-3
                bg-white/5 hover:bg-white/[0.07]
                border border-white/10 hover:border-white/20
                rounded-xl transition-all
              "
            >
              {/* Avatar */}
              {conv.otherUser.avatar_url ? (
                <Image
                  src={conv.otherUser.avatar_url}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-light font-semibold text-lg">
                    {conv.otherUser.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white truncate">
                    {conv.otherUser.full_name}
                  </p>
                  {conv.lastMessage && (
                    <span className="text-xs text-white/40 flex-shrink-0">
                      {formatDate(conv.lastMessage.created_at)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-0.5">
                  {conv.lastMessage ? (
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-white/80 font-medium' : 'text-white/50'}`}>
                      {conv.lastMessage.sender_id === currentUserId && (
                        <span className="text-white/40">Tú: </span>
                      )}
                      {truncateMessage(conv.lastMessage.content)}
                    </p>
                  ) : (
                    <p className="text-sm text-white/40 italic">Sin mensajes</p>
                  )}

                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-brand-light text-dark text-xs font-bold">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/30 capitalize mt-0.5">
                  {conv.otherUser.role}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
