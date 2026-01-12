'use client'

/**
 * CertificateDownload Component
 *
 * Button to download certificate PDF
 * - Generates PDF on click
 * - Shows loading state
 * - Handles errors
 */

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import {
  generateCertificatePDF,
  downloadCertificatePDF,
  generateCertificateFileName,
  type CertificateData,
} from '@/lib/certificates/generateCertificate'

interface CertificateDownloadProps {
  certificateData: CertificateData
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function CertificateDownload({
  certificateData,
  variant = 'primary',
  size = 'md',
  showIcon = true,
}: CertificateDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Generate PDF
      const pdfBlob = await generateCertificatePDF(certificateData)

      // Generate file name
      const fileName = generateCertificateFileName(certificateData)

      // Download
      downloadCertificatePDF(pdfBlob, fileName)
    } catch (err) {
      console.error('Error generating certificate:', err)
      setError('No se pudo generar el certificado. Intenta de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Variant styles
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-brand-light to-brand text-white hover:shadow-lg hover:shadow-brand-light/50',
    secondary:
      'bg-gradient-to-r from-gold to-gold-light text-black hover:shadow-lg hover:shadow-gold/50',
    outline:
      'bg-transparent border-2 border-brand-light text-brand-light hover:bg-brand-light/10',
  }

  // Size styles
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className={`
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          rounded-xl font-semibold transition-all
          flex items-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isGenerating ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : showIcon ? (
          <Download className={iconSizes[size]} />
        ) : null}
        <span>{isGenerating ? 'Generando...' : 'Descargar Certificado'}</span>
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

/**
 * CertificateCard Component
 *
 * Card displaying certificate with download button
 */

export function CertificateCard({
  certificateData,
  showPreview = true,
}: {
  certificateData: CertificateData
  showPreview?: boolean
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-gold/20 to-gold-light/20 flex items-center justify-center flex-shrink-0">
          <FileText className="w-8 h-8 text-gold" />
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-white mb-1">
              {certificateData.type === 'module'
                ? certificateData.moduleTitle
                : certificateData.courseTitle}
            </h3>
            <p className="text-sm text-white/60">
              {certificateData.type === 'module' ? 'Certificado de Módulo' : 'Certificado de Curso'}
            </p>
          </div>

          {showPreview && (
            <div className="mb-3 space-y-1 text-sm text-white/70">
              <p>
                <span className="font-semibold">Otorgado a:</span> {certificateData.userName}
              </p>
              <p>
                <span className="font-semibold">Fecha:</span>{' '}
                {certificateData.issuedDate.toLocaleDateString('es-ES')}
              </p>
              <p>
                <span className="font-semibold">Certificado N°:</span>{' '}
                {certificateData.certificateNumber}
              </p>
            </div>
          )}

          <CertificateDownload
            certificateData={certificateData}
            variant="primary"
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}

