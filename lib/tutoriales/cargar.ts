/**
 * Lee del disco todos los tutoriales y los analiza.
 *
 *   content/tutoriales/<slug>/tutorial.md      cabecera YAML + Markdown
 *   content/tutoriales/<slug>/capturas.json    ancho, alto y peso de cada captura
 *   public/tutoriales/<slug>/NN-….webp         las capturas, servidas tal cual
 *
 * capturas.json lo escribe scripts/preparar-capturas.mts al convertir los PNG.
 * Aquí se comprueba que diga la verdad: que cada captura listada exista y pese
 * lo que dice. Así la página puede dar ancho y alto a cada imagen sin leerla.
 *
 * Las páginas del sitio se renderizan al pedirlas (el layout raíz las hace
 * dinámicas), así que esto corre también en la función de Vercel: una vez por
 * instancia, porque lib/tutoriales/fuente.ts guarda el resultado. Para que los
 * archivos estén allí, next.config.ts incluye content/tutoriales/ en el trazado.
 */
import fs from 'node:fs'
import path from 'node:path'
import { CURSOS_PUBLICADOS } from '@/lib/enlazado/cursos-publicados'
import { glossaryTerms } from '@/lib/glossary-data'
import { analizarTutorial, type Contexto, type Opciones } from './analizar'
import type { Captura, Tutorial } from './tipos'

export const CARPETA_CONTENIDO = path.join(process.cwd(), 'content', 'tutoriales')
export const CARPETA_CAPTURAS = path.join(process.cwd(), 'public', 'tutoriales')

function leerCapturas(slug: string, errores: string[]): Record<string, Captura> {
  const ruta = path.join(CARPETA_CONTENIDO, slug, 'capturas.json')
  if (!fs.existsSync(ruta)) return {}
  let datos: Record<string, Captura>
  try {
    datos = JSON.parse(fs.readFileSync(ruta, 'utf8'))
  } catch (e) {
    errores.push(`${slug}: capturas.json no se puede leer: ${(e as Error).message}`)
    return {}
  }
  for (const [nombre, c] of Object.entries(datos)) {
    const archivo = path.join(CARPETA_CAPTURAS, slug, nombre)
    if (!fs.existsSync(archivo)) {
      errores.push(`${slug}: capturas.json lista "${nombre}", que no está en public/tutoriales/${slug}/`)
    } else if (fs.statSync(archivo).size !== c.bytes) {
      errores.push(`${slug}: "${nombre}" no pesa lo que dice capturas.json; vuelve a pasar scripts/preparar-capturas.mts`)
    }
  }
  const carpeta = path.join(CARPETA_CAPTURAS, slug)
  if (fs.existsSync(carpeta)) {
    for (const nombre of fs.readdirSync(carpeta)) {
      if (!datos[nombre]) errores.push(`${slug}: public/tutoriales/${slug}/${nombre} no está en capturas.json`)
    }
  }
  return datos
}

/** Todos los tutoriales, borradores incluidos, y los errores de todos. */
export function cargarTutoriales(opciones: Opciones = {}): { tutoriales: Tutorial[]; errores: string[] } {
  const errores: string[] = []
  if (!fs.existsSync(CARPETA_CONTENIDO)) return { tutoriales: [], errores }

  const slugs = fs
    .readdirSync(CARPETA_CONTENIDO, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  const contexto: Contexto = {
    cursos: CURSOS_PUBLICADOS as Contexto['cursos'],
    terminos: new Set(glossaryTerms.map((t) => t.slug)),
    tutoriales: new Set(slugs),
  }

  const tutoriales: Tutorial[] = []
  for (const slug of slugs) {
    const ruta = path.join(CARPETA_CONTENIDO, slug, 'tutorial.md')
    if (!fs.existsSync(ruta)) {
      errores.push(`${slug}: falta content/tutoriales/${slug}/tutorial.md`)
      continue
    }
    const capturas = leerCapturas(slug, errores)
    const r = analizarTutorial(slug, fs.readFileSync(ruta, 'utf8'), capturas, contexto, opciones)
    errores.push(...r.errores)
    if (r.tutorial) tutoriales.push(r.tutorial)
  }

  // Un tutorial publicado no puede apoyarse en un borrador: en producción, el
  // enlace o el requisito llevarían a un 404.
  const publicados = new Set(tutoriales.filter((t) => t.estado !== 'borrador').map((t) => t.slug))
  for (const t of tutoriales) {
    if (t.estado === 'borrador') continue
    for (const r of t.requisitos) {
      if ('tutorial' in r && !publicados.has(r.tutorial)) {
        errores.push(`${t.slug}: está publicado y pide como requisito "${r.tutorial}", que es un borrador`)
      }
    }
    for (const m of t.cuerpo.matchAll(/\/tutoriales\/([a-z0-9-]+)|:tutorial\[[^\]]*\]\{[^}]*slug="?([a-z0-9-]+)/g)) {
      const destino = m[1] ?? m[2]
      if (!publicados.has(destino)) errores.push(`${t.slug}: está publicado y enlaza a "${destino}", que es un borrador`)
    }
  }

  return { tutoriales, errores }
}
