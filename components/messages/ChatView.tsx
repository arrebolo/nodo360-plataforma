'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Loader2 } from 'lucide-react'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

interface Message {
  id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

interface OtherUser {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
}

interface ChatViewProps {
  conversationId: string
  currentUserId: string
}

export default function ChatView({ conversationId, currentUserId }: ChatViewProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al cargar mensajes')
        return
      }

      setMessages(data.messages)
      setOtherUser(data.conversation.otherUser)
      setError(null)

      // Mark as read
      await fetch(`/api/messages/${conversationId}/read`, { method: 'POST' })
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  // Initial load and polling
  useEffect(() => {
    fetchMessages()

    // Poll every 5 seconds for new messages
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Send message
  const handleSend = async (content: string) => {
    const res = await fetch(`/api/messages/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Error al enviar mensaje')
    }

    const { message } = await res.json()
    setMessages((prev) => [...prev, message])
  }

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []

    msgs.forEach((msg) => {
      const date = new Date(msg.created_at).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(msg)
      } else {
        groups.push({ date, messages: [msg] })
      }
    })

    return groups
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-white/60">{error}</p>
        <button
          onClick={() => router.push('/dashboard/mensajes')}
          className="text-brand-light hover:underline"
        >
          Volver a conversaciones
        </button>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10 bg-white/5">
        <button
          onClick={() => router.push('/dashboard/mensajes')}
          className="p-2 -ml-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {otherUser && (
          <div className="flex items-center gap-3">
            {otherUser.avatar_url ? (
              <Image
                src={otherUser.avatar_url}
                alt=""
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-light/20 flex items-center justify-center">
                <span className="text-brand-light font-medium">
                  {otherUser.full_name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-white">{otherUser.full_name}</p>
              <p className="text-xs text-white/50 capitalize">{otherUser.role}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/40 text-sm">
              No hay mensajes aún. ¡Inicia la conversación!
            </p>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 text-xs text-white/40 bg-white/5 rounded-full capitalize">
                  {group.date}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-2">
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    content={msg.content}
                    createdAt={msg.created_at}
                    isOwn={msg.sender_id === currentUserId}
                    isRead={msg.read_at !== null}
                    messageId={msg.id}
                    conversationId={conversationId}
                    senderId={msg.sender_id}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 bg-white/5">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  )
}
