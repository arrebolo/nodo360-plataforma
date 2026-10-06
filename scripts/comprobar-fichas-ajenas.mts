/**
 * EL GUARDIAN: nadie lee con una sesión la ficha de otra persona sin declararlo.
 *
 *   npx tsx scripts/comprobar-fichas-ajenas.mts            # corta si hay hallazgos
 *   npx tsx scripts/comprobar-fichas-ajenas.mts --informe  # solo los enumera
 *
 * POR QUE EXISTE
 *   La migración 123 cambia la política de filas de `public.users`: una sesión
 *   dejará de ver TODAS las filas y verá solo la propia y las de quien tiene
 *   página pública —instructor con perfil activo, mentor activo, o autor de un
 *   curso publicado—. Hoy `users_read_all_authenticated USING (true)` deja a
 *   cualquier cuenta registrada listar las 25 filas con su rol; eso es lo que se
 *   cierra.
 *
 *   El problema es que una lectura así **no falla**: devuelve menos filas, o
 *   ninguna, y la pantalla se queda con un hueco donde iba un nombre. Nadie se
 *   entera hasta que alguien mira.
 *
 * QUE CUENTA COMO HALLAZGO
 *   Una lectura de `users` —directa o como embed— hecha con el CLIENTE DE SESIÓN
 *   y que no esté acotada a la fila propia. Las salidas legítimas son dos:
 *
 *     · el CLIENTE DE SERVICIO, cuando la pantalla ya ha comprobado quién entra
 *       (requireAdmin, requireMentor, requireInstructorLike, un 403 por rol, o
 *       la participación en una conversación);
 *     · o una EXCEPCIÓN DECLARADA aquí abajo, para las fichas de quien tiene
 *       página pública, que la política nueva sigue dando.
 *
 * COMO SE DISTINGUE UN CLIENTE DE OTRO, y por qué no por el nombre
 *   La primera versión de esto miraba el nombre de la variable: `supabase` era la
 *   sesión y `admin` o `servicio` el servicio. **Estaba mal, y dio cinco falsos
 *   positivos.** En este repositorio hay ficheros donde el cliente de servicio se
 *   llama `db` (`app/api/admin/verificaciones/route.ts`) y otros donde se llama
 *   `supabase` (`lib/notifications/broadcast.ts`):
 *
 *       const db = createAdminClient() as unknown as SupabaseClient
 *       const supabase = createAdminClient()
 *
 *   Así que ahora se lee CADA FICHERO buscando qué variables reciben un
 *   `createAdminClient()`, y las llamadas sobre esas no cuentan. El nombre no
 *   dice nada; la asignación sí.
 *
 * LA FILA PROPIA SE RASTREA, NO SE SUPONE
 *   Este guardián tuvo un agujero que dejó pasar un fallo de verdad:
 *   `.eq('id', userId)` contaba como fila propia **porque la variable se llamaba
 *   `userId`**. En `app/api/messages/conversations/route.ts` ese `userId` viene
 *   del CUERPO de la petición, y la ruta comprueba antes que es DISTINTO del de
 *   la sesión. O sea que el guardián eximía exactamente la lectura de la ficha
 *   de otra persona.
 *
 *   Un nombre no prueba nada. Ahora se rastrea de dónde sale el valor:
 *
 *       const { data: { user } }     = await supabase.auth.getUser()
 *       const { data: { user: yo } } = await supabase.auth.getUser()
 *       const { data: authData }     = await supabase.auth.getUser()
 *       const { userId }             = await requireMentor()
 *       const miId = user.id
 *
 *   Solo esas cadenas, y sus alias, valen como «la fila propia». Cualquier otra
 *   cosa —un id de un cuerpo, de un parámetro de ruta, de una consulta— es la
 *   ficha de otra persona y exige excepción declarada.
 *
 * LO QUE SIGUE SIN VER
 *   Un cliente que llegue como parámetro de una función, o que se guarde en un
 *   objeto. No hay ninguno así hoy. Y los comentarios se quitan antes de buscar,
 *   porque la primera versión se delató a sí misma contando como hallazgo un
 *   comentario que explicaba un embed retirado.
 */
import fs from 'node:fs'
import path from 'node:path'

const SOLO_INFORME = process.argv.includes('--informe')
const RAICES = ['app', 'lib', 'components']

