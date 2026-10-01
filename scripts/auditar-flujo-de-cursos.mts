/**
 * AUDITORÍA del flujo de creación de cursos por un instructor. Solo diagnóstico.
 *
 *   npx tsx scripts/auditar-flujo-de-cursos.mts
 *
 * CÓMO SE PRUEBA, y por qué así.
 *
 * El interfaz crea módulos, lecciones y preguntas **con el cliente de sesión
 * directamente desde el componente** (`.from('lessons').insert(...)` en la propia
 * página). Así que una sesión real con la clave anónima reproduce ese camino
 * exactamente: las mismas políticas, los mismos GRANT de columna y los mismos
 * triggers. No es un atajo por la base: es el mismo camino.
 *
 * Lo que NO se puede reproducir así queda marcado como NO PROBADO, con el motivo:
 *
 *   · `createCourse` es una server action y necesita el contexto de petición de
 *     Next para leer cookies. Se audita su código y se prueban contra la base las
 *     mismas escrituras que hace, con la sesión del instructor.
 *   · Las rutas de administración exigen sesión de admin. No tengo contraseña de
 *     ninguna cuenta admin y NO se puede crear una de usar y tirar: el trigger de
 *     la migración 100 impide bajarle el rol o borrarla sin el permiso de sesión
 *     del editor SQL, así que quedaría un admin de más para siempre. Se audita el
 *     código y se comprueban los efectos con la clave de servicio.
 *
 * NO PUBLICA NADA: fuerza ANUNCIOS_MODO_PRUEBA=1, y además no hay webhook de
 * Discord ni token de Telegram en el entorno local. Se comprueban las dos cosas.
 *
 * DEJA LA BASE COMO ESTABA: todo lo que crea lleva el marcador «qa-auditoria» y se
 * borra al terminar, con recuento de comprobación.
 */
import fs from 'node:fs'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v as string
process.env.ANUNCIOS_MODO_PRUEBA = '1'

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const SVC = env.SUPABASE_SERVICE_ROLE_KEY as string

const svc = createClient(URL_, SVC, { auth: { persistSession: false } })
const anon = createClient(URL_, ANON, { auth: { persistSession: false } })

const MARCA = 'qa-auditoria'
type Estado = 'FUNCIONA' | 'FALLA' | 'NO PROBADO'
const hallazgos: { paso: string; que: string; estado: Estado; detalle: string }[] = []

function anota(paso: string, que: string, estado: Estado, detalle = '') {
  hallazgos.push({ paso, que, estado, detalle })
  const icono = estado === 'FUNCIONA' ? 'OK  ' : estado === 'FALLA' ? 'FALLA' : '--  '
  console.log(`   ${icono} ${que}${detalle ? '  -> ' + detalle : ''}`)
}

const creados = {
  usuario: null as string | null,
  certificacion: null as string | null,
  cursos: [] as string[],
  modulos: [] as string[],
  lecciones: [] as string[],
  preguntas: [] as string[],
}

let sesion: SupabaseClient = anon

