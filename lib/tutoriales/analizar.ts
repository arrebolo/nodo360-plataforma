/**
 * Lee un tutorial (cabecera YAML + Markdown) y dice todo lo que tiene mal.
 *
 * Sin acceso a disco: recibe el texto y lo que ya existe (cursos, términos,
 * tutoriales, capturas). Lo usan la web, al construir las páginas, y
 * scripts/validar-tutoriales.mts, en el prebuild. Un tutorial con errores
 * para el build: lo que no pasa por aquí no llega a producción.
 *
 * POR QUÉ TAN ESTRICTO
 *   El Markdown solo admite una lista cerrada de nodos. No hay HTML crudo, ni
 *   tablas, ni citas: lo que no está en la lista es un error, no algo que se
 *   ignora. Así el renderizado no necesita sanear nada y el formato se puede
 *   guardar algún día tal cual en una columna de la base (docs/TUTORIALES.md).
 */
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import { parse as parseYaml } from 'yaml'
import type { Heading, Nodes, Root, RootContent } from 'mdast'
import {
  CATEGORIAS,
  ESTADOS,
  NIVELES,
  REDES,
  SISTEMAS,
  type Captura,
  type Tutorial,
} from './tipos'

export interface Contexto {
  /** Cursos publicados y sus lecciones (lib/enlazado/cursos-publicados.ts). */
  cursos: Record<string, { lecciones: readonly string[] }>
  /** Slugs del glosario. */
  terminos: ReadonlySet<string>
  /** Slugs de todos los tutoriales, publicados o no. */
  tutoriales: ReadonlySet<string>
}

export interface Opciones {
  /** Exigir lo que exige un tutorial publicado aunque sea un borrador. */
  comoPublicado?: boolean
}

/** Peso máximo de una captura ya convertida (docs/TUTORIALES.md, sección 8). */
export const PESO_MAXIMO_CAPTURA = 300 * 1024

const FECHA = /^\d{4}-\d{2}-\d{2}$/
const NOMBRE_CAPTURA = /^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/
const PASO = /^Paso (\d+): \S/

/**
 * Una palabra entera. Con \b no vale: en JavaScript la «á» no es letra para \b,
 * así que /\bacá\b/ no encuentra «acá» seguida de un espacio.
 */
const palabra = (patron: string) => new RegExp(`(?<!\\p{L})(?:${patron})(?!\\p{L})`, 'iu')

/** Las palabras marcadas del prompt maestro (CONVENCIONES DE IDIOMA). */
const PALABRAS_MARCADAS: ReadonlyArray<[RegExp, string]> = [
  [palabra('ordenador(?:es)?'), 'equipo'],
  [palabra('computadoras?'), 'equipo'],
  [palabra('m[oó]vil(?:es)?'), 'teléfono'],
  [palabra('celular(?:es)?'), 'teléfono'],
  [palabra('ficheros?'), 'archivo'],
  [palabra('cog(?:e|er|es|iendo)'), 'tomar, usar, elegir'],
  [palabra('merece la pena'), 'vale la pena'],
  [palabra('vosotros|vuestr[oa]s?'), 'tú o ustedes'],
  [palabra('acá|allá'), 'aquí, allí'],
  [palabra('tenés|podés|querés|sos'), 'tuteo, sin voseo'],
  [palabra('pinch(?:a|ar|es)|clic(?:a|ar)'), 'hacer clic, pulsar'],
]

/** Promesas y juicios de inversión (Principio #1). */
const PROMESAS: ReadonlyArray<RegExp> = [
  palabra('rentabilidad(?:es)?'),
  palabra('ingresos pasivos'),
  palabra('ganancias?'),
  palabra('oportunidad de inversión'),
  palabra('invierte|invertir'),
]

/**
 * Ni exchanges ni enlaces de referido (docs/TUTORIALES.md, sección 2). Se
 * comparan etiquetas enteras del dominio: «kraken» casa con www.kraken.com,
 * no con un dominio que solo lo contenga.
 */
