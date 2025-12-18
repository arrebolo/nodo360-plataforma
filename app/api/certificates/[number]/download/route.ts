import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"

// ===============================
// GET /api/certificates/[number]/download
// ===============================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params
  const certificateNumber = decodeURIComponent(number)
  const supabase = await createClient()

  console.log("🔍 [PDF] Generando certificado:", certificateNumber)

  /* ----------------------------------------
     1) Cargar certificado desde Supabase
  ---------------------------------------- */
  const { data: cert, error } = await supabase
    .from("certificates")
    .select(
      `
      certificate_number,
      issued_at,
      user:users(full_name, email),
      course:courses(title, slug)
    `
    )
    .eq("certificate_number", certificateNumber)
    .maybeSingle()

  if (error || !cert) {
    console.error("❌ [PDF] Certificado no encontrado:", error)
    return NextResponse.json(
      { error: "Certificado no encontrado" },
      { status: 404 }
    )
  }

  /* ----------------------------------------
     2) Extraer datos de relaciones (pueden ser objetos o arrays según tipos)
  ---------------------------------------- */
  const userData = Array.isArray(cert.user) ? cert.user[0] : cert.user
  const courseData = Array.isArray(cert.course) ? cert.course[0] : cert.course

  /* ----------------------------------------
     3) Preparar datos
  ---------------------------------------- */
  const issuedDate = new Date(cert.issued_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/certificados/${certificateNumber}`

  /* ----------------------------------------
     3) Generar QR
  ---------------------------------------- */
  const qrDataUrl = await QRCode.toDataURL(verificationUrl)
  const qrImageBase64 = qrDataUrl.split(",")[1]
  const qrBuffer = Buffer.from(qrImageBase64, "base64")

  /* ----------------------------------------
     4) Crear PDF con pdf-lib
  ---------------------------------------- */
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([842, 595]) // A4 horizontal
  const { width, height } = page.getSize()

  const fontTitle = await pdf.embedFont(StandardFonts.HelveticaBold)
  const fontText = await pdf.embedFont(StandardFonts.Helvetica)

  /* Colores */
  const orange = rgb(0.97, 0.45, 0.10) // #F7931A
  const orangeSoft = rgb(1, 0.52, 0.22) // #FF6B35
  const white = rgb(1, 1, 1)
  const lightGray = rgb(0.8, 0.8, 0.8)

  /* Fondo */
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.04, 0.05, 0.08), // #0F1419
  })

  /* Bordes estilo Web3 */
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderWidth: 4,
    borderColor: orange,
  })

  /* Título principal */
  const title = "Certificado Oficial de Finalización"
  page.drawText(title, {
    x: 80,
    y: height - 120,
    size: 32,
    font: fontTitle,
    color: orangeSoft,
  })

  /* Nombre del alumno */
  page.drawText(userData?.full_name || "Estudiante", {
    x: 80,
    y: height - 180,
    size: 26,
    font: fontTitle,
    color: white,
  })

  /* Texto descriptivo */
  const text = `Ha completado satisfactoriamente el curso:`
  page.drawText(text, {
    x: 80,
    y: height - 220,
    size: 16,
    font: fontText,
    color: lightGray,
  })

  /* Título del curso */
  page.drawText(courseData?.title || "Curso", {
    x: 80,
    y: height - 255,
    size: 22,
    font: fontTitle,
    color: white,
  })

  /* Fecha */
  page.drawText(`Emitido el ${issuedDate}`, {
    x: 80,
    y: height - 300,
    size: 14,
    font: fontText,
    color: lightGray,
  })

  /* Número de certificado */
  page.drawText(`Nº de certificado: ${cert.certificate_number}`, {
    x: 80,
    y: height - 330,
    size: 14,
    font: fontText,
    color: orange,
  })

  /* Firma visual */
  page.drawText("Nodo360 Educación Web3", {
    x: 80,
    y: 80,
    size: 16,
    font: fontTitle,
    color: orangeSoft,
  })

  /* ----------------------------------------
     5) Insertar QR
  ---------------------------------------- */
  const qrImage = await pdf.embedPng(qrBuffer)
  const qrSize = 150

  page.drawImage(qrImage, {
    x: width - qrSize - 80,
    y: 80,
    width: qrSize,
    height: qrSize,
  })

  /* URL bajo el QR */
  page.drawText("Verificación:", {
    x: width - qrSize - 80,
    y: 55,
    size: 10,
    font: fontText,
    color: white,
  })

  page.drawText(verificationUrl, {
    x: width - qrSize - 80,
    y: 40,
    size: 10,
    font: fontText,
    color: orange,
  })

  /* ----------------------------------------
     6) Responder PDF
  ---------------------------------------- */
  const pdfBytes = await pdf.save()

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${certificateNumber}.pdf"`,
    },
  })
}
