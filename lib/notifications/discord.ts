/**
 * Discord Webhook Service
 * Envía notificaciones al canal de Discord via webhook
 */

interface DiscordEmbed {
  title: string
  description: string
  color?: number
  url?: string
  timestamp?: string
  footer?: { text: string }
  fields?: { name: string; value: string; inline?: boolean }[]
}

interface DiscordMessage {
  content?: string
  embeds?: DiscordEmbed[]
  username?: string
  avatar_url?: string
}

// Colores para embeds (en decimal)
const COLORS = {
  success: 0x22c55e,  // verde
  info: 0x3b82f6,     // azul
  warning: 0xf59e0b,  // amarillo
  error: 0xef4444,    // rojo
  primary: 0xf97316,  // naranja (Nodo360)
}

/**
 * Envía un mensaje al webhook de Discord
 */
export async function sendDiscordMessage(message: DiscordMessage): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.error('❌ [Discord] DISCORD_WEBHOOK_URL no configurado')
    return false
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Nodo360 Bot',
        avatar_url: 'https://nodo360.com/logo.png',
        ...message,
      }),
    })

    if (!response.ok) {
      console.error('❌ [Discord] Error:', response.status, await response.text())
      return false
    }

    console.log('✅ [Discord] Mensaje enviado')
    return true
  } catch (error) {
    console.error('❌ [Discord] Error:', error)
    return false
  }
}

/**
 * Envía una notificación formateada con embed
 */
export async function sendDiscordNotification(
  title: string,
  description: string,
  type: 'success' | 'info' | 'warning' | 'error' | 'primary' = 'primary',
  url?: string
): Promise<boolean> {
  return sendDiscordMessage({
    embeds: [{
      title,
      description,
      color: COLORS[type],
      url,
      timestamp: new Date().toISOString(),
      footer: { text: 'Nodo360 • Plataforma educativa de Bitcoin' },
    }],
  })
}

// Notificaciones predefinidas
export const discordNotifications = {
  newUser: (name: string) => sendDiscordNotification(
    '👋 Nuevo usuario beta',
    `**${name}** se ha unido a la comunidad Nodo360!`,
    'success'
  ),

  courseCompleted: (userName: string, courseName: string) => sendDiscordNotification(
    '🏆 Curso completado',
    `**${userName}** ha completado el curso **${courseName}**. ¡Felicidades!`,
    'success'
  ),

  newProposal: (title: string, url: string) => sendDiscordNotification(
    '🗳️ Nueva propuesta de gobernanza',
    `Se ha creado una nueva propuesta: **${title}**\n\n¡Participa y vota!`,
    'info',
    url
  ),

  newCourse: (courseName: string, url: string) => sendDiscordNotification(
    '📚 Nuevo curso disponible',
    `Se ha publicado un nuevo curso: **${courseName}**\n\n¡Empieza a aprender!`,
    'primary',
    url
  ),

  announcement: (title: string, message: string) => sendDiscordNotification(
    `📢 ${title}`,
    message,
    'info'
  ),

  feedback: (userEmail: string, message: string) => sendDiscordNotification(
    '💬 Nuevo feedback',
    `**De:** ${userEmail}\n\n${message}`,
    'info'
  ),

  error: (context: string, errorMessage: string) => sendDiscordNotification(
    '🚨 Error en la plataforma',
    `**Contexto:** ${context}\n**Error:** ${errorMessage}`,
    'error'
  ),
}
