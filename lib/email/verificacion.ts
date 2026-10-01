import { getResend, REMITENTE_NODO360, SITIO_PARA_CORREOS } from '@/lib/email/resend-client'
import { escapar } from '@/lib/email/escapar'

/**
 * LOS TRES CORREOS DE UNA VERIFICACION DE INSTRUCTOR
 *
 * Hasta ahora no se enviaba ninguno: al aprobar o rechazar, la persona se
 * enteraba entrando a mirar. Se comprobo en la ruta que resuelve el expediente,
 * que no tenia ni una referencia a correo ni a notificaciones.
 *
 * Van los tres en el mismo fichero porque comparten la envoltura y porque son la
 * misma conversacion: lo que Nodo360 le dice a alguien sobre su verificacion. Lo
 * que cambia es el fondo.
 *
 * El de la RETIRADA no se envio nunca hasta la 111: al retirar una verificacion no
 * se avisaba a nadie, y la persona se enteraba al intentar enviar un curso a
 * revision y encontrarse la puerta cerrada. Esa es la peor forma de enterarse.
 *
 * NI UNA PROMESA DE PAGO. No se menciona dinero, ni ingresos, ni remuneracion:
 * ni para prometerlos ni para negarlos. Este correo va de lo que la persona
 * puede hacer a partir de ahora.
 *
 * El del rechazo lleva el motivo TAL CUAL lo escribio quien evaluo. No se
 * reescribe ni se suaviza: si alguien va a discrepar, tiene que poder discrepar
 * de lo que de verdad se dijo.
 */

const SITIO = SITIO_PARA_CORREOS

/** El texto entre etiquetas viene de la base; aqui no se confia en nada. */
function envoltura(titulo: string, contenido: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #070a10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #f7931a; font-size: 32px; margin: 0;">₿ Nodo360</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Educación Bitcoin en Español</p>
        </div>

        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">
          <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 20px 0;">${escapar(titulo)}</h2>
          ${contenido}
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
            ¿Dudas sobre esto? Escríbenos a
            <a href="mailto:soporte@nodo360.com" style="color: #f7931a; text-decoration: none;">soporte@nodo360.com</a>
          </p>
          <p style="color: #4b5563; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Nodo360. Educación Bitcoin en Español.
          </p>
        </div>

      </div>
    </body>
    </html>
  `
}

const PARRAFO = 'color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;'
const BOTON =
  'display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931a 100%); color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;'

interface DatosComunes {
  to: string
  nombre: string
  especialidad: string
  /** Solo en las especialidades con normativa por pais. */
  jurisdiccion?: string | null
}

/** «Fiscalidad · España», o solo «Fiscalidad» si no aplica jurisdiccion. */
function materia(especialidad: string, jurisdiccion?: string | null): string {
  const j = jurisdiccion?.trim()
  return j ? `${especialidad} · ${j}` : especialidad
}

// =====================================================
// APROBADA
// =====================================================

export async function enviarVerificacionAprobada({
  to,
  nombre,
  especialidad,
  jurisdiccion,
}: DatosComunes) {
  const resend = getResend()
  if (!resend) {
    console.error('❌ [verificacion/aprobada] Resend no configurado')
    return { success: false, error: 'Email service not configured' }
  }

  const mat = escapar(materia(especialidad, jurisdiccion))

  const contenido = `
    <p style="${PARRAFO}">Hola ${escapar(nombre)}:</p>

    <p style="${PARRAFO}">
      El equipo de Nodo360 ha revisado tu solicitud y tu verificación en
      <strong style="color: #f7931a;">${mat}</strong> está aprobada: puedes enseñar esa
      materia en la plataforma.
    </p>

    <p style="${PARRAFO}">A partir de ahora puedes:</p>

    <ul style="color: #d1d5db; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
      <li>Crear cursos de <strong>${mat}</strong> desde tu panel de instructor.</li>
      <li>Enviarlos a revisión cuando estén listos.</li>
      <li>Mostrar tu sello de verificación en tu perfil público.</li>
    </ul>

    <p style="${PARRAFO}">
      La verificación es <strong>por especialidad</strong>: esta te habilita en ${mat} y en
      ninguna otra. Si quieres enseñar otra materia, puedes solicitar la suya cuando quieras.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${SITIO}/dashboard/instructor" style="${BOTON}">Ir a mi panel de instructor</a>
    </div>

    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
      Antes de enviar tu primer curso, la
      <a href="${SITIO}/dashboard/instructor/guia" style="color: #f7931a; text-decoration: none;">guía del instructor</a>
      explica qué se mira en la revisión.
    </p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: REMITENTE_NODO360,
      to,
      subject: `Tu verificación en ${materia(especialidad, jurisdiccion)} está aprobada`,
      html: envoltura(`Verificación aprobada: ${materia(especialidad, jurisdiccion)}`, contenido),
    })
    if (error) {
      console.error('❌ [verificacion/aprobada]', error)
      return { success: false, error: error.message }
    }
    return { success: true, id: data?.id }
  } catch (e) {
    console.error('❌ [verificacion/aprobada] Error critico:', e)
    return { success: false, error: String(e) }
  }
}

// =====================================================
// RETIRADA
// =====================================================