/**
 * Las excepciones, una por una y con su motivo.
 *
 * Son de dos clases, y la segunda es la que puede podrirse:
 *
 *   · FICHAS DE FUNCION PUBLICA —autor de curso publicado, instructor con perfil
 *     activo, mentor—, que la politica nueva SIGUE dando a una sesion.
 *   · AYUDANTES QUE RECIBEN EL ID COMO PARAMETRO. Ahi el rastreo no puede
 *     llegar: el id lo pone quien llama. Se han comprobado los llamantes uno por
 *     uno y todos pasan el de la sesion, pero **eso deja de ser verdad el dia
 *     que alguien los llame con el id de otro**, y este guardian no lo vera. Si
 *     se toca uno de esos ficheros, hay que volver a mirar sus llamantes.
 */
const DECLARADAS: Array<{ fichero: string; porque: string }> = [
  {
    fichero: 'app/cursos/[slug]/page.tsx',
    porque: 'el autor de un curso publicado tiene pagina publica: la politica por funcion le da la fila',
  },
  {
    fichero: 'app/(public)/mentores/page.tsx',
    porque: 'lista mentores activos de user_roles, que son funcion publica',
  },
  {
    fichero: 'app/(public)/mentores/[id]/page.tsx',
    porque: 'la ficha de un mentor: funcion publica',
  },
  {
    fichero: 'components/instructor/InstructorPreviewModal.tsx',
    porque: 'lo abre un visitante sobre un autor o instructor, que es funcion publica',
  },
  {
    fichero: 'app/(public)/instructores/[id]/page.tsx',
    porque: 'la pagina publica de un instructor: quien tiene perfil de instructor ACTIVO es funcion publica, y la politica le da la fila. Son los dos embeds sin alias, users(...), que este guardian no veia hasta ahora',
  },
  {
    fichero: 'lib/auth/isAdmin.ts',
    porque: 'recibe el id COMO PARAMETRO y lee esa fila. Comprobado: no tiene ningun llamante —es codigo muerto, para la PR de limpieza—. Si algun dia se usa, tiene que ser con el id de la sesion',
  },
  {
    fichero: 'lib/auth/suspension.ts',
    porque: 'recibe el id como parametro; comprobado que su unico llamante, app/(private)/layout.tsx, le pasa user.id de la sesion',
  },
  {
    fichero: 'lib/progress/checkLessonAccess.ts',
    porque: 'recibe el id como parametro; comprobado que su unico llamante, la pagina de la leccion, le pasa el de la sesion',
  },
  {
    fichero: 'app/api/projects/[id]/collaborators/route.ts',
    porque: 'PENDIENTE: lib/projects esta a falta de diagnostico —si se usa, si tiene datos, si se retira entero—. Declarada para no bloquear la 123; se resuelve con ese diagnostico',
  },
]

/**
 * De dónde sale una identidad de sesión en este fichero.
 *
 * Tres formas, y se guardan por separado porque se usan distinto:
 *   `usuario`  la variable ES el objeto del usuario: vale `X.id`
 *   `sobre`    la variable ENVUELVE al usuario: vale `X.user.id`
 *   `id`       la variable ES ya el id: vale `X` a secas
 */
function identidadesDeSesion(texto: string) {
  const usuario = new Set<string>()
  const sobre = new Set<string>()
  const id = new Set<string>()

  // const { data: { user } } = await ...auth.getUser()   /   { user: alias }
  const reUser = /data\s*:\s*\{\s*user\s*(?::\s*([A-Za-z_$][\w$]*))?\s*[,}][\s\S]{0,160}?auth\.getUser\s*\(/g
  let m: RegExpExecArray | null
  while ((m = reUser.exec(texto))) usuario.add(m[1] ?? 'user')

  // const { data: authData } = await ...auth.getUser()
  const reSobre = /data\s*:\s*([A-Za-z_$][\w$]*)\s*[,}][\s\S]{0,160}?auth\.getUser\s*\(/g
  while ((m = reSobre.exec(texto))) sobre.add(m[1])

  // const { userId } = await <uno de estos tres>()   /   { userId: alias }
  //
  // LISTA EXPLICITA, no un comodin `require*`. Un comodin daba por sesion
  // cualquier funcion que empezara por «require» y cualquier campo llamado
  // `userId`: eso son dos suposiciones por nombre, y una funcion nueva que
  // devolviera el id de OTRA persona quedaria exenta sin que nadie lo decidiera.
  // Los tres de aqui estan comprobados en su fichero: los tres sacan el id de
  // `auth.getUser()`.
  const reRequire = /\{[^}]*\buserId\s*(?::\s*([A-Za-z_$][\w$]*))?[^}]*\}\s*=\s*await\s+require(?:Mentor|InstructorLike|Instructor|AuthId)\s*\(/g
  while ((m = reRequire.exec(texto))) id.add(m[1] ?? 'userId')

  // const X = await requireAuthId()   -> X ES el id de la sesion
  const reIdDirecto = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+requireAuthId\s*\(/g
  while ((m = reIdDirecto.exec(texto))) id.add(m[1])

  // const X = <envoltorio>?.user      -> X es el objeto del usuario
  // Dos pantallas lo escriben asi, y sin esto su `.eq('id', user.id)` se contaba
  // como ficha ajena. Se sigue la asignacion desde algo YA rastreado, no el nombre.
  const reDesenvuelve = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)[!?]*\??\.user\b/g
  while ((m = reDesenvuelve.exec(texto))) {
    if (sobre.has(m[2])) usuario.add(m[1])
  }

  // const X = <algo que ya es sesion>.id      (una pasada basta: no hay cadenas largas)
  const reAlias = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$.!?]*)\.id\b/g
  while ((m = reAlias.exec(texto))) {
    const base = m[2].replace(/[!?]/g, '').split('.')
    if (usuario.has(base[0]) || (sobre.has(base[0]) && base[1] === 'user')) id.add(m[1])
  }

  return { usuario, sobre, id }
}