const DOMINIOS_PROHIBIDOS = [
  'binance', 'coinbase', 'kraken', 'bit2me', 'bybit', 'okx', 'kucoin', 'bitpanda',
  'bitstamp', 'crypto.com', 'bitget', 'gate.io', 'huobi', 'htx', 'mexc',
]

const esClave = <T extends object>(obj: T, v: unknown): v is keyof T =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(obj, v)
const PARAMETROS_DE_REFERIDO = /^(ref|aff|affiliate|referral|referrer|utm_.*)$/i

const CLAVES_CABECERA = new Set([
  'titulo', 'resumen', 'categoria', 'nivel', 'duracionMinutos', 'sistemas', 'red',
  'requisitos', 'programas', 'cursos', 'terminos', 'publicadoEl', 'revisadoEl', 'estado',
])
const CLAVES_PROGRAMA = new Set([
  'nombre', 'version', 'descargaOficial', 'repositorio', 'probadoEl', 'probadoEn',
])

export const DIRECTIVAS_DE_BLOQUE = {
  aviso: ['tipo', 'titulo'],
  'deberias-ver': [],
  sistema: ['so'],
} as const
export const DIRECTIVAS_DE_TEXTO = {
  termino: ['slug'],
  tutorial: ['slug'],
} as const
export const TIPOS_DE_AVISO = ['seguridad', 'nota', 'si-falla'] as const

/**
 * Los bloques de código y cómo se rotulan. `salida` es lo que muestra la
 * pantalla al ejecutar el comando anterior: se ve atenuado y no se copia.
 */
export const LENGUAJES_DE_CODIGO = {
  powershell: 'PowerShell',
  bash: 'Terminal',
  salida: 'Salida esperada',
} as const

/** Los nodos de Markdown que se admiten. Todo lo demás es un error. */
const NODOS_ADMITIDOS = new Set([
  'root', 'paragraph', 'heading', 'text', 'emphasis', 'strong', 'inlineCode',
  'code', 'list', 'listItem', 'link', 'image', 'break',
  'containerDirective', 'textDirective',
])

/** Separa la cabecera YAML del cuerpo. Admite saltos de línea CRLF. */
export function separarCabecera(texto: string): { cabecera: string; cuerpo: string } | null {
  const limpio = texto.replace(/\r\n/g, '\n').replace(/^﻿/, '')
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(limpio)
  return m ? { cabecera: m[1], cuerpo: m[2] } : null
}

export function arbolDelCuerpo(cuerpo: string): Root {
  return unified().use(remarkParse).use(remarkDirective).parse(cuerpo)
}

/** El texto plano de un nodo, sin formato. */
export function textoDe(nodo: Nodes): string {
  if ('value' in nodo && typeof nodo.value === 'string') return nodo.value
  if ('children' in nodo) return (nodo.children as Nodes[]).map(textoDe).join('')
  return ''
}

/** Los pasos del tutorial: los `## Paso N: …`, en orden. */
export function pasosDe(arbol: Root): { numero: number; titulo: string }[] {
  const pasos: { numero: number; titulo: string }[] = []
  for (const n of arbol.children) {
    if (n.type !== 'heading' || n.depth !== 2) continue
    const t = textoDe(n as Heading)
    const m = PASO.exec(t)
    if (m) pasos.push({ numero: Number(m[1]), titulo: t.replace(/^Paso \d+: /, '') })
  }
  return pasos
}

const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const esFecha = (v: unknown): v is string => typeof v === 'string' && FECHA.test(v) && !Number.isNaN(Date.parse(v))

/**
 * Analiza un tutorial. Devuelve el tutorial (si la cabecera se pudo leer) y la
 * lista de errores, que tiene que estar vacía para publicarlo.
 */
