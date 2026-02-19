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

interface ProjectChangesRequestedEmailProps {
  to: string
  authorName: string
  projectTitle: string
  projectId: string
  mentorFeedback: string[]
}

export async function sendProjectChangesRequestedEmail({
  to,
  authorName,
  projectTitle,
  projectId,
  mentorFeedback,
}: ProjectChangesRequestedEmailProps) {
  console.log('[sendProjectChangesRequestedEmail] Enviando a:', to)

  const resend = getResend()
  if (!resend) {
    console.warn('[sendProjectChangesRequestedEmail] Email no enviado: Resend no configurado')
    return { success: false, error: 'Email service not configured' }
  }

  const editUrl = `https://nodo360.com/dashboard/proyectos/${projectId}/editar`

  const feedbackHtml = mentorFeedback
    .map(
      (feedback) => `
        <div style="background: rgba(0,0,0,0.3); border-left: 4px solid #fbbf24; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 12px;">
          <p style="color: #ffffff; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-line;">
            ${feedback}
          </p>
        </div>
      `
    )
    .join('')

  try {
    const { data, error } = await resend.emails.send({
      from: 'Nodo360 <hola@nodo360.com>',
      to,
      subject: `Tu proyecto "${projectTitle}" necesita algunos cambios`,
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
              <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
              <h2 style="color: #ffffff; font-size: 24px; margin: 0;">
                Hola ${authorName || 'Builder'}
              </h2>
            </div>

            <!-- Contenido principal -->
            <div style="background: linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(247,147,26,0.1) 100%); border: 1px solid rgba(251,191,36,0.3); border-radius: 16px; padding: 32px;">

              <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Los mentores han revisado tu proyecto y sugieren algunos cambios:
              </p>

              <h3 style="color: #fbbf24; font-size: 20px; margin: 0 0 20px 0;">
                "${projectTitle}"
              </h3>

              <!-- Feedback de los mentores -->
              <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
                Feedback de los mentores:
              </p>
              ${feedbackHtml}

              <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 16px 0 24px 0;">
                No te desanimes, esto es parte del proceso para asegurar proyectos de calidad.
                Una vez que realices los cambios, podrás enviar el proyecto nuevamente a revisión.
              </p>

              <!-- CTA Editar -->
              <div style="text-align: center;">
                <a href="${editUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #f7931a 0%, #ff6b35 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Editar mi proyecto
                </a>
              </div>

            </div>

            <!-- Tips -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-top: 24px;">
              <h4 style="color: #ffffff; font-size: 16px; margin: 0 0 16px 0;">
                Consejos para mejorar tu proyecto:
              </h4>
              <ul style="color: #d1d5db; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Asegurate de que el titulo y resumen sean claros</li>
                <li>Incluye una descripcion detallada del alcance del proyecto</li>
                <li>Define claramente los objetivos y entregables</li>
                <li>Selecciona la categoria mas apropiada</li>
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
      console.error('[sendProjectChangesRequestedEmail] Error:', error)
      return { success: false, error: error.message }
    }

    console.log('[sendProjectChangesRequestedEmail] Enviado:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('[sendProjectChangesRequestedEmail] Error critico:', error)
    return { success: false, error: String(error) }
  }
}
