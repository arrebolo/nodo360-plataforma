/**
 * Enlace de invitacion al Discord de Nodo360.
 *
 * Fuente unica: todo lo que enlace al servidor sale de aqui, para que cambiar
 * la invitacion sea tocar una variable de entorno y no perseguir URLs sueltas
 * por el codigo. Antes estaba escrita a mano en seis sitios distintos.
 *
 * El valor de respaldo es la invitacion permanente vigente, asi que la pagina
 * nunca queda con un enlace vacio aunque la variable no este definida —por
 * ejemplo en un entorno de vista previa recien creado—.
 *
 * NEXT_PUBLIC_ porque se usa en componentes de cliente. No es un secreto: la
 * invitacion es publica por definicion. No confundir con
 * DISCORD_WEBHOOK_ANNOUNCEMENTS, que si lo es y vive solo en el servidor.
 */
export const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/7FBt9TmwQ'

/**
 * Atributos para cualquier enlace al Discord.
 *
 * Abre en pestana nueva sin dejar que el destino acceda a window.opener.
 * noreferrer acompana a noopener por los navegadores antiguos, donde el
 * primero no basta.
 */
export const DISCORD_LINK_PROPS = {
  href: DISCORD_INVITE_URL,
  target: '_blank' as const,
  rel: 'noopener noreferrer',
}
