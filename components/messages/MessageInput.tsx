'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export default function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Escribe un mensaje...',
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [content])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    const trimmed = content.trim()
    if (!trimmed || isSending || disabled) return

    setIsSending(true)
    try {
      await onSend(trimmed)
      setContent('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = content.trim().length > 0 && !isSending && !disabled

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending}
          rows={1}
          maxLength={5000}
          className="
            w-full resize-none rounded-xl
            bg-white/5 border border-white/10
            px-4 py-3 text-sm text-white
            placeholder:text-white/40
            focus:outline-none focus:border-brand-light/50 focus:ring-1 focus:ring-brand-light/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        />
        {content.length > 4500 && (
          <span className="absolute bottom-1 right-3 text-[10px] text-white/30">
            {content.length}/5000
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSend}
        className="
          flex items-center justify-center
          w-11 h-11 rounded-xl
          bg-brand-light text-dark font-medium
          hover:bg-brand-light/90
          disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed
          transition-colors
        "
        aria-label="Enviar mensaje"
      >
        {isSending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  )
}
