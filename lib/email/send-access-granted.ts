import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAccessGrantedEmail(
  userEmail: string,
  userName: string
) {
  console.log('[sendAccessGrantedEmail] Enviando email a:', userEmail)

  try {
    const { data, error } = await resend.emails.send({
      from: 'Nodo360 <hola@nodo360.com>',
      to: userEmail,
      subject: '¡Tu acceso a Nodo360 esta listo!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #070a10; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <!-- Header con logo -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f7931a; font-size: 28px; margin: 0;">Nodo360</h1>
            </div>

            <!-- Card principal -->
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px 30px; text-align: center;">

              <!-- Titulo -->
              <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 15px 0;">
                ¡Bienvenido a la Beta, ${userName || 'Usuario'}!
              </h2>

              <!-- Mensaje -->
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Tu acceso a la beta privada de Nodo360 ha sido habilitado.
                Ya puedes explorar todos los cursos y comenzar tu aprendizaje
                sobre Bitcoin y Blockchain.
              </p>

              <!-- Boton CTA -->
              <a href="https://www.nodo360.com/dashboard"
                 style="display: inline-block;
                        background: linear-gradient(to right, #ff6b35, #f7931a);
                        color: #ffffff;
                        text-decoration: none;
                        padding: 16px 40px;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;">
                Ir a mi Dashboard
              </a>

            </div>

            <!-- Que puedes hacer -->
            <div style="margin-top: 30px; padding: 25px; background: rgba(255,255,255,0.05); border-radius: 12px;">
              <h3 style="color: #ffffff; font-size: 16px; margin: 0 0 15px 0;">
                ¿Que puedes hacer ahora?
              </h3>
              <ul style="color: #9ca3af; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Explorar todos los cursos disponibles</li>
                <li>Comenzar tu primera ruta de aprendizaje</li>
                <li>Ganar XP y desbloquear logros</li>
                <li>Unirte a la comunidad de estudiantes</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                ¿Preguntas? Escribenos a
                <a href="mailto:soporte@nodo360.com" style="color: #f7931a; text-decoration: none;">
                  soporte@nodo360.com
                </a>
              </p>
              <p style="color: #4b5563; font-size: 12px; margin: 0;">
                2024 Nodo360. Todos los derechos reservados.
              </p>
            </div>

          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('[sendAccessGrantedEmail] Error:', error)
      throw error
    }

    console.log('[sendAccessGrantedEmail] Email enviado:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('[sendAccessGrantedEmail] Error critico:', error)
    throw error
  }
}