export async function enviarVerificacionRetirada({
  to,
  nombre,
  especialidad,
  jurisdiccion,
  motivo,
}: DatosComunes & { motivo: string }) {
  const resend = getResend()
  if (!resend) {
    console.error('❌ [verificacion/retirada] Resend no configurado')
    return { success: false, error: 'Email service not configured' }
  }

  const mat = escapar(materia(especialidad, jurisdiccion))

  const contenido = `
    <p style="${PARRAFO}">Hola ${escapar(nombre)}:</p>

    <p style="${PARRAFO}">
      El equipo de Nodo360 ha retirado tu verificación en <strong>${mat}</strong>.
    </p>

    <p style="${PARRAFO}">Este es el motivo que queda registrado:</p>

    <blockquote style="margin: 0 0 20px 0; padding: 16px 20px; border-left: 3px solid rgba(247,147,26,0.5); background: rgba(255,255,255,0.03); color: #d1d5db; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapar(motivo)}</blockquote>

    <p style="${PARRAFO}">Qué significa, en concreto:</p>

    <ul style="color: #d1d5db; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
      <li>
        <strong>No podrás crear ni enviar a revisión cursos nuevos de ${mat}.</strong>
        La verificación es lo que habilita para esa materia.
      </li>
      <li>
        <strong>Tus cursos ya publicados siguen visibles</strong> y tu alumnado sigue
        teniendo acceso. Esto no los retira ni los oculta.
      </li>
      <li>
        No afecta a las demás especialidades: las que tengas verificadas siguen igual.
      </li>
    </ul>

    <p style="${PARRAFO}">
      Si quieres comentarlo o entender mejor la decisión, responde a este correo o
      escríbenos a
      <a href="mailto:soporte@nodo360.com" style="color: #f7931a; text-decoration: none;">soporte@nodo360.com</a>.
      Lo miramos con calma.
    </p>

    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
      Puedes ver el estado de tus verificaciones en
      <a href="${SITIO}/dashboard/instructor/verificacion" style="color: #f7931a; text-decoration: none;">tu panel</a>.
    </p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: REMITENTE_NODO360,
      to,
      subject: `Tu verificación en ${materia(especialidad, jurisdiccion)} se ha retirado`,
      html: envoltura(`Verificación retirada: ${materia(especialidad, jurisdiccion)}`, contenido),
    })
    if (error) {
      console.error('❌ [verificacion/retirada]', error)
      return { success: false, error: error.message }
    }
    return { success: true, id: data?.id }
  } catch (e) {
    console.error('❌ [verificacion/retirada] Error critico:', e)
    return { success: false, error: String(e) }
  }
}

// =====================================================
// RECHAZADA
// =====================================================

/** Los dias que hay que esperar tras un rechazo antes de volver a solicitarla. */
export const DIAS_DE_ESPERA_TRAS_RECHAZO = 30

/** «14 de noviembre de 2026», en español y sin depender del locale del servidor. */
function fechaLarga(d: Date): string {
  const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

export async function enviarVerificacionRechazada({
  to,
  nombre,
  especialidad,
  jurisdiccion,
  motivo,
  puedeVolverEl,
}: DatosComunes & { motivo: string; puedeVolverEl?: Date }) {
  const resend = getResend()
  if (!resend) {
    console.error('❌ [verificacion/rechazada] Resend no configurado')
    return { success: false, error: 'Email service not configured' }
  }

  const mat = escapar(materia(especialidad, jurisdiccion))

  // Si no se pasa, se calcula: la fecha del correo mas el plazo.
  const vuelta = puedeVolverEl ?? new Date(Date.now() + DIAS_DE_ESPERA_TRAS_RECHAZO * 86400000)

  const contenido = `
    <p style="${PARRAFO}">Hola ${escapar(nombre)}:</p>

    <p style="${PARRAFO}">
      El equipo de Nodo360 ha revisado tu solicitud de verificación en
      <strong>${mat}</strong> y esta vez no ha salido adelante.
    </p>

    <p style="${PARRAFO}">Esto es lo que anotó quien la evaluó:</p>

    <blockquote style="margin: 0 0 20px 0; padding: 16px 20px; border-left: 3px solid rgba(247,147,26,0.5); background: rgba(255,255,255,0.03); color: #d1d5db; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapar(motivo)}</blockquote>

    <p style="${PARRAFO}">
      Puedes volver a solicitarla a partir del
      <strong style="color: #f7931a;">${escapar(fechaLarga(vuelta))}</strong>. El plazo es de
      ${DIAS_DE_ESPERA_TRAS_RECHAZO} días y sirve para tener tiempo de preparar lo que falta;
      no es una penalización. Esto no afecta a las demás especialidades: puedes solicitar
      cualquier otra cuando quieras.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${SITIO}/dashboard/instructor/verificacion" style="${BOTON}">Ver mis verificaciones</a>
    </div>

    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
      Si algo de lo anterior no te cuadra o quieres comentarlo, respóndenos a
      <a href="mailto:soporte@nodo360.com" style="color: #f7931a; text-decoration: none;">soporte@nodo360.com</a>.
    </p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: REMITENTE_NODO360,
      to,
      subject: `Sobre tu solicitud de verificación en ${materia(especialidad, jurisdiccion)}`,
      html: envoltura(`Tu solicitud en ${materia(especialidad, jurisdiccion)}`, contenido),
    })
    if (error) {
      console.error('❌ [verificacion/rechazada]', error)
      return { success: false, error: error.message }
    }
    return { success: true, id: data?.id }
  } catch (e) {
    console.error('❌ [verificacion/rechazada] Error critico:', e)
    return { success: false, error: String(e) }
  }
}
