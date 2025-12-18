'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Award, X, ExternalLink, Share2, Copy, Check } from 'lucide-react'

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  certificate: {
    certificate_number: string
    course_title: string
  }
}

export function CertificateModal({ isOpen, onClose, certificate }: CertificateModalProps) {
  const [copied, setCopied] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      // Desactivar confetti después de la animación
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const certificateUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/certificados/${certificate.certificate_number}`
    : `/certificados/${certificate.certificate_number}`

  const shareText = `¡Obtuve mi certificado de "${certificate.course_title}" en Nodo360!`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(certificateUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificado de ${certificate.course_title}`,
          text: shareText,
          url: certificateUrl,
        })
      } catch (err) {
        // Usuario canceló el share
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rotate-45"
                style={{
                  backgroundColor: ['#f7931a', '#ff6b35', '#4caf50', '#2196f3', '#9c27b0'][Math.floor(Math.random() * 5)],
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal Content */}
      <div className="relative bg-gradient-to-br from-[#1a1d24] via-[#252b3d] to-[#1a1d24] rounded-2xl max-w-md w-full border border-[#f7931a]/30 shadow-2xl shadow-[#f7931a]/20 animate-modal-enter">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Award */}
        <div className="pt-8 pb-4 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[#f7931a]/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-5 bg-gradient-to-br from-[#f7931a] to-[#ff6b35] rounded-full">
              <Award className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            ¡Felicitaciones!
          </h2>
          <p className="text-gray-300 text-lg mb-4">
            Has completado el curso
          </p>
          <h3 className="text-xl font-semibold text-[#f7931a] mb-6">
            {certificate.course_title}
          </h3>

          {/* Certificate Number */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <p className="text-xs text-gray-500 mb-1">Tu certificado está listo</p>
            <p className="text-[#f7931a] font-mono font-bold text-lg">
              {certificate.certificate_number}
            </p>
          </div>

          {/* Primary Action */}
          <Link
            href={`/certificados/${certificate.certificate_number}`}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-[#f7931a] to-[#ff6b35] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#f7931a]/30 transition-all mb-4"
          >
            <ExternalLink className="w-5 h-5" />
            Ver Certificado
          </Link>

          {/* Share Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
            )}

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 py-2.5 bg-[#0077b5] hover:bg-[#0077b5]/80 rounded-xl text-white transition-colors"
              title="Compartir en LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(certificateUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 py-2.5 bg-black hover:bg-gray-900 rounded-xl text-white transition-colors border border-white/20"
              title="Compartir en X/Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        @keyframes modal-enter {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
