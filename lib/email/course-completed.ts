import { Resend } from 'resend'

// Lazy initialization para evitar error durante build
let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ [Resend] RESEND_API_KEY no está configurada')
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

interface CourseCompletedEmailProps {
  to: string
  userName: string
  courseName: string
  certificateUrl: string
  xpEarned: number
  newLevel?: number
}

export async function sendCourseCompletedEmail({
  to,
  userName,
  courseName,
  certificateUrl,
  xpEarned,
  newLevel
}: CourseCompletedEmailProps) {
  console.log('📧 [sendCourseCompletedEmail] Enviando a:', to)

  const resend = getResend()
  if (!resend) {
    console.error('❌ [sendCourseCompletedEmail] No se puede enviar email: Resend no configurado')
    throw new Error('Email service not configured')
  }

  // Construir sección de nivel si subió
  const levelUpSection = newLevel ? `
    <div style="text-align: center; margin-top: 16px;">
      <div style="color: #22c55e; font-size: 24px; font-weight: bold;">🎉 ¡Nivel ${newLevel}!</div>
      <div style="color: #9ca3af; font-size: 14px;">¡Subiste de nivel!</div>
    </div>
  ` : ''

  try {
    const { data, error } = await resend.emails.send({
      from: 'Nodo360 <hola@nodo360.com>',
      to,
      subject: `🎓 ¡Felicidades! Completaste "${courseName}"`,
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
            </div>

            <!-- Celebración -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 64px; margin-bottom: 16px;">🎓</div>
              <h2 style="color: #ffffff; font-size: 28px; margin: 0;">
                ¡Felicidades, ${userName || 'Usuario'}!
              </h2>
            </div>

            <!-- Contenido -->
            <div style="background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(247,147,26,0.1) 100%); border: 1px solid rgba(34,197,94,0.3); border-radius: 16px; padding: 32px; text-align: center;">

              <p style="color: #d1d5db; font-size: 18px; line-height: 1.6; margin: 0 0 16px 0;">
                Has completado exitosamente el curso:
              </p>

              <h3 style="color: #22c55e; font-size: 24px; margin: 0 0 24px 0;">
                "${courseName}"
              </h3>

              <!-- Stats -->
              <div style="text-align: center; margin: 24px 0;">
                <div style="color: #f7931a; font-size: 32px; font-weight: bold;">+${xpEarned} XP</div>
                <div style="color: #9ca3af; font-size: 14px;">XP Ganados</div>
              </div>

              ${levelUpSection}

              <!-- CTA Certificado -->
              <div style="margin: 32px 0;">
                <a href="${certificateUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  📜 Ver mi certificado
                </a>
              </div>

              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Tu certificado es verificable públicamente y está disponible en tu perfil.
              </p>

            </div>

            <!-- Siguiente paso -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-top: 24px; text-align: center;">
              <p style="color: #d1d5db; font-size: 16px; margin: 0 0 16px 0;">
                ¿Listo para seguir aprendiendo?
              </p>
              <a href="https://nodo360.com/cursos"
                 style="color: #f7931a; text-decoration: none; font-weight: 600;">
                Explorar más cursos →
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                ¿Preguntas? Escríbenos a
                <a href="mailto:soporte@nodo360.com" style="color: #f7931a; text-decoration: none;">
                  soporte@nodo360.com
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
      console.error('❌ [sendCourseCompletedEmail] Error:', error)
      throw error
    }

    console.log('✅ [sendCourseCompletedEmail] Enviado:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('❌ [sendCourseCompletedEmail] Error crítico:', error)
    throw error
  }
}
