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

interface WelcomeEmailProps {
  to: string
  userName: string
}

export async function sendWelcomeEmail({ to, userName }: WelcomeEmailProps) {
  console.log('📧 [sendWelcomeEmail] Enviando a:', to)

  const resend = getResend()
  if (!resend) {
    console.error('❌ [sendWelcomeEmail] No se puede enviar email: Resend no configurado')
    throw new Error('Email service not configured')
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Nodo360 <hola@nodo360.com>',
      to,
      subject: '🎉 ¡Bienvenido a Nodo360!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #070a10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <!-- Header con logo -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #f7931a; font-size: 32px; margin: 0;">₿ Nodo360</h1>
              <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Educación Bitcoin en Español</p>
            </div>

            <!-- Contenido principal -->
            <div style="background: linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(247,147,26,0.1) 100%); border: 1px solid rgba(247,147,26,0.2); border-radius: 16px; padding: 32px;">

              <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">
                ¡Hola ${userName || 'Usuario'}! 👋
              </h2>

              <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Bienvenido a <strong style="color: #f7931a;">Nodo360</strong>, tu plataforma de educación Bitcoin y Blockchain en español.
              </p>

              <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Estás a punto de comenzar un viaje increíble hacia el conocimiento descentralizado. Aquí encontrarás:
              </p>

              <ul style="color: #d1d5db; font-size: 15px; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
                <li>📚 Cursos estructurados desde principiante hasta avanzado</li>
                <li>🏆 Sistema de gamificación con XP y badges</li>
                <li>📜 Certificados al completar cursos</li>
                <li>🗳️ Participación en gobernanza comunitaria</li>
              </ul>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://nodo360.com/dashboard"
                   style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Comenzar a aprender →
                </a>
              </div>

              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
                Tu primer paso: explora nuestro curso <strong style="color: #f7931a;">"Bitcoin para Principiantes"</strong> y gana tus primeros XP.
              </p>

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
      console.error('❌ [sendWelcomeEmail] Error:', error)
      throw error
    }

    console.log('✅ [sendWelcomeEmail] Enviado:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('❌ [sendWelcomeEmail] Error crítico:', error)
    throw error
  }
}
