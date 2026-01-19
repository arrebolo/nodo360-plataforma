/**
 * Telegram Bot Service
 * Envía notificaciones al canal/grupo de Telegram
 */

interface TelegramMessage {
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disable_web_page_preview?: boolean
  disable_notification?: boolean
}

/**
 * Envía un mensaje al chat de Telegram
 */
export async function sendTelegramMessage(
  message: TelegramMessage,
  chatId?: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const defaultChatId = process.env.TELEGRAM_CHAT_ID

  const targetChatId = chatId || defaultChatId

  if (!botToken) {
    console.error('❌ [Telegram] TELEGRAM_BOT_TOKEN no configurado')
    return false
  }

  if (!targetChatId) {
    console.error('❌ [Telegram] TELEGRAM_CHAT_ID no configurado')
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

    console.log('✅ [Telegram] Mensaje enviado')
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
  url?: string
): Promise<boolean> {
  let text = `<b>🔔 ${title}</b>\n\n${description}`

  if (url) {
    text += `\n\n<a href="${url}">Ver más →</a>`
  }

  return sendTelegramMessage({ text })
}

// Notificaciones predefinidas
export const telegramNotifications = {
  newUser: (name: string) => sendTelegramNotification(
    '👋 Nuevo usuario beta',
    `<b>${name}</b> se ha unido a la comunidad Nodo360!`
  ),

  courseCompleted: (userName: string, courseName: string) => sendTelegramNotification(
    '🏆 Curso completado',
    `<b>${userName}</b> ha completado el curso <b>${courseName}</b>. ¡Felicidades!`
  ),

  newProposal: (title: string, url: string) => sendTelegramNotification(
    '🗳️ Nueva propuesta de gobernanza',
    `Se ha creado una nueva propuesta: <b>${title}</b>\n\n¡Participa y vota!`,
    url
  ),

  newCourse: (courseName: string, url: string) => sendTelegramNotification(
    '📚 Nuevo curso disponible',
    `Se ha publicado un nuevo curso: <b>${courseName}</b>\n\n¡Empieza a aprender!`,
    url
  ),

  announcement: (title: string, message: string) => sendTelegramNotification(
    `📢 ${title}`,
    message
  ),

  feedback: (userEmail: string, message: string) => sendTelegramNotification(
    '💬 Nuevo feedback',
    `<b>De:</b> ${userEmail}\n\n${message}`
  ),

  error: (context: string, errorMessage: string) => sendTelegramNotification(
    '🚨 Error en la plataforma',
    `<b>Contexto:</b> ${context}\n<b>Error:</b> ${errorMessage}`
  ),
}
