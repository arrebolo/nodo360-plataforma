import { getResend, REMITENTE_NODO360 } from '@/lib/email/resend-client'

interface BadgeEarnedEmailProps {
  to: string
  userName: string
  badgeName: string
  badgeDescription: string
  badgeIcon: string // emoji
}

export async function sendBadgeEarnedEmail({
  to,
  userName,
  badgeName,
  badgeDescription,
  badgeIcon
}: BadgeEarnedEmailProps) {
  console.log('📧 [sendBadgeEarnedEmail] Enviando a:', to)

  const resend = getResend()
  if (!resend) {
    // Devolver, no lanzar: este correo no puede tumbar la acción que lo
    // dispara. getResend() ya lo ha registrado con ❌.
    console.error('❌ [sendBadgeEarnedEmail] Email no enviado: Resend no configurado')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: REMITENTE_NODO360,
      to,
      subject: `🏆 ¡Nuevo logro desbloqueado: ${badgeName}!`,
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

            <!-- Badge -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 80px; margin-bottom: 16px;">${badgeIcon}</div>
              <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">
                ¡Logro desbloqueado!
              </h2>
              <p style="color: #f7931a; font-size: 14px; margin: 0;">
                ${userName || 'Usuario'}
              </p>
            </div>

            <!-- Contenido -->
            <div style="background: linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(247,147,26,0.1) 100%); border: 1px solid rgba(168,85,247,0.3); border-radius: 16px; padding: 32px; text-align: center;">

              <h3 style="color: #a855f7; font-size: 28px; margin: 0 0 16px 0;">
                ${badgeName}
              </h3>

              <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${badgeDescription}
              </p>

              <!-- CTA -->
              <a href="https://nodo360.com/dashboard/badges"
                 style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Ver todos mis logros →
              </a>

            </div>

            <!-- Motivación -->
            <div style="text-align: center; margin-top: 24px;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Sigue aprendiendo para desbloquear más logros 🚀
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
      console.error('❌ [sendBadgeEarnedEmail] Error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [sendBadgeEarnedEmail] Enviado:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('❌ [sendBadgeEarnedEmail] Error crítico:', error)
    return { success: false, error: String(error) }
  }
}
