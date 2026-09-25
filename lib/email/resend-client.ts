import { Resend } from 'resend'

/**
 * Remitente único de todo el correo que sale de Nodo360.
 *
 * Estaba escrito once veces a mano —las diez plantillas de lib/email y el aviso
 * de /api/feedback—, así que cambiar el buzón significaba acordarse de once
 * sitios y que cualquier plantilla nueva copiara la dirección de otra.
 *
 * Tiene que ser una dirección del dominio verificado en Resend. Con cualquier
 * otra, Resend rechaza el envío; y con una de prueba como `onboarding@resend.dev`
 * solo se puede escribir al dueño de la cuenta, de modo que el correo
 * funcionaría en las pruebas y no con los alumnos, que es la peor forma de
 * romperse.
 */
export const REMITENTE_NODO360 = 'Nodo360 <hola@nodo360.com>'

/** Nombre exacto de la variable de entorno con la clave de la API de Resend. */
export const VARIABLE_CLAVE_RESEND = 'RESEND_API_KEY'

// Lazy initialization para evitar error durante build
let resendInstance: Resend | null = null

/**
 * Cliente de Resend, o `null` si no hay clave configurada.
 *
 * Devolver null y **no** lanzar es deliberado: ningún correo de esta plataforma
 * es crítico para lo que el usuario acaba de hacer. Registrarse, terminar un
 * curso o ganar un badge tienen que funcionar igual con el correo caído, y
 * antes eso dependía de que cada sitio que llamaba se acordara de envolver la
 * llamada en un try/catch. Con null, la seguridad es estructural.
 *
 * Pero tampoco puede fallar en silencio: sin clave no sale ningún correo, y eso
 * hay que verlo en los registros. Va con `console.error` y ❌, no con
 * `console.warn`: el `removeConsole` de producción conserva los dos, pero un
 * servicio sin configurar es un error de despliegue, no un aviso.
 */
export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.error(
      `❌ [Resend] ${VARIABLE_CLAVE_RESEND} no está configurada: no se enviará ningún email`
    )
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}
