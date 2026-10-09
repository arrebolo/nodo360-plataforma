/**
 * Pasa las capturas PNG de un tutorial a WebP y las deja listas para publicar.
 *
 *     npx tsx scripts/preparar-capturas.mts <slug> [carpeta-de-origen]
 *
 * La carpeta de origen es, por defecto, C:\Capturas-tutoriales\<slug>, la del
 * entorno de capturas (docs/TUTORIALES-CAPTURAS.md).
 *
 * Por cada NN-que-muestra.png:
 *   - lo reduce a 1.600 px de ancho como máximo (nunca lo amplía);
 *   - lo guarda como WebP en public/tutoriales/<slug>/NN-que-muestra.webp, con
 *     calidad 80, y baja la calidad si pasa del peso máximo;
 *   - sharp no copia los metadatos (EXIF, GPS…) salvo que se le pida: aquí no
 *     se le pide.
 * Y reescribe content/tutoriales/<slug>/capturas.json con el ancho, el alto y
 * el peso de cada una, que es lo que lee la página.
 *
 * Quitar los metadatos NO sustituye a mirar la captura entera, a tamaño real,
 * con la regla de datos personales de docs/TUTORIALES.md.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const PESO_MAXIMO = 300 * 1024
const ANCHO_MAXIMO = 1600
const NOMBRE = /^(\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*)\.png$/

const [slug, origenArg] = process.argv.slice(2)
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Uso: npx tsx scripts/preparar-capturas.mts <slug> [carpeta-de-origen]')
  process.exit(1)
}
const origen = origenArg ?? path.join('C:\\Capturas-tutoriales', slug)
const destino = path.join('public', 'tutoriales', slug)
const manifiesto = path.join('content', 'tutoriales', slug, 'capturas.json')

if (!fs.existsSync(path.join('content', 'tutoriales', slug, 'tutorial.md'))) {
  console.error(`No existe content/tutoriales/${slug}/tutorial.md`)
  process.exit(1)
}
if (!fs.existsSync(origen)) {
  console.error(`No existe la carpeta de origen: ${origen}`)
  process.exit(1)
}

const archivos = fs.readdirSync(origen).sort()
const malos = archivos.filter((a) => a.toLowerCase().endsWith('.png') && !NOMBRE.test(a))
if (malos.length) {
  console.error(`Nombres que no siguen NN-que-muestra.png (minúsculas, guiones): ${malos.join(', ')}`)
  process.exit(1)
}
const pngs = archivos.filter((a) => NOMBRE.test(a))
if (!pngs.length) {
  console.error(`No hay ningún NN-que-muestra.png en ${origen}`)
  process.exit(1)
}

fs.mkdirSync(destino, { recursive: true })
const datos: Record<string, { ancho: number; alto: number; bytes: number }> = fs.existsSync(manifiesto)
  ? JSON.parse(fs.readFileSync(manifiesto, 'utf8'))
  : {}

let fallos = 0
for (const png of pngs) {
  const nombre = png.replace(/\.png$/, '.webp')
  const salida = path.join(destino, nombre)
  let calidad = 80
  let info: sharp.OutputInfo
  for (;;) {
    info = await sharp(path.join(origen, png))
      .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
      .webp({ quality: calidad })
      .toFile(salida)
    if (info.size <= PESO_MAXIMO || calidad <= 50) break
    calidad -= 10
  }
  datos[nombre] = { ancho: info.width, alto: info.height, bytes: info.size }
  const kb = Math.round(info.size / 1024)
  const aviso = info.size > PESO_MAXIMO ? '  *** pasa de 300 KB: recórtala a la ventana' : ''
  if (aviso) fallos++
  console.log(`  ${nombre.padEnd(34)} ${String(info.width).padStart(4)}×${String(info.height).padEnd(4)} ${String(kb).padStart(4)} KB  calidad ${calidad}${aviso}`)
}

const ordenado = Object.fromEntries(Object.entries(datos).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(manifiesto, JSON.stringify(ordenado, null, 2) + '\n')
console.log(`\n${pngs.length} captura(s) en ${destino}; ${manifiesto} actualizado.`)
console.log('Antes de subirlas: ábrelas a tamaño real y repasa la regla de datos personales (docs/TUTORIALES.md, sección 8).')
process.exit(fallos ? 1 : 0)