/**
 * ¿La lectura está acotada a la fila de quien pregunta?
 *
 * Solo si el valor del `.eq('id', …)` se puede RASTREAR hasta la sesión. Si no
 * se puede, se responde que no: mejor pedir una excepción declarada que eximir
 * una lectura ajena, que es el fallo que tuvo este guardián.
 */
function esFilaPropia(trozo: string, sesion: ReturnType<typeof identidadesDeSesion>): boolean {
  const m = /\.eq\(\s*['"]id['"]\s*,\s*([^),]+)\)/.exec(trozo)
  if (!m) return false
  const expr = m[1].trim().replace(/[!?]/g, '')

  // X a secas: tiene que ser un id de sesion
  if (/^[A-Za-z_$][\w$]*$/.test(expr)) return sesion.id.has(expr)

  const partes = expr.split('.')
  if (partes.length < 2 || partes[partes.length - 1] !== 'id') return false

  // X.id donde X es el objeto del usuario
  if (partes.length === 2 && sesion.usuario.has(partes[0])) return true
  // X.user.id donde X envuelve al usuario
  if (partes.length === 3 && partes[1] === 'user' && sesion.sobre.has(partes[0])) return true
  // …algo.user.id, con el `user` rastreado
  if (sesion.usuario.has(partes[partes.length - 2])) return true

  return false
}

type Hallazgo = { fichero: string; linea: number; texto: string; forma: string }

const hallazgos: Hallazgo[] = []
const declarados = new Set(DECLARADAS.map((d) => d.fichero))
const usadas = new Set<string>()

/** Los comentarios se sustituyen por espacios: las posiciones siguen cuadrando. */
function sinComentarios(texto: string): string {
  const enBlanco = (m: string) => m.replace(/[^\n]/g, ' ')
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, enBlanco)
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p1) => p1 + enBlanco(m.slice(p1.length)))
}

/** Qué variables de este fichero tienen un cliente de servicio. */
function clientesDeServicio(texto: string): Set<string> {
  const nombres = new Set<string>()
  const re = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:await\s+)?create(?:Admin|SupabaseAdmin)Client\s*\(/g
  let m: RegExpExecArray | null
  while ((m = re.exec(texto))) nombres.add(m[1])
  return nombres
}

/**
 * Sobre qué se llama al `.from(` más cercano hacia atrás.
 *
 * DOS FORMAS, y la segunda se me escapaba. Hay ficheros que guardan el cliente
 * en una variable y otros que lo llaman y encadenan sin guardarlo:
 *
 *     const { data } = await createAdminClient()
 *       .from('courses')
 *
 * La primera version solo entendia `identificador.from(`, asi que en esos nueve
 * sitios no reconocia el receptor y los contaba como sesion. Nueve falsos
 * positivos, todos en pantallas que YA usaban el servicio.
 *
 * Devuelve el nombre de la variable, o la cadena '@servicio' cuando es la
 * llamada en linea.
 */
