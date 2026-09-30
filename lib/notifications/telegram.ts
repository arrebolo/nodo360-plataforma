/**
 * Telegram: dos destinos distintos, y no se mezclan.
 *
 * LO QUE PASABA. Este módulo leía `TELEGRAM_CHANNEL_ID || TELEGRAM_CHAT_ID`, con
 * caída de uno al otro. Como solo estaba configurado `TELEGRAM_CHAT_ID` —el grupo
 * «Nodo360.comunidad»—, TODO acabó ahí: incluido el anuncio de una verificación de
 * instructor, que es institucional y va al canal.
 *
 * Una caída silenciosa entre dos destinos que no son equivalentes no es tolerancia:
 * es publicar en el sitio equivocado sin avisar. Ahora cada envío dice a dónde va, y
 * si ese destino no está configurado NO se envía: se registra y se queda sin enviar.
 *
 *   'oficial'  ->  TELEGRAM_CHANNEL_ID   canal @nodo360
 *                  cursos nuevos, verificaciones de instructor, avisos de la
 *                  plataforma. Habla Nodo360.
 *
 *   'social'   ->  TELEGRAM_CHAT_ID      grupo «Nodo360.comunidad»
 *                  logros de personas, y SOLO con su consentimiento. Habla la
 *                  comunidad.
 *
 *   'interno'  ->  TELEGRAM_INTERNAL_CHAT_ID
 *                  lo que NO puede ver nadie de fuera: el feedback de un usuario
 *                  —que lleva su correo dentro— y los errores de la plataforma.
 *                  Ninguno de los dos se llama hoy desde el código, y si alguien
 *                  los enciende sin configurar esta variable no se envían: mejor
 *                  perder un aviso interno que publicar el correo de alguien.
 */

export type DestinoTelegram = 'oficial' | 'social' | 'interno'

/** De dónde sale el identificador de cada destino. Sin caídas entre ellos. */
const VARIABLE_POR_DESTINO: Record<DestinoTelegram, string> = {
  oficial: 'TELEGRAM_CHANNEL_ID',
  social: 'TELEGRAM_CHAT_ID',
  interno: 'TELEGRAM_INTERNAL_CHAT_ID',
}

interface TelegramMessage {
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disable_web_page_preview?: boolean
  disable_notification?: boolean
}

/**
 * Envía un mensaje a UNO de los dos destinos.
 *
 * `destino` es obligatorio a propósito: si tuviera valor por defecto, un envío
 * nuevo acabaría donde tocara según qué variable estuviera puesta, que es
 * exactamente el fallo que esto corrige.
 */
export async function sendTelegramMessage(
  message: TelegramMessage,
  destino: DestinoTelegram
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const variable = VARIABLE_POR_DESTINO[destino]
  const targetChatId = process.env[variable]

  if (!botToken) {
    console.error('❌ [Telegram] TELEGRAM_BOT_TOKEN no configurado')
    return false
  }

  // Sin caída al otro destino. Si falta el de este, no se envía.
  if (!targetChatId) {
    console.log(
      `⚠️ [Telegram] ${variable} sin configurar: no se publica nada en el destino «${destino}»`
    )
    return false
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          parse_mode: 'HTML',
          ...message,
        }),
      }
    )

    const data = await response.json()

    if (!data.ok) {
      console.error('❌ [Telegram] Error:', data.description)
      return false
    }

    console.log(`✅ [Telegram] Mensaje enviado al destino «${destino}»`)
    return true
  } catch (error) {
    console.error('❌ [Telegram] Error:', error)
    return false
  }
}

/**
 * Envía una notificación formateada
 */
export async function sendTelegramNotification(
  title: string,
  description: string,
  destino: DestinoTelegram,
  url?: string
): Promise<boolean> {
  let text = `<b>🔔 ${title}</b>\n\n${description}`

  if (url) {
    text += `\n\n<a href="${url}">Ver más →</a>`
  }

  return sendTelegramMessage({ text }, destino)
}

// Notificaciones predefinidas
export const telegramNotifications = {
  // SOCIAL y con consentimiento: lleva el nombre de una persona.
  newUser: (name: string) => sendTelegramNotification(
    '👋 Nuevo usuario beta',
    `<b>${name}</b> se ha unido a la comunidad Nodo360!`,
    'social'
  ),

  // SOCIAL y con consentimiento: el logro es de quien lo consigue.
  courseCompleted: (userName: string, courseName: string) => sendTelegramNotification(
    '🏆 Curso completado',
    `<b>${userName}</b> ha completado el curso <b>${courseName}</b>. ¡Felicidades!`,
    'social'
  ),

  // OFICIAL: habla la plataforma, no una persona.
  newProposal: (title: string, url: string) => sendTelegramNotification(
    '🗳️ Nueva propuesta de gobernanza',
    `Se ha creado una nueva propuesta: <b>${title}</b>\n\n¡Participa y vota!`,
    'oficial',
    url
  ),

  // OFICIAL.
  newCourse: (courseName: string, url: string) => sendTelegramNotification(
    '📚 Nuevo curso disponible',
    `Se ha publicado un nuevo curso: <b>${courseName}</b>\n\n¡Empieza a aprender!`,
    'oficial',
    url
  ),

  // OFICIAL: lo publica la administracion.
  announcement: (title: string, message: string) => sendTelegramNotification(
    `📢 ${title}`,
    message,
    'oficial'
  ),

  // INTERNO, y no es un detalle: esto lleva el CORREO de una persona dentro. En un
  // canal publico seria una fuga. Hoy no se llama desde ningun sitio.
  feedback: (userEmail: string, message: string) => sendTelegramNotification(
    '💬 Nuevo feedback',
    `<b>De:</b> ${userEmail}\n\n${message}`,
    'interno'
  ),

  // INTERNO: un mensaje de error puede llevar dentro cualquier cosa. Hoy tampoco se
  // llama desde ningun sitio.
  error: (context: string, errorMessage: string) => sendTelegramNotification(
    '🚨 Error en la plataforma',
    `<b>Contexto:</b> ${context}\n<b>Error:</b> ${errorMessage}`,
    'interno'
  ),
}
