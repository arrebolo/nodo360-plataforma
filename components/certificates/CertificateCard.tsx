'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award, Download, ExternalLink, Check, Copy } from 'lucide-react'
import { DownloadPDFButton } from './DownloadPDFButton'

type Props = {
  certificateNumber: string
  title: string
  subtitle?: string | null
  issuedAt?: string
  type: 'course' | 'module'
  verificationPath: string
  pdfUrl?: string | null
  score?: number | null
  userName?: string | null
  /** Fecha ISO para el PDF */
  issuedAtISO?: string
}

export function CertificateCard({
  certificateNumber,
  title,
  subtitle,
  issuedAt,
  type,
  verificationPath,
  pdfUrl,
  score,
  userName,
  issuedAtISO,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${verificationPath}`
    : verificationPath

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copiando:', error)
    }
  }

  const handleShareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`
    window.open(linkedInUrl, '_blank', 'width=600,height=600')
    setShowShareMenu(false)
  }

  const handleShareTwitter = () => {
    const text = `He completado "${title}" en @Nodo360! Verifica mi certificado:`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verificationUrl)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
    setShowShareMenu(false)
  }

  return (
    <div className="bg-dark-surface border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300">
      {/* Header con gradiente */}
      <div className="relative bg-gradient-to-r from-brand-light/20 via-brand/10 to-brand-light/20 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">
                {type === 'module' ? 'Certificado de Modulo' : 'Certificado de Curso'}
              </p>
              <p className="text-brand-light font-mono text-sm">
                {certificateNumber}
              </p>
            </div>
          </div>

          {/* Score badge */}
          {score && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/20 border border-success/30 rounded-lg">
              <svg className="w-3.5 h-3.5 text-success" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-success text-sm font-bold">{score}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        {/* Titulo del curso */}
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
          {title}
        </h3>

        {/* Descripcion */}
        {subtitle && (
          <p className="text-white/50 text-sm mb-3 line-clamp-2">
            {subtitle}
          </p>
        )}

        {/* Info */}
        <div className="flex items-center gap-4 text-sm text-white/60 mb-5">
          {userName && (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{userName}</span>
            </div>
          )}
          {issuedAt && (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{issuedAt}</span>
            </div>
          )}
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Descargar PDF - Genera en el cliente */}
          <DownloadPDFButton
            certificate={{
              certificateNumber,
              userName: userName || 'Estudiante',
              courseTitle: title,
              courseDescription: subtitle,
              issuedAt: issuedAtISO || new Date().toISOString(),
              score,
              type,
            }}
            verificationUrl={verificationUrl}
            className="flex-1 min-w-[130px]"
          />

          {/* Verificar */}
          <Link
            href={verificationPath}
            target="_blank"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-white/80 rounded-xl hover:bg-white/15 transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Verificar</span>
          </Link>
        </div>

        {/* Compartir */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Compartir</p>

            <div className="flex gap-2">
              {/* LinkedIn */}
              <button
                onClick={handleShareLinkedIn}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0077B5]/20 text-[#0077B5] rounded-lg hover:bg-[#0077B5]/30 transition text-xs font-medium"
                title="Compartir en LinkedIn"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>LinkedIn</span>
              </button>

              {/* Twitter/X */}
              <button
                onClick={handleShareTwitter}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/70 rounded-lg hover:bg-white/15 transition text-xs font-medium"
                title="Compartir en Twitter"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Twitter</span>
              </button>

              {/* Copiar link */}
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs font-medium ${
                  copied
                    ? 'bg-success/20 text-success'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
                title="Copiar enlace de verificacion"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CertificateCard