export function analizarTutorial(
  slug: string,
  texto: string,
  capturas: Record<string, Captura>,
  contexto: Contexto,
  opciones: Opciones = {}
): { tutorial: Tutorial | null; errores: string[] } {
  const errores: string[] = []
  const err = (m: string) => errores.push(`${slug}: ${m}`)

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) err('el slug solo puede tener minúsculas, números y guiones')

  const partes = separarCabecera(texto)
  if (!partes) {
    err('falta la cabecera YAML entre dos líneas `---` al principio del archivo')
    return { tutorial: null, errores }
  }

  let c: Record<string, unknown>
  try {
    const leido = parseYaml(partes.cabecera)
    if (!leido || typeof leido !== 'object' || Array.isArray(leido)) throw new Error('no es un objeto')
    c = leido as Record<string, unknown>
  } catch (e) {
    err(`la cabecera YAML no se puede leer: ${(e as Error).message}`)
    return { tutorial: null, errores }
  }

  // ── Cabecera ────────────────────────────────────────────────────────────
  for (const k of Object.keys(c)) if (!CLAVES_CABECERA.has(k)) err(`campo desconocido en la cabecera: "${k}"`)

  const estado = c.estado
  if (!ESTADOS.includes(estado as never)) err(`estado debe ser uno de: ${ESTADOS.join(', ')}`)
  const exigente = opciones.comoPublicado || estado !== 'borrador'

  if (!esTexto(c.titulo)) err('falta el título')
  else if (c.titulo.length > 70) err(`el título tiene ${c.titulo.length} caracteres; máximo 70`)
  if (!esTexto(c.resumen)) err('falta el resumen')
  else if (c.resumen.length > 160) err(`el resumen tiene ${c.resumen.length} caracteres; máximo 160`)
  if (!esClave(CATEGORIAS, c.categoria)) err(`categoria debe ser una de: ${Object.keys(CATEGORIAS).join(', ')}`)
  if (!esClave(NIVELES, c.nivel)) err(`nivel debe ser uno de: ${Object.keys(NIVELES).join(', ')}`)
  if (!esClave(REDES, c.red)) err(`red debe ser una de: ${Object.keys(REDES).join(', ')}`)

  const duracion = c.duracionMinutos
  if (typeof duracion !== 'number' || !Number.isInteger(duracion) || duracion < 5 || duracion > 30) {
    err('duracionMinutos debe ser un número entero entre 5 y 30 (un tutorial son 10-20 minutos)')
  }

  const sistemas = Array.isArray(c.sistemas) ? c.sistemas : []
  if (!sistemas.length) err('sistemas: al menos uno')
  for (const s of sistemas) if (!esClave(SISTEMAS, s)) err(`sistema desconocido: "${s}"`)
  if (new Set(sistemas).size !== sistemas.length) err('sistemas: hay uno repetido')

  const requisitos = Array.isArray(c.requisitos) ? c.requisitos : c.requisitos == null ? [] : null
  if (!requisitos) err('requisitos debe ser una lista')
  for (const r of requisitos ?? []) {
    if (r && typeof r === 'object' && esTexto((r as { texto?: unknown }).texto) && Object.keys(r).length === 1) continue
    if (r && typeof r === 'object' && esTexto((r as { tutorial?: unknown }).tutorial) && Object.keys(r).length === 1) {
      const t = (r as { tutorial: string }).tutorial
      if (!contexto.tutoriales.has(t)) err(`requisitos: el tutorial "${t}" no existe`)
      continue
    }
    err('cada requisito es `- texto: …` o `- tutorial: <slug>`')
  }

  const programas = Array.isArray(c.programas) ? c.programas : c.programas == null ? [] : null
  if (!programas) err('programas debe ser una lista')
  for (const [i, p] of (programas ?? []).entries()) {
    const q = (p ?? {}) as Record<string, unknown>
    const nombre = esTexto(q.nombre) ? q.nombre : `programa ${i + 1}`
    for (const k of Object.keys(q)) if (!CLAVES_PROGRAMA.has(k)) err(`${nombre}: campo desconocido "${k}"`)
    if (!esTexto(q.nombre)) err(`${nombre}: falta el nombre`)
    if (!esTexto(q.version) && typeof q.version !== 'number') err(`${nombre}: falta la versión (entre comillas: "31.1")`)
    if (typeof q.version === 'number') err(`${nombre}: la versión va entre comillas, o YAML convierte "31.10" en 31.1`)
    if (!esTexto(q.descargaOficial) || !q.descargaOficial.startsWith('https://')) {
      err(`${nombre}: descargaOficial debe ser una URL https`)
    } else {
      revisarEnlaceExterno(q.descargaOficial, err)
    }
    if (q.repositorio != null && (!esTexto(q.repositorio) || !q.repositorio.startsWith('https://'))) {
      err(`${nombre}: repositorio debe ser una URL https`)
    }
    if (q.probadoEl != null && !esFecha(q.probadoEl)) err(`${nombre}: probadoEl debe ser una fecha AAAA-MM-DD`)
    if (exigente && !esFecha(q.probadoEl)) err(`${nombre}: para publicar hace falta probadoEl (Principio #4: lo no probado no se publica)`)
    if (exigente && !esTexto(q.probadoEn)) err(`${nombre}: para publicar hace falta probadoEn`)
  }

  const cursos = Array.isArray(c.cursos) ? c.cursos : c.cursos == null ? [] : null
  if (!cursos) err('cursos debe ser una lista')
  for (const x of cursos ?? []) {
    const { curso, leccion } = (x ?? {}) as { curso?: string; leccion?: string }
    const datos = curso ? contexto.cursos[curso] : undefined
    if (!datos) err(`cursos: "${curso}" no es un curso publicado`)
    else if (leccion && !datos.lecciones.includes(leccion)) err(`cursos: la lección "${leccion}" no pertenece a "${curso}"`)
  }

  const terminos = Array.isArray(c.terminos) ? c.terminos : c.terminos == null ? [] : null
  if (!terminos) err('terminos debe ser una lista')
  for (const t of terminos ?? []) if (!contexto.terminos.has(t)) err(`terminos: "${t}" no está en el glosario`)

  for (const k of ['publicadoEl', 'revisadoEl'] as const) {
    if (c[k] != null && !esFecha(c[k])) err(`${k} debe ser una fecha AAAA-MM-DD`)
  }
  if (exigente && !esFecha(c.publicadoEl)) err('para publicar hace falta publicadoEl')

  for (const k of ['titulo', 'resumen'] as const) {
    if (esTexto(c[k])) revisarRedaccion(c[k], k, err)
  }

  // ── Cuerpo ──────────────────────────────────────────────────────────────
  const arbol = arbolDelCuerpo(partes.cuerpo)
  revisarCuerpo(arbol, capturas, contexto, exigente, err)

  const tutorial: Tutorial = {
    slug,
    titulo: String(c.titulo ?? ''),
    resumen: String(c.resumen ?? ''),
    categoria: c.categoria as Tutorial['categoria'],
    nivel: c.nivel as Tutorial['nivel'],
    duracionMinutos: Number(duracion),
    sistemas: sistemas as Tutorial['sistemas'],
    red: c.red as Tutorial['red'],
    requisitos: (requisitos ?? []) as Tutorial['requisitos'],
    programas: ((programas ?? []) as Tutorial['programas']).map((p) => ({ ...p, version: String(p.version) })),
    cursos: (cursos ?? []) as Tutorial['cursos'],
    terminos: (terminos ?? []) as string[],
    publicadoEl: c.publicadoEl as string | undefined,
    revisadoEl: c.revisadoEl as string | undefined,
    estado: estado as Tutorial['estado'],
    cuerpo: partes.cuerpo,
    capturas,
  }
  return { tutorial, errores }
}

