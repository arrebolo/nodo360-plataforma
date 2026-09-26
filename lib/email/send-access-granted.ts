import { getResend, REMITENTE_NODO360 } from '@/lib/email/resend-client'

const ENLACE_CURSOS = 'https://nodo360.com/cursos'

/**
 * Lo que se lee en el correo, en texto plano.
 *
 * Se manda junto al HTML como alternativa `text`: antes solo iba el HTML, y un
 * correo sin parte en texto plano puntúa peor en los filtros de spam y no se
 * puede leer en un cliente que no renderiza HTML.
 */
function versionEnTexto(saludo: string) {
  return `${saludo}

Tu cuenta tiene acceso completo a Nodo360. No hay nada que activar ni ningún paso pendiente: entra con el mismo correo con el que te registraste.

Entrar en Nodo360: ${ENLACE_CURSOS}

QUÉ TIENES DISPONIBLE
- Cursos organizados en rutas de aprendizaje, para llevar un orden
- Todos gratuitos
- Al final de cada curso hay un examen; al aprobarlo se emite un certificado verificable
- Una comunidad en Discord para preguntar dudas

Si algo no funciona o tienes una duda, escríbenos a soporte@nodo360.com y te contestamos.

© 2026 Nodo360. Educación sobre Bitcoin y Web3 en español.`
}

/**
 * Aviso de que una cuenta tiene acceso a la plataforma.
 *
 * El texto hablaba de «la Beta» y de «beta privada» hasta el 27/09/2026. Eso
 * dejó de ser verdad cuando el middleware dejó de comprobar el acceso beta:
 * cualquier cuenta autenticada entra. Un correo que anuncia que «tu acceso a la
 * beta privada ha sido habilitado» le cuenta al alumno una plataforma que no
 * existe, y de paso sugiere que acaba de pasar algo cuando puede llevar meses
 * con acceso.
 *
 * Aquí no hay cifras del catálogo a propósito —ni «10 cursos» ni «6 rutas»—,
 * por la misma razón que no las hay en CLAUDE.md: esta plantilla se va a usar
 * dentro de un año y las cifras envejecen y acaban mintiendo. El aviso puntual
 * que se envió a mano el 26/09/2026 sí las llevaba, porque era de un solo uso.
 */
export async function sendAccessGrantedEmail(
  userEmail: string,
  userName: string
) {
  console.log('📧 [sendAccessGrantedEmail] Enviando email a:', userEmail)

  const resend = getResend()
  if (!resend) {
    // Devolver, no lanzar: este correo no puede tumbar la acción que lo
    // dispara. getResend() ya lo ha registrado con ❌.
    console.error('❌ [sendAccessGrantedEmail] Email no enviado: Resend no configurado')
    return { success: false, error: 'Email service not configured' }
  }

  // Sin nombre, se saluda sin nombre. El «Hola Usuario» de antes era peor que
  // no saludar.
  const nombre = userName?.trim()
  const saludo = nombre ? `Hola ${nombre}: ya puedes entrar` : 'Ya puedes entrar'

  try {
    const { data, error } = await resend.emails.send({
      from: REMITENTE_NODO360,
      to: userEmail,
      subject: 'Tu cuenta de Nodo360 ya tiene acceso completo',
      text: versionEnTexto(saludo),
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #070a10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #f7931a; font-size: 28px; margin: 0;">Nodo360</h1>
            </div>

            <!-- Card principal -->
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">

              <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 20px 0;">
                ${saludo}
              </h2>

              <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Tu cuenta tiene acceso completo a Nodo360. No hay nada que activar
                ni ningún paso pendiente: entra con el mismo correo con el que te
                registraste.
              </p>

              <div style="text-align: center;">
                <a href="${ENLACE_CURSOS}"
                   style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Entrar en Nodo360
                </a>
              </div>

            </div>

            <!-- Que tienes disponible -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 24px; margin-top: 20px;">
              <h3 style="color: #ffffff; font-size: 16px; margin: 0 0 14px 0;">
                Qué tienes disponible
              </h3>
              <ul style="color: #d1d5db; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Cursos organizados en rutas de aprendizaje, para llevar un orden</li>
                <li>Todos gratuitos</li>
                <li>Al final de cada curso hay un examen; al aprobarlo se emite un certificado verificable</li>
                <li>Una comunidad en Discord para preguntar dudas</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                Si algo no funciona o tienes una duda, escríbenos a
                <a href="mailto:soporte@nodo360.com" style="color: #f7931a; text-decoration: none;">soporte@nodo360.com</a>
                y te contestamos.
              </p>
              <p style="color: #4b5563; font-size: 12px; margin: 0;">
                © 2026 Nodo360. Educación sobre Bitcoin y Web3 en español.
              </p>
            </div>

          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('❌ [sendAccessGrantedEmail] Error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [sendAccessGrantedEmail] Email enviado:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('❌ [sendAccessGrantedEmail] Error crítico:', error)
    return { success: false, error: String(error) }
  }
}
