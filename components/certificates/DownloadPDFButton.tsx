'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { Download } from 'lucide-react'

interface CertificateData {
  certificateNumber: string
  userName: string
  courseTitle: string
  courseDescription?: string | null
  issuedAt: string
  score?: number | null
  type: 'course' | 'module'
}

interface DownloadPDFButtonProps {
  certificate: CertificateData
  verificationUrl: string
  className?: string
}

export function DownloadPDFButton({
  certificate,
  verificationUrl,
  className = ''
}: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Fondo oscuro
      doc.setFillColor(7, 10, 16)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      // Borde decorativo exterior
      doc.setDrawColor(255, 107, 53)
      doc.setLineWidth(1)
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16)

      // Borde interior
      doc.setDrawColor(247, 147, 26)
      doc.setLineWidth(0.5)
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24)

      // Esquinas decorativas
      const cornerSize = 15
      doc.setDrawColor(255, 107, 53)
      doc.setLineWidth(2)
      // Esquina superior izquierda
      doc.line(8, 8 + cornerSize, 8, 8)
      doc.line(8, 8, 8 + cornerSize, 8)
      // Esquina superior derecha
      doc.line(pageWidth - 8 - cornerSize, 8, pageWidth - 8, 8)
      doc.line(pageWidth - 8, 8, pageWidth - 8, 8 + cornerSize)
      // Esquina inferior izquierda
      doc.line(8, pageHeight - 8 - cornerSize, 8, pageHeight - 8)
      doc.line(8, pageHeight - 8, 8 + cornerSize, pageHeight - 8)
      // Esquina inferior derecha
      doc.line(pageWidth - 8 - cornerSize, pageHeight - 8, pageWidth - 8, pageHeight - 8)
      doc.line(pageWidth - 8, pageHeight - 8 - cornerSize, pageWidth - 8, pageHeight - 8)

      // Logo NODO360
      doc.setFontSize(16)
      doc.setTextColor(247, 147, 26)
      doc.setFont('helvetica', 'bold')
      doc.text('NODO360', 25, 28)

      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'normal')
      doc.text('Educacion Bitcoin & Blockchain', 25, 34)

      // Numero de certificado
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('No de certificado', pageWidth - 25, 26, { align: 'right' })
      doc.setFontSize(10)
      doc.setTextColor(255, 107, 53)
      doc.setFont('helvetica', 'bold')
      doc.text(certificate.certificateNumber, pageWidth - 25, 33, { align: 'right' })

      // Icono decorativo (circulo con checkmark simulado)
      doc.setFillColor(247, 147, 26)
      doc.circle(pageWidth / 2, 52, 8, 'F')
      doc.setTextColor(7, 10, 16)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('✓', pageWidth / 2 - 2.5, 55)

      // Tipo de certificado
      const certType = certificate.type === 'module' ? 'CERTIFICADO DE MODULO' : 'CERTIFICADO DE FINALIZACION'
      doc.setFontSize(11)
      doc.setTextColor(180, 180, 180)
      doc.setFont('helvetica', 'normal')
      doc.text(certType, pageWidth / 2, 70, { align: 'center' })

      // Linea decorativa
      doc.setDrawColor(247, 147, 26)
      doc.setLineWidth(0.3)
      doc.line(pageWidth / 2 - 50, 75, pageWidth / 2 + 50, 75)

      // "Se certifica que"
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text('Se certifica que', pageWidth / 2, 88, { align: 'center' })

      // Nombre del usuario (mas grande y destacado)
      doc.setFontSize(28)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text(certificate.userName, pageWidth / 2, 105, { align: 'center' })

      // "ha completado satisfactoriamente el curso"
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'normal')
      doc.text('ha completado satisfactoriamente el curso', pageWidth / 2, 118, { align: 'center' })

      // Nombre del curso
      doc.setFontSize(20)
      doc.setTextColor(247, 147, 26)
      doc.setFont('helvetica', 'bold')
      // Truncar titulo si es muy largo
      let courseTitle = certificate.courseTitle
      if (courseTitle.length > 50) {
        courseTitle = courseTitle.substring(0, 47) + '...'
      }
      doc.text(courseTitle, pageWidth / 2, 135, { align: 'center' })

      // Descripcion del curso (si existe)
      let yPosition = 147
      if (certificate.courseDescription) {
        doc.setFontSize(9)
        doc.setTextColor(130, 130, 130)
        doc.setFont('helvetica', 'normal')
        const maxWidth = pageWidth - 100
        const lines = doc.splitTextToSize(certificate.courseDescription, maxWidth)
        doc.text(lines.slice(0, 2), pageWidth / 2, yPosition, { align: 'center' })
        yPosition += lines.slice(0, 2).length * 5 + 5
      }

      // Puntuacion (si existe)
      if (certificate.score) {
        doc.setFontSize(11)
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.text(`Puntuacion: ${certificate.score}%`, pageWidth / 2, yPosition + 8, { align: 'center' })
      }

      // Fecha de emision
      const formattedDate = new Date(certificate.issuedAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'normal')
      doc.text(`Emitido el ${formattedDate}`, pageWidth / 2, 178, { align: 'center' })

      // URL de verificacion
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('Verifica este certificado en:', pageWidth / 2, 190, { align: 'center' })
      doc.setTextColor(255, 107, 53)
      doc.text(verificationUrl, pageWidth / 2, 196, { align: 'center' })

      // Descargar el PDF
      doc.save(`certificado-${certificate.certificateNumber}.pdf`)

    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF. Intentalo de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-medium rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isGenerating ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Generando...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Descargar PDF</span>
        </>
      )}
    </button>
  )
}

export default DownloadPDFButton