function revisarRedaccion(texto: string, donde: string, err: (m: string) => void) {
  for (const [re, usar] of PALABRAS_MARCADAS) {
    const m = re.exec(texto)
    if (m) err(`${donde}: «${m[0]}» no es español neutro; usar ${usar}`)
  }
  for (const re of PROMESAS) {
    const m = re.exec(texto)
    if (m) err(`${donde}: «${m[0]}» suena a juicio de inversión o promesa (Principio #1)`)
  }
}

function revisarEnlaceExterno(url: string, err: (m: string) => void) {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    err(`enlace que no es una URL: "${url}"`)
    return
  }
  if (u.protocol !== 'https:') err(`enlace sin https: "${url}"`)
  const host = u.hostname.toLowerCase()
  const etiquetas = host.split('.')
  const prohibido = DOMINIOS_PROHIBIDOS.find((d) =>
    d.includes('.') ? host === d || host.endsWith(`.${d}`) : etiquetas.includes(d)
  )
  if (prohibido) err(`enlace a un exchange (${prohibido}): "${url}"`)
  for (const p of u.searchParams.keys()) {
    if (PARAMETROS_DE_REFERIDO.test(p)) err(`enlace con parámetro de referido o seguimiento "${p}": "${url}"`)
  }
}

function revisarEnlaceInterno(url: string, contexto: Contexto, err: (m: string) => void) {
  const [ruta] = url.split(/[?#]/)
  const partes = ruta.split('/').filter(Boolean)
  const [seccion, a, b] = partes
  if (seccion === 'glosario' && partes.length === 2) {
    if (!contexto.terminos.has(a)) err(`enlace a un término que no existe: "${url}"`)
  } else if (seccion === 'tutoriales' && partes.length === 2) {
    if (!contexto.tutoriales.has(a)) err(`enlace a un tutorial que no existe: "${url}"`)
  } else if (seccion === 'cursos' && (partes.length === 2 || partes.length === 3)) {
    const datos = contexto.cursos[a]
    if (!datos) err(`enlace a un curso que no está publicado: "${url}"`)
    else if (b && !datos.lecciones.includes(b)) err(`enlace a una lección que no es de ese curso: "${url}"`)
  } else {
    err(`enlace interno que no se puede comprobar: "${url}" (solo /glosario/…, /cursos/… y /tutoriales/…)`)
  }
}

function revisarCuerpo(
  arbol: Root,
  capturas: Record<string, Captura>,
  contexto: Contexto,
  exigente: boolean,
  err: (m: string) => void
) {
  const visitar = (nodo: Nodes, dentroDePaso: { deberiasVer: boolean } | null) => {
    if (!NODOS_ADMITIDOS.has(nodo.type)) {
      const muestra = textoDe(nodo).slice(0, 40) || ('value' in nodo ? String(nodo.value).slice(0, 40) : '')
      err(`elemento no admitido en el cuerpo: ${nodo.type}${muestra ? ` («${muestra}»)` : ''}`)
      return
    }
    switch (nodo.type) {
      case 'heading':
        if (nodo.depth === 1) err('el título va en la cabecera: el cuerpo no lleva `# …`')
        if (nodo.depth > 3) err(`encabezado de nivel ${nodo.depth}: solo se admiten ## y ###`)
        break
      case 'text':
        revisarRedaccion(nodo.value, 'cuerpo', err)
        break
      case 'code':
        if (!esClave(LENGUAJES_DE_CODIGO, nodo.lang)) {
          err(`bloque de código sin lenguaje o con uno desconocido ("${nodo.lang ?? ''}"); se admiten: ${Object.keys(LENGUAJES_DE_CODIGO).join(', ')}`)
        }
        break
      case 'link':
        if (nodo.url.startsWith('/')) revisarEnlaceInterno(nodo.url, contexto, err)
        else revisarEnlaceExterno(nodo.url, err)
        break
      case 'image': {
        const nombre = nodo.url
        if (!NOMBRE_CAPTURA.test(nombre)) {
          err(`captura "${nombre}": el nombre es NN-que-muestra.webp, sin carpeta`)
          break
        }
        const alt = (nodo.alt ?? '').trim()
        const base = nombre.replace(/\.webp$/, '')
        if (!alt) err(`captura "${nombre}": falta el texto alternativo`)
        else if (alt.length < 15 || /^(captura|imagen|foto)\b/i.test(alt) || alt === base || alt === nombre) {
          err(`captura "${nombre}": el texto alternativo tiene que describir lo que se ve («${alt}»)`)
        }
        const captura = capturas[nombre]
        if (!captura) {
          if (exigente) err(`captura "${nombre}": no existe en public/tutoriales/ (pasarla con scripts/preparar-capturas.mts)`)
        } else if (captura.bytes > PESO_MAXIMO_CAPTURA) {
          err(`captura "${nombre}": pesa ${Math.round(captura.bytes / 1024)} KB; máximo ${PESO_MAXIMO_CAPTURA / 1024}`)
        }
        break
      }
      case 'containerDirective': {
        const permitidos = DIRECTIVAS_DE_BLOQUE[nodo.name as keyof typeof DIRECTIVAS_DE_BLOQUE] as readonly string[] | undefined
        if (!permitidos) {
          err(`bloque desconocido ":::${nodo.name}" (se admiten: ${Object.keys(DIRECTIVAS_DE_BLOQUE).join(', ')})`)
          return
        }
        const attrs = nodo.attributes ?? {}
        for (const k of Object.keys(attrs)) if (!permitidos.includes(k)) err(`:::${nodo.name} no admite el atributo "${k}"`)
        if (nodo.name === 'aviso' && !TIPOS_DE_AVISO.includes(attrs.tipo as never)) {
          err(`:::aviso necesita tipo=${TIPOS_DE_AVISO.join('|')}`)
        }
        if (nodo.name === 'sistema' && !esClave(SISTEMAS, attrs.so)) {
          err(`:::sistema necesita so=${Object.keys(SISTEMAS).join('|')}`)
        }
        if (nodo.name === 'deberias-ver' && dentroDePaso) dentroDePaso.deberiasVer = true
        break
      }
      case 'textDirective': {
        const permitidos = DIRECTIVAS_DE_TEXTO[nodo.name as keyof typeof DIRECTIVAS_DE_TEXTO] as readonly string[] | undefined
        if (!permitidos) {
          // Un «texto:otra» suelto en una frase también acaba aquí: mejor
          // pararlo que publicar media frase convertida en otra cosa.
          err(`marca desconocida ":${nodo.name}" (se admiten: ${Object.keys(DIRECTIVAS_DE_TEXTO).join(', ')}). Si es texto normal, escribe un espacio después de los dos puntos`)
          return
        }
        const slug = String(nodo.attributes?.slug ?? '')
        if (nodo.name === 'termino' && !contexto.terminos.has(slug)) err(`:termino con un slug que no está en el glosario: "${slug}"`)
        if (nodo.name === 'tutorial' && !contexto.tutoriales.has(slug)) err(`:tutorial con un slug que no existe: "${slug}"`)
        break
      }
    }
    if ('children' in nodo) for (const h of nodo.children as Nodes[]) visitar(h, dentroDePaso)
  }

  // Los pasos: numerados desde 1, sin saltos, y cada uno con su «Deberías ver».
  let esperado = 1
  let pasoActual: { titulo: string; deberiasVer: boolean } | null = null
  const cerrarPaso = () => {
    if (pasoActual && !pasoActual.deberiasVer) err(`"${pasoActual.titulo}" no tiene bloque :::deberias-ver`)
    pasoActual = null
  }
  for (const nodo of arbol.children as RootContent[]) {
    if (nodo.type === 'heading' && nodo.depth === 2) {
      cerrarPaso()
      const t = textoDe(nodo)
      const m = PASO.exec(t)
      if (m) {
        if (Number(m[1]) !== esperado) err(`"${t}": se esperaba el paso ${esperado}`)
        esperado = Number(m[1]) + 1
        pasoActual = { titulo: t, deberiasVer: false }
      } else if (/^paso\b/i.test(t)) {
        err(`"${t}": un paso se escribe «Paso N: Verbo y objeto»`)
      }
    }
    visitar(nodo, pasoActual)
  }
  cerrarPaso()
  if (esperado === 1) err('el cuerpo no tiene ningún «## Paso 1: …»')
}
