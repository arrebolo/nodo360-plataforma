'use client'

import { Linkedin, Twitter, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface ShareButtonsProps {
  certificateNumber: string
  courseTitle: string
}

export function ShareButtons({ certificateNumber, courseTitle }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://nodo360.com/certificados/${certificateNumber}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank')
  }

  const shareTwitter = () => {
    const text = `¡Acabo de obtener mi certificado "${courseTitle}" en Nodo360! 🎓`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={shareLinkedIn}
        className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] hover:bg-[#006399] text-white rounded-lg transition-colors"
      >
        <Linkedin className="w-5 h-5" />
        LinkedIn
      </button>

      <button
        onClick={shareTwitter}
        className="flex items-center gap-2 px-4 py-2 bg-[#1da1f2] hover:bg-[#0c85d0] text-white rounded-lg transition-colors"
      >
        <Twitter className="w-5 h-5" />
        Twitter
      </button>

      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
      >
        {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
        {copied ? '¡Copiado!' : 'Copiar enlace'}
      </button>
    </div>
  )
}
