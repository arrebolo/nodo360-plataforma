'use client'

import { useEffect, useState } from 'react'
import { Download, Share2, Eye, ExternalLink, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'

interface CertificatePreviewProps {
  certificateUrl: string
  certificateNumber: string
  verificationUrl?: string
  userName: string
  courseTitle: string
  moduleTitle?: string
  issuedDate: Date
  type: 'module' | 'course'
}

export function CertificatePreview({
  certificateUrl,
  certificateNumber,
  verificationUrl,
  userName,
  courseTitle,
  moduleTitle,
  issuedDate,
  type,
}: CertificatePreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!verificationUrl) return

    QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(setQrCodeUrl)
      .catch((err) => console.error('QR error:', err))
  }, [verificationUrl])

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(certificateUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `Nodo360_Certificado_${certificateNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      alert('Error al descargar el certificado.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      verificationUrl || window.location.href
    )}`
    window.open(linkedInUrl, '_blank', 'width=600,height=600')

    alert(
      'Para compartir tu certificado en LinkedIn:\n\n' +
        '1. Descarga el PDF\n' +
        '2. Perfil → Licencias y certificaciones\n' +
        '3. Sube el PDF\n' +
        '4. Publica'
    )
  }

  return (
    <div className="space-y-8">
      {/* Preview */}
      <div className="bg-white/5 border border-dark-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Eye className="w-5 h-5 text-brand" />
            <h3 className="font-semibold">Vista previa</h3>
          </div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-muted hover:text-white transition"
          >
            {showPreview ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showPreview && (
          <div className="bg-white/15">
            <iframe
              src={certificateUrl}
              className="w-full h-[600px]"
              title="Certificate preview"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="
            flex items-center justify-center gap-2 px-6 py-4
            bg-gradient-to-r from-brand-light to-brand
            text-white font-semibold rounded-lg
            hover:shadow-lg hover:shadow-brand/20
            transition disabled:opacity-50
          "
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Descargando…
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Descargar PDF
            </>
          )}
        </button>

        <button
          onClick={handleShareLinkedIn}
          className="
            flex items-center justify-center gap-2 px-6 py-4
            bg-linkedin text-white font-semibold rounded-lg
            hover:bg-linkedin/90 transition
          "
        >
          <Share2 className="w-5 h-5" />
          LinkedIn
        </button>

        <a
          href={certificateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex items-center justify-center gap-2 px-6 py-4
            bg-white/5 border border-dark-border
            text-white font-semibold rounded-lg
            hover:bg-white/10 transition
          "
        >
          <ExternalLink className="w-5 h-5" />
          Abrir
        </a>
      </div>

      {/* Details */}
      <div className="bg-white/5 border border-dark-border rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Detalles del certificado
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted">Número</label>
              <p className="font-mono font-semibold text-brand">
                {certificateNumber}
              </p>
            </div>

            <div>
              <label className="text-sm text-muted">Otorgado a</label>
              <p className="text-white">{userName}</p>
            </div>

            <div>
              <label className="text-sm text-muted">Curso</label>
              <p className="text-white">{courseTitle}</p>
            </div>

            {moduleTitle && (
              <div>
                <label className="text-sm text-muted">Módulo</label>
                <p className="text-white">{moduleTitle}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-muted">Fecha</label>
              <p className="text-white">
                {issuedDate.toLocaleDateString('es-ES')}
              </p>
            </div>

            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  type === 'module'
                    ? 'bg-info/15 text-info'
                    : 'bg-success/15 text-success'
                }`}
              >
                {type === 'module'
                  ? 'Certificado de módulo'
                  : 'Certificado de curso'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl">
            {qrCodeUrl ? (
              <>
                <img src={qrCodeUrl} alt="QR verificación" className="w-48 h-48" />
                <p className="text-sm text-white/40 mt-3">
                  Escanea para verificar
                </p>
              </>
            ) : (
              <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            )}
          </div>
        </div>
      </div>

      {verificationUrl && (
        <div className="bg-info/10 border border-info/30 rounded-lg p-4">
          <p className="text-sm text-info">
            Este certificado es verificable públicamente mediante el código QR o
            la URL asociada.
          </p>
        </div>
      )}

      <div className="bg-white/5 border border-dark-border rounded-lg p-6">
        <h4 className="text-white font-semibold mb-3">
          Cómo compartir tu certificado
        </h4>
        <ul className="space-y-2 text-sm text-muted">
          <li>• LinkedIn: Licencias y certificaciones</li>
          <li>• Portafolio personal</li>
          <li>• Redes sociales mediante URL verificable</li>
          <li>• CV adjuntando PDF o enlace</li>
        </ul>
      </div>
    </div>
  )
}
