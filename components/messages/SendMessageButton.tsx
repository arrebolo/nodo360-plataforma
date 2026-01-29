'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Loader2 } from 'lucide-react'

interface SendMessageButtonProps {
  instructorId: string
  instructorName: string
  isAuthenticated: boolean
}

export default function SendMessageButton({
  instructorId,
  instructorName,
  isAuthenticated,
}: SendMessageButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/instructores/${instructorId}`)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: instructorId }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error al crear conversación')
        return
      }

      // Redirect to conversation
      router.push(`/dashboard/mensajes/${data.conversationId}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="
        w-full flex items-center justify-center gap-2
        px-4 py-2.5 rounded-lg
        bg-gradient-to-r from-orange-500 to-amber-500
        text-white font-medium
        hover:opacity-90 transition-opacity
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Conectando...
        </>
      ) : (
        <>
          <MessageSquare className="w-4 h-4" />
          Enviar mensaje
        </>
      )}
    </button>
  )
}
