'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface DownloadPDFButtonProps {
  certificateId?: string
  certificateNumber: string
}

export function DownloadPDFButton({ certificateNumber }: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/certificates/${encodeURIComponent(certificateNumber)}/download`)

      if (response.status === 401) {
        setError('Inicia sesion para descargar')
        return
      }

      if (response.status === 403) {
        setError('Solo el propietario puede descargar')
        return
      }

      if (!response.ok) {
        setError('Error al generar PDF')
        return
      }

      // Descargar el PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificado-${certificateNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      setError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#f7931a] to-[#ff6b35] hover:opacity-90 disabled:opacity-50 rounded-xl text-white font-medium transition-all shadow-lg shadow-[#f7931a]/20"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generando PDF...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Descargar PDF
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
