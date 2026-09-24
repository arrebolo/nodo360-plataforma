/**
 * Discord Webhook Integration
 * Sends notifications to Discord channels via webhooks
 */

import type {
  DiscordEmbed,
  DiscordEmbedField,
  DiscordWebhookPayload,
  NewCourseNotification,
  NewBlogPostNotification,
} from '@/types/discord'

// Brand color in decimal (0xff6b35)
const BRAND_COLOR = 16738101

/**
 * Send a notification to Discord via webhook
 * @param webhookUrl - The Discord webhook URL
 * @param embed - The embed to send
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  embed: DiscordEmbed
): Promise<void> {
  console.log('📢 [Discord] Enviando notificacion...')

  const payload: DiscordWebhookPayload = {
    username: 'Nodo360',
    embeds: [embed],
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Discord] Error response:', response.status, errorText)
      throw new Error(`Discord webhook failed: ${response.status}`)
    }

    console.log('✅ [Discord] Notificacion enviada exitosamente')
  } catch (error) {
    console.error('❌ [Discord] Error enviando notificacion:', error)
    throw error
  }
}

/**
 * Notify Discord about a new published course
 */
export async function notifyNewCourse(course: NewCourseNotification): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS

  if (!webhookUrl) {
    console.log('⚠️ [Discord] DISCORD_WEBHOOK_ANNOUNCEMENTS no configurado, saltando notificacion')
    return
  }

  console.log('🔍 [Discord] Preparando notificacion de nuevo curso:', course.title)

  const levelLabels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  }

  // Truncate description to 200 chars
  const truncatedDescription = course.description
    ? course.description.length > 200
      ? course.description.substring(0, 197) + '...'
      : course.description
    : 'Sin descripcion'

  const embed: DiscordEmbed = {
    title: `🎓 Nuevo curso disponible`,
    description: `**${course.title}**`,
    url: `https://nodo360.com/cursos/${course.slug}`,
    color: BRAND_COLOR,
    fields: [
      {
        name: '👨‍🏫 Instructor',
        value: course.instructor_name,
        inline: true,
      },
      {
        name: '📊 Nivel',
        value: levelLabels[course.level] || course.level,
        inline: true,
      },
      {
        name: '📝 Descripcion',
        value: truncatedDescription,
        inline: false,
      },
    ],
    footer: {
      text: 'Nodo360 - Educacion Bitcoin',
    },
    timestamp: new Date().toISOString(),
  }

  // Add thumbnail if available
  if (course.thumbnail_url) {
    embed.thumbnail = { url: course.thumbnail_url }
  }

  try {
    await sendDiscordNotification(webhookUrl, embed)
  } catch (error) {
    // Log error but don't throw - we don't want Discord failures to break the main flow
    console.error('❌ [Discord] Fallo al notificar nuevo curso, continuando sin error:', error)
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  bitcoin: 'Bitcoin',
  blockchain: 'Blockchain',
  defi: 'DeFi',
  web3: 'Web3',
}

/**
 * Anuncia un articulo nuevo del blog.
 *
 * Canal: un webhook de Discord apunta siempre a un canal concreto, asi que
 * elegir canal es elegir webhook. Los articulos van a DISCORD_WEBHOOK_NEWS
 * (#noticias) y, si no esta definida, caen en DISCORD_WEBHOOK_ANNOUNCEMENTS,
 * que es donde iba todo hasta ahora. Con el respaldo, separar los canales no
 * obliga a desplegar y configurar la variable a la vez: mientras tanto el
 * anuncio sale igual, solo que en el canal de siempre.
 */
export async function notifyNewBlogPost(post: NewBlogPostNotification): Promise<void> {
  const webhookUrl =
    process.env.DISCORD_WEBHOOK_NEWS || process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS

  if (!webhookUrl) {
    console.log('⚠️ [Discord] Sin webhook de noticias ni de anuncios, saltando notificacion')
    return
  }

  if (!process.env.DISCORD_WEBHOOK_NEWS) {
    console.log('ℹ️ [Discord] DISCORD_WEBHOOK_NEWS sin definir, usando el canal de anuncios')
  }

  console.log('🔍 [Discord] Preparando notificacion de nuevo post:', post.title)

  // Truncate excerpt to 300 chars
  const truncatedExcerpt = post.excerpt.length > 300
    ? post.excerpt.substring(0, 297) + '...'
    : post.excerpt

  const embed: DiscordEmbed = {
    title: `📰 Nuevo articulo en el blog`,
    description: `**${post.title}**\n\n${truncatedExcerpt}`,
    url: `https://nodo360.com/blog/${post.slug}`,
    color: BRAND_COLOR,
    footer: {
      text: 'Nodo360 - Educacion Bitcoin',
    },
    timestamp: new Date().toISOString(),
  }

  const fields: DiscordEmbedField[] = []
  if (post.category) {
    fields.push({
      name: '🏷️ Categoria',
      value: CATEGORY_LABELS[post.category] || post.category,
      inline: true,
    })
  }
  if (post.reading_time) {
    fields.push({
      name: '⏱️ Lectura',
      value: `${post.reading_time} min`,
      inline: true,
    })
  }
  if (fields.length > 0) {
    embed.fields = fields
  }

  // La portada se guarda como ruta del sitio (/blog/algo.webp). Discord
  // necesita una URL absoluta para poder descargarla.
  if (post.image_url) {
    embed.image = {
      url: post.image_url.startsWith('http')
        ? post.image_url
        : `https://nodo360.com${post.image_url}`,
    }
  }

  try {
    await sendDiscordNotification(webhookUrl, embed)
  } catch (error) {
    console.error('❌ [Discord] Fallo al notificar nuevo post, continuando sin error:', error)
  }
}
