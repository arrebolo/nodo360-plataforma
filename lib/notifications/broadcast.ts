/**
 * Broadcast Service
 * Envía notificaciones a todos los canales (in-app, Discord, Telegram)
 */

import { discordNotifications } from './discord'
import { telegramNotifications } from './telegram'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationType } from '@/types/database'
import { puedeAnunciarSusLogros } from '@/lib/notifications/consentimiento'

interface BroadcastOptions {
  // Canales a usar
  inApp?: boolean
  discord?: boolean
  telegram?: boolean
  // Datos de la notificación
  userId?: string        // Para in-app (si es para un usuario específico)
  allUsers?: boolean     // Para in-app (si es para todos)
}

const defaultOptions: BroadcastOptions = {
  inApp: true,
  discord: true,
  telegram: true,
}

/**
 * Crea notificación in-app para un usuario
 */
export async function createInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
      })

    if (error) {
      console.error('❌ [InApp] Error:', error)
      return false
    }

    console.log('✅ [InApp] Notificación creada para:', userId)
    return true
  } catch (error) {
    console.error('❌ [InApp] Error:', error)
    return false
  }
}

/**
 * Crea notificación in-app para todos los usuarios
 */
export async function createInAppNotificationForAll(
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // Obtener todos los usuarios activos (beta)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('is_beta', true)

    if (usersError || !users) {
      console.error('❌ [InApp] Error obteniendo usuarios:', usersError)
      return false
    }

    // Crear notificación para cada usuario
    const notifications = users.map(user => ({
      user_id: user.id,
      type,
      title,
      message,
      link,
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.error('❌ [InApp] Error insertando notificaciones:', error)
      return false
    }

    console.log('✅ [InApp] Notificaciones creadas para', users.length, 'usuarios')
    return true
  } catch (error) {
    console.error('❌ [InApp] Error:', error)
    return false
  }
}

/**
 * Broadcast: Nuevo usuario beta activado
 */
export async function broadcastNewUser(
  userName: string,
  userId: string,
  options: BroadcastOptions = defaultOptions
): Promise<void> {
  // MISMO PROBLEMA QUE courseCompleted: «X se ha unido a la comunidad» publica el
  // nombre de una persona, y esto se dispara al concederle acceso beta. Sin su
  // permiso no sale.
  const consiente = await puedeAnunciarSusLogros(userId)

  const results = await Promise.allSettled([
    // In-app para el usuario
    options.inApp && createInAppNotification(
      userId,
      'welcome',
      '¡Bienvenido a Nodo360!',
      'Tu acceso beta ha sido activado. ¡Explora los cursos y comienza tu viaje!',
      '/cursos'
    ),
    // Discord
    options.discord && consiente && discordNotifications.newUser(userName),
    // Telegram
    options.telegram && consiente && telegramNotifications.newUser(userName),
  ])

  console.log('📢 [Broadcast] newUser:', results)
}

/**
 * Broadcast: Curso completado
 */
export async function broadcastCourseCompleted(
  userName: string,
  userId: string,
  courseName: string,
  options: BroadcastOptions = defaultOptions
): Promise<void> {
  // EL ANUNCIO PUBLICO NECESITA SU PERMISO. El aviso privado, no.
  //
  // La notificacion in-app va a la propia persona: es correspondencia sobre lo que
  // acaba de hacer y no hace falta pedir permiso para ella. Lo que si lo necesita es
  // publicar su NOMBRE en Discord o en Telegram, que es lo que se hacia sin
  // preguntar. Principio #8.
  //
  // Por defecto anunciar_logros es false, asi que hoy esto NO publica nada: el
  // anuncio queda apagado hasta que alguien lo active en su perfil.
  const consiente = await puedeAnunciarSusLogros(userId)

  if (!consiente) {
    console.log(
      '📢 [Broadcast] courseCompleted: sin consentimiento, solo notificacion in-app'
    )
  }

  const results = await Promise.allSettled([
    // In-app para el usuario
    options.inApp && createInAppNotification(
      userId,
      'course_completed',
      '🏆 ¡Curso completado!',
      `Has completado el curso "${courseName}". ¡Felicidades!`,
      '/dashboard/certificados'
    ),
    // Discord, solo con consentimiento
    options.discord && consiente && discordNotifications.courseCompleted(userName, courseName),
    // Telegram, al grupo social y solo con consentimiento
    options.telegram && consiente && telegramNotifications.courseCompleted(userName, courseName),
  ])

  console.log('📢 [Broadcast] courseCompleted:', results)
}

/**
 * Broadcast: Nueva propuesta de gobernanza
 */
export async function broadcastNewProposal(
  title: string,
  proposalSlug: string,
  options: BroadcastOptions = defaultOptions
): Promise<void> {
  const url = `https://nodo360.com/gobernanza/${proposalSlug}`

  const results = await Promise.allSettled([
    // In-app para todos los usuarios
    options.inApp && createInAppNotificationForAll(
      'proposal_active',
      '🗳️ Nueva propuesta',
      `Nueva propuesta: "${title}". ¡Participa y vota!`,
      `/gobernanza/${proposalSlug}`
    ),
    // Discord
    options.discord && discordNotifications.newProposal(title, url),
    // Telegram
    options.telegram && telegramNotifications.newProposal(title, url),
  ])

  console.log('📢 [Broadcast] newProposal:', results)
}

/**
 * Broadcast: Nuevo curso publicado
 */
export async function broadcastNewCourse(
  courseName: string,
  courseSlug: string,
  options: BroadcastOptions = defaultOptions
): Promise<void> {
  const url = `https://nodo360.com/cursos/${courseSlug}`

  const results = await Promise.allSettled([
    // In-app para todos los usuarios
    options.inApp && createInAppNotificationForAll(
      'course_published',
      '📚 Nuevo curso disponible',
      `Se ha publicado "${courseName}". ¡Empieza a aprender!`,
      `/cursos/${courseSlug}`
    ),
    // Discord
    options.discord && discordNotifications.newCourse(courseName, url),
    // Telegram
    options.telegram && telegramNotifications.newCourse(courseName, url),
  ])

  console.log('📢 [Broadcast] newCourse:', results)
}

/**
 * Broadcast: Anuncio general
 */
export async function broadcastAnnouncement(
  title: string,
  message: string,
  link?: string,
  options: BroadcastOptions = defaultOptions
): Promise<void> {
  const results = await Promise.allSettled([
    // In-app para todos
    options.inApp && createInAppNotificationForAll(
      'system',
      title,
      message,
      link
    ),
    // Discord
    options.discord && discordNotifications.announcement(title, message),
    // Telegram
    options.telegram && telegramNotifications.announcement(title, message),
  ])

  console.log('📢 [Broadcast] announcement:', results)
}

/**
 * Broadcast: Certificado emitido
 */
export async function broadcastCertificateIssued(
  userName: string,
  userId: string,
  certificateTitle: string,
  certificateId: string,
  options: BroadcastOptions = defaultOptions
): Promise<void> {
  const results = await Promise.allSettled([
    // In-app para el usuario
    options.inApp && createInAppNotification(
      userId,
      'certificate_issued',
      '📜 ¡Nuevo certificado!',
      `Tu certificado de "${certificateTitle}" está listo.`,
      `/dashboard/certificados/${certificateId}`
    ),
  ])

  console.log('📢 [Broadcast] certificateIssued:', results)
}

/**
 * Broadcast: Badge ganado
 */
export async function broadcastBadgeEarned(
  userId: string,
  badgeName: string,
  options: BroadcastOptions = defaultOptions
): Promise<void> {
  const results = await Promise.allSettled([
    // In-app para el usuario
    options.inApp && createInAppNotification(
      userId,
      'badge_earned',
      '🏅 ¡Nuevo logro desbloqueado!',
      `Has obtenido el badge "${badgeName}". ¡Sigue así!`,
      '/dashboard/perfil'
    ),
  ])

  console.log('📢 [Broadcast] badgeEarned:', results)
}

/**
 * Broadcast: Cambios solicitados en curso
 */
export async function broadcastCourseChangesRequested(
  instructorId: string,
  courseName: string,
  feedback: string,
  options: BroadcastOptions = { inApp: true, discord: false, telegram: false }
): Promise<void> {
  const results = await Promise.allSettled([
    options.inApp && createInAppNotification(
      instructorId,
      'course_changes_requested',
      '📝 Cambios solicitados en tu curso',
      `Los mentores han solicitado cambios en "${courseName}": ${feedback.substring(0, 100)}${feedback.length > 100 ? '...' : ''}`,
      '/dashboard/instructor/cursos'
    ),
  ])

  console.log('📢 [Broadcast] courseChangesRequested:', results)
}

/**
 * Broadcast: Subida de nivel
 */
export async function broadcastLevelUp(
  userId: string,
  newLevel: number,
  options: BroadcastOptions = defaultOptions
): Promise<void> {
  const results = await Promise.allSettled([
    // In-app para el usuario
    options.inApp && createInAppNotification(
      userId,
      'level_up',
      '⬆️ ¡Has subido de nivel!',
      `¡Felicidades! Ahora eres nivel ${newLevel}.`,
      '/dashboard/perfil'
    ),
  ])

  console.log('📢 [Broadcast] levelUp:', results)
}