try {
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ PREPARACION ═══')

  const correo = `${MARCA}-instructor-${Date.now()}@nodo360-pruebas.invalid`
  const clave = 'Auditoria-' + Math.random().toString(36).slice(2) + 'Z9!'

  const { data: creada, error: eCrear } = await svc.auth.admin.createUser({
    email: correo,
    password: clave,
    email_confirm: true,
    user_metadata: { full_name: 'QA Auditoría Instructor' },
  })
  if (eCrear || !creada?.user) throw new Error('crear usuario: ' + eCrear?.message)
  creados.usuario = creada.user.id
  anota('0', 'cuenta de prueba creada y confirmada', 'FUNCIONA', creada.user.id.slice(0, 8))

  await svc.from('users').update({ role: 'instructor' }).eq('id', creados.usuario)

  const { data: espEth } = await svc.from('instructor_specialties').select('id, nombre').eq('slug', 'ethereum-contratos').single()
  const { data: espFis } = await svc.from('instructor_specialties').select('id, nombre').eq('slug', 'fiscalidad').single()

  const { data: cert, error: eCert } = await svc
    .from('instructor_certifications')
    .insert({
      user_id: creados.usuario,
      specialty_id: espEth!.id,
      certification_number: `QA-AUD-${Date.now().toString().slice(-8)}`,
      status: 'aprobada',
      oral_result: 'apto',
      practical_result: 'apto',
      issued_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (eCert) throw new Error('crear verificacion: ' + eCert.message)
  creados.certificacion = cert!.id
  anota('0', 'verificación aprobada en ethereum-contratos', 'FUNCIONA')

  const { data: ses, error: eSes } = await anon.auth.signInWithPassword({ email: correo, password: clave })
  if (eSes || !ses.session) throw new Error('iniciar sesion: ' + eSes?.message)

  sesion = createClient(URL_, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${ses.session.access_token}` } },
  })
  anota('0', 'sesión real de instructor (clave anónima + su JWT)', 'FUNCIONA')

  // Y que no se publique nada
  anota('0', 'ANUNCIOS_MODO_PRUEBA=1', process.env.ANUNCIOS_MODO_PRUEBA === '1' ? 'FUNCIONA' : 'FALLA')
  anota('0', 'sin DISCORD_WEBHOOK_URL ni ANNOUNCEMENTS en el entorno',
    !process.env.DISCORD_WEBHOOK_URL && !process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS ? 'FUNCIONA' : 'FALLA')
  anota('0', 'sin TELEGRAM_BOT_TOKEN en el entorno',
    !process.env.TELEGRAM_BOT_TOKEN ? 'FUNCIONA' : 'FALLA')

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ PASO 1: crear curso ═══')

  const nuevoCurso = (slug: string, specialty: string, jurisdiccion: string | null) => ({
    slug,
    title: `${MARCA} ${slug}`,
    description: 'Curso de auditoría, se borra al terminar.',
    level: 'beginner',
    status: 'draft',
    is_free: true,
    is_certifiable: false,
    instructor_id: creados.usuario,
    owner_id: creados.usuario,
    specialty_id: specialty,
    ...(jurisdiccion ? { jurisdiccion } : {}),
  })

  // 1a. Curso de ethereum, con especialidad
  const r1 = await sesion.from('courses').insert(nuevoCurso(`${MARCA}-eth-${Date.now()}`, espEth!.id, null)).select('id, status').single()
  if (r1.error) {
    anota('1', 'el instructor crea un curso de su especialidad', 'FALLA', `${r1.error.code}: ${r1.error.message.slice(0, 90)}`)
  } else {
    creados.cursos.push(r1.data.id)
    anota('1', 'el instructor crea un curso de su especialidad', 'FUNCIONA', `nace en «${r1.data.status}»`)
  }

  // 1b. Curso de FISCALIDAD sin jurisdicción
  const r2 = await sesion.from('courses').insert(nuevoCurso(`${MARCA}-fis-sin-${Date.now()}`, espFis!.id, null)).select('id').single()
  if (r2.error) {
    anota('1', 'curso de fiscalidad SIN jurisdicción (borrador)', 'FALLA', `${r2.error.code}: ${r2.error.message.slice(0, 90)}`)
  } else {
    creados.cursos.push(r2.data.id)
    anota('1', 'curso de fiscalidad SIN jurisdicción (borrador)', 'FUNCIONA', 'se permite en borrador, como se diseñó')
  }

  // 1c. Curso de fiscalidad CON jurisdicción
  const r3 = await sesion.from('courses').insert(nuevoCurso(`${MARCA}-fis-con-${Date.now()}`, espFis!.id, 'ES')).select('id, jurisdiccion').single()
  if (r3.error) {
    anota('1', 'curso de fiscalidad CON jurisdicción ES', 'FALLA', `${r3.error.code}: ${r3.error.message.slice(0, 90)}`)
  } else {
    creados.cursos.push(r3.data.id)
    anota('1', 'curso de fiscalidad CON jurisdicción ES', 'FUNCIONA', `jurisdiccion=${r3.data.jurisdiccion}`)
  }

  const cursoEth = creados.cursos[0]

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ PASO 2: módulos y lecciones con el editor ═══')

  if (!cursoEth) {
    anota('2', 'módulos y lecciones', 'NO PROBADO', 'no hay curso de partida')
  } else {
    const rm = await sesion.from('modules').insert({
      course_id: cursoEth, title: `${MARCA} módulo 1`, order_index: 1,
    }).select('id').single()

    if (rm.error) {
      anota('2', 'el instructor crea un módulo', 'FALLA', `${rm.error.code}: ${rm.error.message.slice(0, 90)}`)
    } else {
      creados.modulos.push(rm.data.id)
      anota('2', 'el instructor crea un módulo', 'FUNCIONA')

      // Contenido con de todo: formato, enlaces, listas, tabla y código.
      const CONTENIDO = [
        '<h2>Título de sección</h2>',
        '<p>Texto con <strong>negrita</strong>, <em>cursiva</em> y un <a href="https://nodo360.com">enlace</a>.</p>',
        '<ul><li>Primero</li><li>Segundo</li></ul>',
        '<ol><li>Uno</li><li>Dos</li></ol>',
        '<table><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody><tr><td>gas</td><td>21000</td></tr></tbody></table>',
        '<pre><code class="language-solidity">contract C { uint256 public x = 1; }</code></pre>',
        '<blockquote>Una cita.</blockquote>',
      ].join('\n')

      const rl = await sesion.from('lessons').insert({
        module_id: rm.data.id,
        course_id: cursoEth,
        title: `${MARCA} lección 1`,
        slug: `${MARCA}-leccion-1-${Date.now()}`,
        order_index: 1,
        content: CONTENIDO,
      }).select('id, slug, content').single()

      if (rl.error) {
        anota('2', 'el instructor crea una lección con contenido rico', 'FALLA', `${rl.error.code}: ${rl.error.message.slice(0, 90)}`)
      } else {
        creados.lecciones.push(rl.data.id)
        anota('2', 'el instructor crea una lección con contenido rico', 'FUNCIONA')

        // ¿Se guarda TAL CUAL? Se compara elemento por elemento.
        const guardado = rl.data.content as string
        const piezas: [string, string][] = [
          ['negrita/cursiva', '<strong>negrita</strong>'],
          ['enlace', 'href="https://nodo360.com"'],
          ['lista sin orden', '<ul><li>Primero</li>'],
          ['lista ordenada', '<ol><li>Uno</li>'],
          ['tabla', '<th>Campo</th>'],
          ['bloque de código', 'language-solidity'],
          ['cita', '<blockquote>'],
        ]
        const perdidas = piezas.filter(([, aguja]) => !guardado.includes(aguja)).map(([n]) => n)
        anota('2', 'el contenido se guarda sin perder formato',
          perdidas.length === 0 ? 'FUNCIONA' : 'FALLA',
          perdidas.length ? 'se pierde: ' + perdidas.join(', ') : 'las 7 piezas intactas')
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ PASO 3: examen final del curso ═══')

  if (!cursoEth) {
    anota('3', 'examen final', 'NO PROBADO', 'no hay curso')
  } else {
    const rq = await sesion.from('quiz_questions').insert({
      course_id: cursoEth,
      question: '¿Cuánto gas cuesta una transferencia simple?',
      options: ['21000', '50000', '100000'],
      correct_answer: 0,
      order_index: 1,
    }).select('id').single()

    if (rq.error) {
      anota('3', 'el instructor crea una pregunta del examen final', 'FALLA',
        `${rq.error.code}: ${rq.error.message.slice(0, 110)}`)
    } else {
      creados.preguntas.push(rq.data.id)
      anota('3', 'el instructor crea una pregunta del examen final', 'FUNCIONA')
    }

    // ¿Puede marcar el curso como certificable / con examen final?
    const rf = await sesion.from('courses')
      .update({ has_final_quiz: true, is_certifiable: true })
      .eq('id', cursoEth)
      .select('has_final_quiz, is_certifiable')
      .single()
    anota('3', 'el instructor marca el curso con examen final',
      rf.error ? 'FALLA' : 'FUNCIONA',
      rf.error ? `${rf.error.code}: ${rf.error.message.slice(0, 90)}` : `has_final_quiz=${rf.data.has_final_quiz}`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ PASO 4: enviar a revisión ═══')

  // 4a. El curso de fiscalidad SIN jurisdicción no debe poder enviarse
  const cursoFisSin = creados.cursos[1]
  if (cursoFisSin) {
    const r = await sesion.from('courses').update({ status: 'pending_review' }).eq('id', cursoFisSin)
    anota('4', 'fiscalidad SIN jurisdicción NO se puede enviar a revisión',
      r.error ? 'FUNCIONA' : 'FALLA',
      r.error ? `rechazado: ${r.error.message.slice(0, 80)}` : 'SE PERMITIO, y no debería')
  }

  // 4b. El curso de fiscalidad CON jurisdicción, pero sin verificación en fiscalidad
  const cursoFisCon = creados.cursos[2]
  if (cursoFisCon) {
    const r = await sesion.from('courses').update({ status: 'pending_review' }).eq('id', cursoFisCon)
    anota('4', 'fiscalidad CON jurisdicción pero sin verificación: se rechaza',
      r.error ? 'FUNCIONA' : 'FALLA',
      r.error ? `rechazado: ${r.error.message.slice(0, 80)}` : 'SE PERMITIO, y no debería')
  }

  // 4c. El de ethereum, donde SÍ está verificado
  if (cursoEth) {
    const r = await sesion.from('courses').update({ status: 'pending_review' }).eq('id', cursoEth).select('status').single()
    anota('4', 'ethereum, donde sí está verificado: se envía a revisión',
      r.error ? 'FALLA' : 'FUNCIONA',
      r.error ? `${r.error.code}: ${r.error.message.slice(0, 90)}` : `status=${r.data.status}`)
  }

  // 4d. Desde pending_review solo puede volver a draft
  if (cursoEth) {
    const r = await sesion.from('courses').update({ status: 'published' }).eq('id', cursoEth)
    anota('4', 'el instructor NO puede publicar por su cuenta',
      r.error ? 'FUNCIONA' : 'FALLA',
      r.error ? `rechazado: ${r.error.message.slice(0, 70)}` : 'SE PERMITIO, y no debería')
  }

  // 4e. La notificación de «cambios solicitados»
  const rn = await svc.from('notifications').insert({
    user_id: creados.usuario, type: 'course_changes_requested',
    title: `${MARCA} cambios`, message: 'prueba',
  }).select('id')
  if (rn.error) {
    anota('4', 'notificación «cambios solicitados»', 'FALLA', `${rn.error.code}: el enum no lo admite (lo arregla la 112)`)
  } else {
    await svc.from('notifications').delete().eq('id', rn.data[0].id)
    anota('4', 'notificación «cambios solicitados»', 'FUNCIONA', 'el enum ya lo admite')
  }

  anota('4', 'pedir cambios y aprobar POR LA RUTA de admin', 'NO PROBADO',
    'exige sesión de admin; no se puede crear una de usar y tirar (trigger de la 100)')

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ PASO 5: publicación ═══')

  if (cursoEth) {
    // Lo hace la administración con el cliente de servicio, que es lo que hace la ruta.
    const r = await svc.from('courses')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', cursoEth).select('status').single()
    anota('5', 'la administración publica el curso', r.error ? 'FALLA' : 'FUNCIONA',
      r.error ? r.error.message.slice(0, 90) : `status=${r.data.status}`)

    // ¿Lo ve el público?
    const rp = await anon.from('courses').select('id, title').eq('id', cursoEth).maybeSingle()
    anota('5', 'el curso publicado es visible para anon', rp.data ? 'FUNCIONA' : 'FALLA',
      rp.error ? rp.error.code : rp.data ? 'visible' : 'no visible')
  }

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ PASO 6: editar un curso publicado ═══')

  if (cursoEth) {
    const r = await sesion.from('courses')
      .update({ description: 'Descripción editada durante la auditoría.' })
      .eq('id', cursoEth).select('status, description').single()

    if (r.error) {
      anota('6', 'el instructor edita su curso publicado', 'FALLA', `${r.error.code}: ${r.error.message.slice(0, 90)}`)
    } else {
      anota('6', 'el instructor edita su curso publicado', 'FUNCIONA', `sigue en «${r.data.status}»`)
      anota('6', '¿vuelve a revisión al editarlo?',
        r.data.status === 'published' ? 'FALLA' : 'FUNCIONA',
        r.data.status === 'published'
          ? 'NO vuelve: el cambio se publica sin revisar'
          : `pasa a ${r.data.status}`)
    }

    // ¿Y el contenido de una lección?
    if (creados.lecciones[0]) {
      const rl = await sesion.from('lessons')
        .update({ content: '<p>Contenido cambiado sin revisión.</p>' })
        .eq('id', creados.lecciones[0]).select('id').single()
      anota('6', 'el instructor cambia el contenido de una lección publicada',
        rl.error ? 'FUNCIONA' : 'FALLA',
        rl.error ? `rechazado: ${rl.error.code}` : 'se publica al instante, sin revisión')
    }
  }
} catch (e) {
  console.log(`\n*** La auditoría se detuvo: ${(e as Error).message}`)
  anota('—', 'la auditoría se completó', 'FALLA', (e as Error).message.slice(0, 120))
} finally {
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ LIMPIEZA ═══')

  for (const id of creados.preguntas) await svc.from('quiz_questions').delete().eq('id', id)
  for (const id of creados.lecciones) await svc.from('lessons').delete().eq('id', id)
  for (const id of creados.modulos) await svc.from('modules').delete().eq('id', id)
  for (const id of creados.cursos) await svc.from('courses').delete().eq('id', id)
  if (creados.certificacion) await svc.from('instructor_certifications').delete().eq('id', creados.certificacion)
  await svc.from('notifications').delete().like('title', `${MARCA}%`)
  if (creados.usuario) await svc.auth.admin.deleteUser(creados.usuario)

  const restos: string[] = []
  const { count: c1 } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  if (c1) restos.push(`${c1} curso(s)`)
  const { count: c2 } = await svc.from('lessons').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  if (c2) restos.push(`${c2} lección(es)`)
  const { count: c3 } = await svc.from('instructor_certifications').select('id', { count: 'exact', head: true }).like('certification_number', 'QA-AUD-%')
  if (c3) restos.push(`${c3} verificación(es)`)
  if (creados.usuario) {
    const { data } = await svc.auth.admin.getUserById(creados.usuario)
    if (data?.user) restos.push('la cuenta de prueba')
  }

  console.log(`   ${restos.length === 0 ? 'OK   no queda nada de la auditoría' : 'FALLA quedan restos: ' + restos.join(', ')}`)

  // Y que las cuentas reales sigan como estaban
  const { data: real } = await svc.from('instructor_certifications')
    .select('status, users!user_id(full_name)')
    .not('certification_number', 'like', 'QA-AUD-%')
  console.log(`   verificaciones reales intactas: ${(real ?? []).map((x) => {
    const u = Array.isArray(x.users) ? x.users[0] : x.users
    return `${(u as { full_name: string } | null)?.full_name}:${x.status}`
  }).join(', ') || '(ninguna)'}`)

  console.log('\n═══ RESUMEN ═══')
  for (const e of ['FALLA', 'NO PROBADO', 'FUNCIONA'] as Estado[]) {
    const n = hallazgos.filter((h) => h.estado === e).length
    console.log(`   ${e.padEnd(11)} ${n}`)
  }
}
