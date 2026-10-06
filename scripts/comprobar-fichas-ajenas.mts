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
 * Las excepciones, una por una y con su motivo. Son las fichas que la política
 * por función SIGUE dando a una sesión.
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
    fichero: 'app/api/projects/[id]/collaborators/route.ts',
    porque: 'PENDIENTE: lib/projects esta a falta de diagnostico —si se usa, si tiene datos, si se retira entero—. Declarada para no bloquear la 123; se resuelve con ese diagnostico',
  },
]

/**
 * Lo que delata que la lectura es de la fila propia.
 *
 * PRECISO, NO AMPLIO. Una version amplia —cualquier cadena que contuviera
 * «user»— daba por fila propia cosas como `.eq('id', exp.user_id)`, que es la
 * ficha de OTRA persona. Equivocarse en esa direccion es lo peor que puede
 * hacer este guardian: callarse donde tenia que avisar.
 *
 * Son las cuatro formas que de verdad aparecen en el repositorio, todas
 * terminadas en el `.id` de quien pregunta. `user_id` queda fuera a proposito.
 */
const FILA_PROPIA = [
  /\.eq\(\s*['"]id['"]\s*,\s*(?:[A-Za-z_$][\w$]*\.)*user!?\??\.id\s*\)/,
  /\.eq\(\s*['"]id['"]\s*,\s*(userId|uid|usuario|miId)\s*\)/,
]

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
      if (FILA_PROPIA.some((p) => p.test(trozo))) continue
      anota(m.index, 'directa')
    }

    // ── 2. Embeds dentro de otra consulta ─────────────────────────────────
    const reEmbed = /(users\s*![a-z_]*\s*\(|[a-zA-Z_]+\s*:\s*users\s*\()/g
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
