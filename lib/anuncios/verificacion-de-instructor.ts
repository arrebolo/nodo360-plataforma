import { sendDiscordNotification } from '@/lib/discord/webhook'
import { sendTelegramMessage } from '@/lib/notifications/telegram'

/**
 * EL ANUNCIO PUBLICO DE UNA VERIFICACION APROBADA
 *
 * Se publica en el canal de anuncios de Discord y en el de Telegram, y SOLO si
 * se cumplen las tres condiciones, que se comprueban antes de llamar aqui y
 * ademas en la base (trigger de la 108):
 *
 *   1. la verificacion esta aprobada,
 *   2. esa persona lo consintio al solicitarla,
 *   3. no se ha anunciado ya.
 *
 * SOLO DATOS PUBLICOS: nombre publico, especialidad (y jurisdiccion si la tiene)
 * y el enlace a su perfil. Ni correo, ni numero de colegiacion, ni las notas de
 * quien evaluo, que es justo lo que la 093 saco de la vista publica.
 *
 * NO LANZA NUNCA. Un fallo de Discord o de Telegram no puede tumbar una
 * aprobacion: la verificacion ya esta concedida, y el anuncio es lo accesorio.
 * Devuelve que ha pasado en cada canal para poder registrarlo.
 *
 * ── MODO DE PRUEBA ───────────────────────────────────────────────────────────
 * Con ANUNCIOS_MODO_PRUEBA=1 no se envia nada a ningun sitio: se registra por
 * consola el mensaje exacto que se habria publicado. Es lo que permite probar el
 * flujo completo —aprobar, comprobar el consentimiento, marcar la fecha— sin
 * escribir en un canal de verdad.
 */

export interface AnuncioDeVerificacion {
  nombrePublico: string
  especialidad: string
  jurisdiccion?: string | null
  /** id del usuario, para componer el enlace a su perfil publico */
  userId: string
}

export interface ResultadoDelAnuncio {
  discord: 'enviado' | 'sin-configurar' | 'error' | 'prueba'
  telegram: 'enviado' | 'sin-configurar' | 'error' | 'prueba'
  /** true si al menos un canal recibio el anuncio de verdad */
  algunoEnviado: boolean
}

const SITIO = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com').replace(/\/$/, '')

function esModoPrueba(): boolean {
  const v = (process.env.ANUNCIOS_MODO_PRUEBA || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'si'
}

/** «Fiscalidad · España», o solo «Fiscalidad». */
function materia(especialidad: string, jurisdiccion?: string | null): string {
  const j = jurisdiccion?.trim()
  return j ? `${especialidad} · ${j}` : especialidad
}

export async function anunciarVerificacionAprobada(
  datos: AnuncioDeVerificacion
): Promise<ResultadoDelAnuncio> {
  const mat = materia(datos.especialidad, datos.jurisdiccion)
  const perfil = `${SITIO}/instructores/${datos.userId}`

  // Sobrio y sin adornos: quien es, en que, y donde verlo.
  const titulo = 'Nueva verificación de instructor'
  const texto = `${datos.nombrePublico} ha sido verificado en ${mat}.`

  if (esModoPrueba()) {
    console.log('🧪 [anuncio] MODO DE PRUEBA: no se envía nada. Se habría publicado:')
    console.log(`🧪 [anuncio]   Discord  -> ${titulo} | ${texto} | ${perfil}`)
    console.log(`🧪 [anuncio]   Telegram -> ${texto} ${perfil}`)
    return { discord: 'prueba', telegram: 'prueba', algunoEnviado: false }
  }

  const resultado: ResultadoDelAnuncio = {
    discord: 'sin-configurar',
    telegram: 'sin-configurar',
    algunoEnviado: false,
  }

  // ── Discord ────────────────────────────────────────────────────────────────
  const webhook = process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS
  if (!webhook) {
    console.log('⚠️ [anuncio] DISCORD_WEBHOOK_ANNOUNCEMENTS sin configurar, no se publica en Discord')
  } else {
    try {
      await sendDiscordNotification(webhook, {
        title: titulo,
        description: texto,
        url: perfil,
        color: 0xf7931a,
        fields: [{ name: 'Especialidad', value: mat, inline: true }],
        timestamp: new Date().toISOString(),
      })
      resultado.discord = 'enviado'
      resultado.algunoEnviado = true
    } catch (e) {
      // sendDiscordNotification relanza; aqui se para, porque un canal caido no
      // puede volverse un error de la aprobacion.
      console.error('❌ [anuncio] Discord fallo:', e)
      resultado.discord = 'error'
    }
  }

  // ── Telegram ───────────────────────────────────────────────────────────────
  const hayTelegram =
    Boolean(process.env.TELEGRAM_BOT_TOKEN) &&
    Boolean(process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHAT_ID)

  if (!hayTelegram) {
    console.log('⚠️ [anuncio] Telegram sin configurar, no se publica ahí')
  } else {
    try {
      const ok = await sendTelegramMessage({
        text: `<b>${titulo}</b>\n\n${texto}\n\n<a href="${perfil}">Ver su perfil</a>`,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      })
      resultado.telegram = ok ? 'enviado' : 'error'
      if (ok) resultado.algunoEnviado = true
    } catch (e) {
      console.error('❌ [anuncio] Telegram fallo:', e)
      resultado.telegram = 'error'
    }
  }

  return resultado
}
