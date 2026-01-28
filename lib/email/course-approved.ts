import { Resend } from 'resend'

// Lazy initialization para evitar error durante build
let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ [Resend] RESEND_API_KEY no está configurada')
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

interface CourseApprovedEmailProps {
  to: string
  instructorName: string
  courseName: string
  courseSlug: string
}

export async function sendCourseApprovedEmail({
  to,
  instructorName,
  courseName,
  courseSlug,
}: CourseApprovedEmailProps) {
  console.log('📧 [sendCourseApprovedEmail] Enviando a:', to)

  const resend = getResend()
  if (!resend) {
    console.warn('⚠️ [sendCourseApprovedEmail] Email no enviado: Resend no configurado')
    return { success: false, error: 'Email service not configured' }
  }

  const courseUrl = `https://nodo360.com/cursos/${courseSlug}`
  const dashboardUrl = 'https://nodo360.com/dashboard/instructor/cursos'

  try {
    const { data, error } = await resend.emails.send({
      from: 'Nodo360 <hola@nodo360.com>',
      to,
      subject: `🎉 ¡Tu curso "${courseName}" ha sido aprobado!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #070a10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #f7931a; font-size: 32px; margin: 0;">₿ Nodo360</h1>
              <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Panel de Instructores</p>
            </div>

            <!-- Celebración -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
              <h2 style="color: #ffffff; font-size: 28px; margin: 0;">
                ¡Felicidades, ${instructorName || 'Instructor'}!
              </h2>
            </div>

            <!-- Contenido principal -->
            <div style="background: linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(247,147,26,0.1) 100%); border: 1px solid rgba(34,197,94,0.3); border-radius: 16px; padding: 32px; text-align: center;">

              <p style="color: #d1d5db; font-size: 18px; line-height: 1.6; margin: 0 0 16px 0;">
                Tu curso ha sido revisado y aprobado:
              </p>

              <h3 style="color: #22c55e; font-size: 24px; margin: 0 0 8px 0;">
                "${courseName}"
              </h3>

              <p style="color: #22c55e; font-size: 16px; margin: 0 0 32px 0;">
                ✓ Ya está publicado y disponible para los estudiantes
              </p>

              <!-- CTA Ver Curso -->
              <div style="margin: 24px 0;">
                <a href="${courseUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Ver mi curso publicado →
                </a>
              </div>

            </div>

            <!-- Tips -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-top: 24px;">
              <h4 style="color: #ffffff; font-size: 16px; margin: 0 0 16px 0;">
                📊 Próximos pasos:
              </h4>
              <ul style="color: #d1d5db; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Comparte el enlace del curso en tus redes sociales</li>
                <li>Revisa las estadísticas en tu panel de instructor</li>
                <li>Responde a las preguntas de tus estudiantes</li>
              </ul>

              <div style="text-align: center; margin-top: 20px;">
                <a href="${dashboardUrl}"
                   style="color: #f7931a; text-decoration: none; font-weight: 600;">
                  Ir a mi panel de instructor →
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                ¿Preguntas? Escríbenos a
                <a href="mailto:instructores@nodo360.com" style="color: #f7931a; text-decoration: none;">
                  instructores@nodo360.com
                </a>
              </p>
              <p style="color: #4b5563; font-size: 12px; margin: 0;">
                © 2026 Nodo360. Educación Bitcoin en Español.
              </p>
            </div>

          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('❌ [sendCourseApprovedEmail] Error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [sendCourseApprovedEmail] Enviado:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('❌ [sendCourseApprovedEmail] Error crítico:', error)
    return { success: false, error: String(error) }
  }
}
