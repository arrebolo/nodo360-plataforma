/**
 * Certificate Generator
 *
 * Generates PDF certificates for module and course completion
 * - Uses jsPDF for PDF generation
 * - Includes QR code for verification
 * - Professional design with Nodo360 branding
 */

import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { Certificate, User, Course, Module } from '@/types/database'

export interface CertificateData {
  certificateNumber: string
  userName: string
  userEmail?: string
  courseTitle: string
  moduleTitle?: string // For module certificates
  type: 'module' | 'course'
  issuedDate: Date
  verificationUrl?: string
}

/**
 * Generate a certificate PDF
 *
 * @param data - Certificate data
 * @returns Promise<Blob> - PDF blob
 */
export async function generateCertificatePDF(
  data: CertificateData
): Promise<Blob> {
  // Create PDF (A4 landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Colors
  const bitcoinOrange = '#F7931A'
  const nodoOrange = '#ff6b35'
  const gold = '#FFD700'

  // Background gradient simulation (using rectangles)
  doc.setFillColor(26, 31, 46) // Dark blue background
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Border
  doc.setDrawColor(255, 107, 53) // Nodo Orange
  doc.setLineWidth(1)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S')

  // Inner border
  doc.setDrawColor(247, 147, 26) // Bitcoin Orange
  doc.setLineWidth(0.5)
  doc.rect(12, 12, pageWidth - 24, pageHeight - 16, 'S')

  // Header - "CERTIFICADO"
  doc.setFontSize(48)
  doc.setTextColor(255, 215, 0) // Gold
  doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICADO', pageWidth / 2, 35, { align: 'center' })

  // Subtitle - "DE COMPLETACIÓN"
  doc.setFontSize(18)
  doc.setTextColor(200, 200, 200)
  doc.setFont('helvetica', 'normal')
  doc.text('DE COMPLETACIÓN', pageWidth / 2, 45, { align: 'center' })

  // Decorative line
  doc.setDrawColor(255, 107, 53)
  doc.setLineWidth(0.5)
  doc.line(pageWidth / 2 - 40, 50, pageWidth / 2 + 40, 50)

  // Main text - "Se otorga a"
  doc.setFontSize(14)
  doc.setTextColor(180, 180, 180)
  doc.text('Se otorga a', pageWidth / 2, 65, { align: 'center' })

  // User name
  doc.setFontSize(32)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(data.userName, pageWidth / 2, 80, { align: 'center' })

  // Recognition text
  doc.setFontSize(14)
  doc.setTextColor(180, 180, 180)
  doc.setFont('helvetica', 'normal')
  doc.text('Por completar exitosamente', pageWidth / 2, 95, { align: 'center' })

  // Course/Module title
  doc.setFontSize(20)
  doc.setTextColor(255, 215, 0) // Gold
  doc.setFont('helvetica', 'bold')

  if (data.type === 'module' && data.moduleTitle) {
    doc.text(data.moduleTitle, pageWidth / 2, 110, { align: 'center' })
    doc.setFontSize(16)
    doc.setTextColor(200, 200, 200)
    doc.text(`del curso "${data.courseTitle}"`, pageWidth / 2, 120, {
      align: 'center',
    })
  } else {
    doc.text(data.courseTitle, pageWidth / 2, 115, { align: 'center' })
  }

  // Platform name
  doc.setFontSize(14)
  doc.setTextColor(255, 107, 53)
  doc.setFont('helvetica', 'bold')
  doc.text('NODO360', pageWidth / 2, 135, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(180, 180, 180)
  doc.setFont('helvetica', 'normal')
  doc.text('Plataforma Educativa de Bitcoin y Blockchain', pageWidth / 2, 142, {
    align: 'center',
  })

  // Date and certificate number
  const dateStr = data.issuedDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text(`Fecha de emisión: ${dateStr}`, pageWidth / 2, 155, {
    align: 'center',
  })
  doc.text(`Certificado N°: ${data.certificateNumber}`, pageWidth / 2, 162, {
    align: 'center',
  })

  // QR Code for verification
  if (data.verificationUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#FFFFFF',
          light: '#1a1f2e',
        },
      })

      // Add QR code
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 40, pageHeight - 40, 30, 30)

      // QR label
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Verificar', pageWidth - 25, pageHeight - 8, { align: 'center' })
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  // Footer - signature line
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.3)
  doc.line(40, pageHeight - 30, 100, pageHeight - 30)

  doc.setFontSize(10)
  doc.setTextColor(180, 180, 180)
  doc.text('Equipo Nodo360', 70, pageHeight - 25, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Directores de la Plataforma', 70, pageHeight - 20, { align: 'center' })

  // Bitcoin logo/symbol (simple text representation)
  doc.setFontSize(24)
  doc.setTextColor(247, 147, 26) // Bitcoin orange
  doc.text('₿', 25, pageHeight - 22)

  // Convert to blob
  const pdfBlob = doc.output('blob')
  return pdfBlob
}

/**
 * Download certificate PDF
 *
 * @param blob - PDF blob
 * @param fileName - File name for download
 */
export function downloadCertificatePDF(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate certificate file name
 *
 * @param data - Certificate data
 * @returns File name
 */
export function generateCertificateFileName(data: CertificateData): string {
  const userName = data.userName.replace(/\s+/g, '_')
  const type = data.type === 'module' ? 'modulo' : 'curso'
  const date = data.issuedDate.toISOString().split('T')[0]

  return `Nodo360_Certificado_${type}_${userName}_${date}.pdf`
}

/**
 * Create certificate from database record
 *
 * Helper function to convert database certificate to PDF
 */
export async function createCertificateFromRecord(
  certificate: Certificate,
  user: User,
  course: Course,
  module?: Module | null
): Promise<Blob> {
  const verificationUrl = certificate.verification_url ||
    `${process.env.NEXT_PUBLIC_SITE_URL}/certificados/${certificate.certificate_number}`

  const data: CertificateData = {
    certificateNumber: certificate.certificate_number,
    userName: user.full_name || user.email,
    userEmail: user.email,
    courseTitle: course.title,
    moduleTitle: module?.title,
    type: certificate.type,
    issuedDate: new Date(certificate.issued_at),
    verificationUrl,
  }

  return generateCertificatePDF(data)
}


