import { Resend } from 'resend'

// Lazy initialization para evitar error durante build
let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] RESEND_API_KEY no está configurada')
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

interface ProjectApprovedEmailProps {
  to: string
  authorName: string
  projectTitle: string
  projectId: string
}

export async function sendProjectApprovedEmail({
  to,
  authorName,
  projectTitle,
  projectId,
}: ProjectApprovedEmailProps) {
  console.log('[sendProjectApprovedEmail] Enviando a:', to)

  const resend = getResend()
  if (!resend) {
    console.warn('[sendProjectApprovedEmail] Email no enviado: Resend no configurado')
    return { success: false, error: 'Email service not configured' }
  }

  const projectUrl = `https://nodo360.com/proyectos/${projectId}`
  const dashboardUrl = `https://nodo360.com/dashboard/proyectos`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Nodo360 <hola@nodo360.com>',
      to,
      subject: `Tu proyecto "${projectTitle}" ha sido aprobado`,
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
              <h1 style="color: #f7931a; font-size: 32px; margin: 0;">B Nodo360</h1>
              <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Proyectos Comunitarios</p>
            </div>

            <!-- Icono -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h2 style="color: #ffffff; font-size: 24px; margin: 0;">
                ¡Felicidades ${authorName || 'Builder'}!
              </h2>
            </div>

            <!-- Contenido principal -->
            <div style="background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(22,163,74,0.1) 100%); border: 1px solid rgba(34,197,94,0.3); border-radius: 16px; padding: 32px;">

              <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Tu proyecto ha sido aprobado por los mentores de la comunidad:
              </p>

              <h3 style="color: #22c55e; font-size: 20px; margin: 0 0 20px 0;">
                "${projectTitle}"
              </h3>

              <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Ahora tu proyecto es visible para toda la comunidad. Puedes comenzar a trabajar en él,
                invitar colaboradores y publicar actualizaciones de progreso.
              </p>

              <!-- CTA -->
              <div style="text-align: center;">
                <a href="${projectUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Ver mi proyecto
                </a>
              </div>

            </div>

            <!-- Pasos siguientes -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-top: 24px;">
              <h4 style="color: #ffffff; font-size: 16px; margin: 0 0 16px 0;">
                Proximos pasos:
              </h4>
              <ul style="color: #d1d5db; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Inicia tu proyecto cuando estes listo para comenzar</li>
                <li>Invita colaboradores de la comunidad</li>
                <li>Publica actualizaciones de progreso regularmente</li>
                <li>Comparte tu proyecto en la comunidad de Discord</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                ¿Necesitas ayuda? Escríbenos a
                <a href="mailto:hola@nodo360.com" style="color: #f7931a; text-decoration: none;">
                  hola@nodo360.com
                </a>
              </p>
              <p style="color: #4b5563; font-size: 12px; margin: 0;">
                2026 Nodo360. Educacion Bitcoin en Espanol.
              </p>
            </div>

          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('[sendProjectApprovedEmail] Error:', error)
      return { success: false, error: error.message }
    }

    console.log('[sendProjectApprovedEmail] Enviado:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('[sendProjectApprovedEmail] Error critico:', error)
    return { success: false, error: String(error) }
  }
}
