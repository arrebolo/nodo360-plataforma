/**
 * Enlace de invitacion al Discord de Nodo360.
 *
 * Fuente unica: todo lo que enlace al servidor sale de aqui, para que cambiar
 * la invitacion sea tocar una variable de entorno y no perseguir URLs sueltas
 * por el codigo. Antes estaba escrita a mano en seis sitios distintos.
 *
 * El valor de respaldo NO caduca: comprobado contra la API de Discord, esta
 * invitacion devuelve expires_at null. Importa que el respaldo sea justo esa,
 * porque es la que se sirve cuando falta la variable —por ejemplo en un
 * entorno de vista previa recien creado— y en ese caso nadie se entera de que
 * el enlace dejo de funcionar hasta que alguien lo reporta.
 *
 * Por eso no vale cualquier invitacion: las de Discord caducan por defecto.
 * Si alguna vez hay que cambiarla, generar una sin caducidad y comprobar el
 * expires_at antes de ponerla aqui.
 *
 * NEXT_PUBLIC_ porque se usa en componentes de cliente. No es un secreto: la
 * invitacion es publica por definicion. No confundir con
 * DISCORD_WEBHOOK_ANNOUNCEMENTS, que si lo es y vive solo en el servidor.
 */
export const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/ag5aPsNuPY'

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
