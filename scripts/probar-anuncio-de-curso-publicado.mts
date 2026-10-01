/**
 * El anuncio de un curso publicado, SIN publicar nada en ningún canal real.
 *
 *   npx tsx scripts/probar-anuncio-de-curso-publicado.mts
 *
 * COMO SE EVITA PUBLICAR DE VERDAD
 *   Se vacían TELEGRAM_CHANNEL_ID, TELEGRAM_CHAT_ID y DISCORD_WEBHOOK_ANNOUNCEMENTS
 *   antes de cargar nada. El código recorre su camino completo y se detiene justo
 *   antes del envío, registrando qué variable le faltaba. Así se comprueba a qué
 *   destino iba cada mensaje sin que salga ni uno.
 *
 *   Eso prueba además la propiedad que importa de la #289: que al faltar el destino
 *   oficial NO se cae al grupo social. Se deja TELEGRAM_CHAT_ID vacío también, pero
 *   la prueba 3 lo pone a un valor falso para ver que, aun así, el anuncio oficial
 *   no se va por ahí.
 *
 * Y se prueba el cerrojo de la primera publicación, que es la parte con riesgo real:
 * si no reclamara la fecha, cada republicación volvería a anunciar el curso.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)

// ANTES DE CARGAR NADA: el entorno entero, y despues los destinos vaciados. Hay
// modulos que exigen su variable al cargarse, asi que primero se pone todo.
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v

// UN TOKEN FALSO, A PROPOSITO. Sin token, sendTelegramMessage se detiene en la
// primera comprobacion y no llega a mirar el destino, asi que no se podria
// comprobar a que canal iba. Con un token inventado llega hasta el destino, lo
// encuentra vacio y se detiene ahi. No puede enviar nada: no hay destino, y el
// token tampoco existe.
process.env.TELEGRAM_BOT_TOKEN = 'token-de-prueba-que-no-existe'
process.env.TELEGRAM_CHANNEL_ID = ''
process.env.TELEGRAM_CHAT_ID = ''
process.env.TELEGRAM_INTERNAL_CHAT_ID = ''
process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS = ''

const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL as string, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-anuncio'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

// Se captura lo que el codigo registra, que es la unica forma de ver a que destino
// iba un mensaje que no se envia.
const registrado: string[] = []
for (const metodo of ['log', 'error', 'warn'] as const) {
  const original = console[metodo].bind(console)
  console[metodo] = (...args: unknown[]) => {
    registrado.push(args.map((a) => String(a)).join(' '))
    original(...args)
  }
}
const seRegistro = (trozo: string) => registrado.some((l) => l.includes(trozo))

const creado: { cursos: string[] } = { cursos: [] }

try {
  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: autor } = await svc.from('users').select('id').eq('role', 'instructor').limit(1).maybeSingle()

  const { data: c, error: ec } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'draft',
    is_free: true, is_certifiable: false, specialty_id: esp!.id,
    description: 'Curso de prueba del anuncio. No se publica nada en ningun canal.',
    instructor_id: autor?.id ?? null, owner_id: autor?.id ?? null,
  }).select('id, published_at').single()
  if (ec) throw new Error(ec.message)
  creado.cursos.push(c!.id)
  di(c!.published_at === null, 'curso de prueba sin publicar', `published_at=${c!.published_at}`)

  // ── 1. El cerrojo de la primera publicación ──────────────────────────────
  console.log('\n=== el cerrojo: solo la primera vez pone la fecha y anuncia ===')
  const primera = await svc.from('courses')
    .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', c!.id).is('published_at', null).select('id')
  di((primera.data?.length ?? 0) === 1, 'la primera reclamación obtiene la fila', `${primera.data?.length ?? 0} filas`)

  const { data: tras } = await svc.from('courses').select('published_at').eq('id', c!.id).single()
  const fechaOriginal = tras?.published_at
  di(Boolean(fechaOriginal), 'y published_at queda puesta', String(fechaOriginal).slice(0, 19))

  const segunda = await svc.from('courses')
    .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', c!.id).is('published_at', null).select('id')
  di((segunda.data?.length ?? 0) === 0, 'la segunda NO obtiene ninguna fila: no se reanuncia',
    `${segunda.data?.length ?? 0} filas`)

  const { data: trasSegunda } = await svc.from('courses').select('published_at').eq('id', c!.id).single()
  di(trasSegunda?.published_at === fechaOriginal, 'y la fecha original no se pisa',
    String(trasSegunda?.published_at).slice(0, 19))

  // ── 2. El anuncio recorre su camino y no publica nada ────────────────────
  console.log('\n=== el anuncio, con los destinos vacíos ===')
  const { anunciarCursoPublicado } = await import('../lib/courses/anunciar-publicacion.ts')
  registrado.length = 0
  await anunciarCursoPublicado(c!.id)

  di(seRegistro('TELEGRAM_CHANNEL_ID sin configurar'),
    'Telegram apuntaba al CANAL (TELEGRAM_CHANNEL_ID), y no publica sin él')
  di(!seRegistro('TELEGRAM_CHAT_ID sin configurar'),
    'y no intentó el grupo social como repuesto')
  di(seRegistro('DISCORD_WEBHOOK_ANNOUNCEMENTS no configurado'),
    'Discord iba por el webhook de anuncios, y no publica sin él')
  di(!seRegistro('Mensaje enviado'), 'no se envió ni un mensaje')
  di(seRegistro('[anunciarCursoPublicado]'), 'y la función terminó, no se quedó colgada')

  // ── 3. Sin el canal, con el grupo puesto: tampoco se cae al grupo ────────
  console.log('\n=== la prueba que importa de la #289: sin caída entre destinos ===')
  process.env.TELEGRAM_CHAT_ID = '-1000000000000'
  registrado.length = 0
  await anunciarCursoPublicado(c!.id)
  di(seRegistro('TELEGRAM_CHANNEL_ID sin configurar'),
    'sigue pidiendo el canal, con el grupo configurado')
  di(!seRegistro('Mensaje enviado al destino «social»'),
    'el anuncio oficial NO se publica en el grupo social')
  process.env.TELEGRAM_CHAT_ID = ''
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) await svc.from('courses').delete().eq('id', id)
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((count ?? 0) === 0, 'no queda nada', `cursos con la marca: ${count ?? 0}`)
  console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} comprobaciones fallan\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