function receptor(texto: string, posicion: number): string | null {
  const antes = texto.slice(Math.max(0, posicion - 900), posicion)
  const re = /(create(?:Admin|SupabaseAdmin)Client\s*\(\s*\)|[A-Za-z_$][\w$]*)\s*(?:\n\s*)?\.from\(/g
  let ultimo: string | null = null
  let m: RegExpExecArray | null
  while ((m = re.exec(antes))) {
    ultimo = /^create/.test(m[1]) ? '@servicio' : m[1]
  }
  return ultimo
}

function ficheros(raiz: string): string[] {
  const salida: string[] = []
  const recorrer = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) {
        if (e.name !== 'node_modules') recorrer(p)
      } else if (/\.(ts|tsx|mts)$/.test(e.name)) {
        salida.push(p.replace(/\\/g, '/'))
      }
    }
  }
  if (fs.existsSync(raiz)) recorrer(raiz)
  return salida
}

for (const raiz of RAICES) {
  for (const f of ficheros(raiz)) {
    const bruto = fs.readFileSync(f, 'utf8')
    const lineas = bruto.split(/\r?\n/)
    const texto = sinComentarios(bruto)
    const servicio = clientesDeServicio(texto)
    const sesion = identidadesDeSesion(texto)

    const anota = (indice: number, forma: string) => {
      const linea = texto.slice(0, indice).split(/\r?\n/).length
      if (declarados.has(f)) { usadas.add(f); return }
      hallazgos.push({ fichero: f, linea, texto: lineas[linea - 1]?.trim().slice(0, 90) ?? '', forma })
    }

    // ── 1. Lecturas directas ──────────────────────────────────────────────
    const re = /(create(?:Admin|SupabaseAdmin)Client\s*\(\s*\)|[A-Za-z_$][\w$]*)\s*(?:\n\s*)?\.from\(\s*['"]users['"]\s*\)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(texto))) {
      if (/^create/.test(m[1]) || servicio.has(m[1])) continue
      const trozo = texto.slice(m.index, m.index + 420)
      if (!/\.select\(/.test(trozo)) continue
      if (esFilaPropia(trozo, sesion)) continue
      anota(m.index, 'directa')
    }

    // ── 2. Embeds dentro de otra consulta ─────────────────────────────────
    // LAS TRES FORMAS DE EMBED, y a la tercera le faltaba sitio:
    //   users!clave_ajena ( … )     por el nombre de la clave
    //   alias:users ( … )           con alias
    //   users ( … )                 a secas, sin alias ni clave   <- esta faltaba
    // La ultima la usa app/(public)/instructores/[id]/page.tsx dos veces, y el
    // guardian no la veia.
    const reEmbed = /(?:[a-zA-Z_][\w]*\s*:\s*)?users\s*(?:![a-z_]*)?\s*\(/g
    while ((m = reEmbed.exec(texto))) {
      const quien = receptor(texto, m.index)
      if (quien === '@servicio' || (quien && servicio.has(quien))) continue
      anota(m.index, 'embed')
    }
  }
}

console.log('\n=== fichas de otras personas leidas con la sesion ===\n')

if (hallazgos.length === 0) {
  console.log('  ninguna sin declarar')
} else {
  for (const h of hallazgos) {
    console.log(`  ${h.fichero}:${h.linea}  (${h.forma})`)
    console.log(`     ${h.texto}`)
  }
}

console.log(`\n  excepciones declaradas: ${DECLARADAS.length}`)
for (const d of DECLARADAS) {
  console.log(`    ${usadas.has(d.fichero) ? 'usada ' : 'SOBRA '} ${d.fichero}`)
  console.log(`             ${d.porque}`)
}

// Una excepción que ya no hace falta es basura que esconde el siguiente fallo.
const sobrantes = DECLARADAS.filter((d) => !usadas.has(d.fichero))

console.log(`\n  hallazgos ${hallazgos.length}, excepciones sobrantes ${sobrantes.length}  ` +
  (hallazgos.length === 0 && sobrantes.length === 0 ? 'TODO CORRECTO' : 'REVISAR'))

if (!SOLO_INFORME && (hallazgos.length > 0 || sobrantes.length > 0)) {
  console.log('\n  Si una lectura nueva es legitima, hay dos caminos: pasarla al cliente de')
  console.log('  servicio detras de la guardia que corresponda, o declararla arriba con su')
  console.log('  motivo. Lo que no vale es dejarla: con la 123 devolvera menos filas y la')
  console.log('  pantalla se quedara sin el nombre, sin que nada falle.\n')
  process.exit(1)
}
console.log()
