/**
 * Las reglas de lib/tutoriales/analizar.ts, caso por caso.
 *
 *     npx tsx scripts/comprobar-tutoriales.mts
 *
 * Sin disco ni red: parte de un tutorial válido, le rompe una cosa cada vez y
 * comprueba que el análisis lo dice. Y al revés: que el válido no da errores,
 * para que una regla demasiado amplia (una palabra marcada dentro de otra, un
 * dominio que solo se parece) también salga en rojo.
 */
import * as modulo from '../lib/tutoriales/analizar.ts'
const { analizarTutorial } = ((modulo as any).default ?? modulo) as typeof modulo

const contexto = {
  cursos: { 'curso-a': { lecciones: ['leccion-1'] } },
  terminos: new Set(['hash']),
  tutoriales: new Set(['otro-tutorial', 'el-tutorial']),
}

const CABECERA = `titulo: Comprobar algo
resumen: Un resumen corto.
categoria: verificacion
nivel: beginner
duracionMinutos: 10
sistemas: [windows, linux]
red: ninguna
requisitos:
  - texto: Un equipo
  - tutorial: otro-tutorial
programas:
  - nombre: Programa
    version: "1.10"
    descargaOficial: https://ejemplo.org/descargar
    probadoEl: 2026-10-01
    probadoEn: Windows 10
cursos:
  - curso: curso-a
    leccion: leccion-1
terminos: [hash]
publicadoEl: 2026-10-02
estado: publicado`

const CUERPO = `## Qué vas a conseguir

Un :termino[hash]{slug="hash"} y un [curso](/cursos/curso-a/leccion-1). Escoge la carpeta, sostén el cable inmóvil y recoge el resto.

## Paso 1: Haz algo

:::sistema{so="windows"}
\`\`\`powershell
Get-FileHash .\\archivo
\`\`\`
:::

\`\`\`salida
ABC
\`\`\`

![PowerShell con el hash calculado en una línea](01-hash-calculado.webp)

:::deberias-ver
Una línea.
:::

## Paso 2: Comprueba otra cosa

:::aviso{tipo="si-falla" titulo="Si no coincide"}
Vuelve a [descargarlo](https://ejemplo.org/descargar?version=2).
:::

:::deberias-ver
Otra línea.
:::
`

const CAPTURAS = { '01-hash-calculado.webp': { ancho: 800, alto: 400, bytes: 20_000 } }

const tutorial = (cabecera = CABECERA, cuerpo = CUERPO) => `---\n${cabecera}\n---\n${cuerpo}`

let fallos = 0
function analizar(texto: string, capturas: Record<string, { ancho: number; alto: number; bytes: number }> = CAPTURAS) {
  return analizarTutorial('el-tutorial', texto, capturas, contexto).errores
}
function sinErrores(nombre: string, texto: string) {
  const errores = analizar(texto)
  const bien = errores.length === 0
  if (!bien) fallos++
  console.log(`  ${bien ? 'BIEN' : '*** MAL'}  ${nombre}${bien ? '' : `\n         errores: ${JSON.stringify(errores)}`}`)
}
function falla(nombre: string, texto: string, esperado: string, capturas = CAPTURAS) {
  const errores = analizar(texto, capturas)
  const bien = errores.some((e) => e.includes(esperado))
  if (!bien) fallos++
  console.log(`  ${bien ? 'BIEN' : '*** MAL'}  ${nombre} -> «${esperado}»${bien ? '' : `\n         errores: ${JSON.stringify(errores)}`}`)
}
const cambiaCabecera = (de: string, a: string) => {
  if (!CABECERA.includes(de)) throw new Error(`la cabecera de prueba no contiene «${de}»`)
  return tutorial(CABECERA.replace(de, a))
}
const cambiaCuerpo = (de: string, a: string) => {
  if (!CUERPO.includes(de)) throw new Error(`el cuerpo de prueba no contiene «${de}»`)
  return tutorial(CABECERA, CUERPO.replace(de, a))
}

console.log('\n== El tutorial válido no da errores')
sinErrores('publicado, con todo', tutorial())
sinErrores('borrador sin capturas ni fechas de prueba', tutorial(
  CABECERA.replace('estado: publicado', 'estado: borrador').replace(/\n    probadoEl: .*\n    probadoEn: .*/, '').replace(/\npublicadoEl: .*/, '')
))
// «escoge», «recoge», «sostén» e «inmóvil» llevan dentro «coge», «sos» y
// «móvil»: no son palabras marcadas
sinErrores('«escoge», «sostén» e «inmóvil» no son «coger», «sos» ni «móvil»', tutorial())

console.log('\n== Cabecera')
falla('sin cabecera', CUERPO, 'falta la cabecera YAML')
falla('campo mal escrito', cambiaCabecera('duracionMinutos', 'duracion'), 'campo desconocido en la cabecera: "duracion"')
falla('categoría que no existe', cambiaCabecera('categoria: verificacion', 'categoria: trading'), 'categoria debe ser')
falla('nivel «toString» (heredado de Object)', cambiaCabecera('nivel: beginner', 'nivel: toString'), 'nivel debe ser')
falla('sistema que no existe', cambiaCabecera('[windows, linux]', '[windows, android]'), 'sistema desconocido')
falla('duración de una hora', cambiaCabecera('duracionMinutos: 10', 'duracionMinutos: 60'), 'duracionMinutos debe ser')
falla('resumen de más de 160', cambiaCabecera('resumen: Un resumen corto.', `resumen: ${'x'.repeat(161)}`), 'máximo 160')
falla('versión sin comillas', cambiaCabecera('version: "1.10"', 'version: 1.10'), 'la versión va entre comillas')
falla('descarga por http', cambiaCabecera('https://ejemplo.org/descargar', 'http://ejemplo.org/descargar'), 'descargaOficial debe ser una URL https')
falla('descarga desde un exchange', cambiaCabecera('https://ejemplo.org/descargar', 'https://www.binance.com/es/download'), 'enlace a un exchange')
falla('publicado sin probadoEl', cambiaCabecera('    probadoEl: 2026-10-01\n', ''), 'hace falta probadoEl')
falla('fecha imposible', cambiaCabecera('2026-10-01', '2026-13-45'), 'probadoEl debe ser una fecha')
falla('curso no publicado', cambiaCabecera('curso: curso-a', 'curso: curso-b'), 'no es un curso publicado')
falla('lección de otro curso', cambiaCabecera('leccion: leccion-1', 'leccion: leccion-9'), 'no pertenece a')
falla('término que no existe', cambiaCabecera('terminos: [hash]', 'terminos: [hash, sha]'), '"sha" no está en el glosario')
falla('requisito: tutorial que no existe', cambiaCabecera('tutorial: otro-tutorial', 'tutorial: no-existe'), 'requisitos: el tutorial "no-existe" no existe')
falla('título con «ordenador»', cambiaCabecera('titulo: Comprobar algo', 'titulo: Comprobar algo en el ordenador'), '«ordenador» no es español neutro')
falla('resumen con promesa', cambiaCabecera('resumen: Un resumen corto.', 'resumen: Protege tus ganancias.'), 'Principio #1')

console.log('\n== Cuerpo')
falla('HTML crudo', cambiaCuerpo('Una línea.', '<script>alert(1)</script>'), 'elemento no admitido en el cuerpo: html')
falla('tabla o cita', cambiaCuerpo('Una línea.', '> Una cita'), 'elemento no admitido en el cuerpo: blockquote')
falla('# en el cuerpo', cambiaCuerpo('## Qué vas a conseguir', '# Qué vas a conseguir'), 'el cuerpo no lleva `# …`')
falla('paso sin «Deberías ver»', cambiaCuerpo(':::deberias-ver\nOtra línea.\n:::\n', ''), '"Paso 2: Comprueba otra cosa" no tiene bloque :::deberias-ver')
falla('pasos saltados', cambiaCuerpo('## Paso 2:', '## Paso 3:'), 'se esperaba el paso 2')
falla('paso mal escrito', cambiaCuerpo('## Paso 2: Comprueba', '## Paso dos: Comprueba'), 'un paso se escribe')
falla('sin pasos', tutorial(CABECERA, 'Solo texto.'), 'ningún «## Paso 1: …»')
falla('bloque desconocido', cambiaCuerpo(':::aviso{tipo="si-falla"', ':::alerta{tipo="si-falla"'), 'bloque desconocido ":::alerta"')
falla('aviso sin tipo válido', cambiaCuerpo('tipo="si-falla"', 'tipo="peligro"'), ':::aviso necesita tipo=')
falla('sistema desconocido', cambiaCuerpo('so="windows"', 'so="android"'), ':::sistema necesita so=')
falla('marca de texto desconocida', cambiaCuerpo('Una línea.', 'Mira esto:aqui'), 'marca desconocida ":aqui"')
falla('término que no existe', cambiaCuerpo('slug="hash"', 'slug="sha"'), ':termino con un slug que no está')
falla('código sin lenguaje', cambiaCuerpo('```salida', '```'), 'bloque de código sin lenguaje')
falla('enlace a un exchange', cambiaCuerpo('https://ejemplo.org/descargar?version=2', 'https://pro.coinbase.com/'), 'enlace a un exchange (coinbase)')
falla('enlace de referido', cambiaCuerpo('?version=2', '?ref=abc'), 'parámetro de referido o seguimiento "ref"')
falla('enlace con utm', cambiaCuerpo('?version=2', '?utm_source=x'), 'parámetro de referido o seguimiento "utm_source"')
falla('enlace interno roto', cambiaCuerpo('/cursos/curso-a/leccion-1', '/cursos/curso-a/leccion-9'), 'enlace a una lección que no es de ese curso')
falla('enlace interno que no se comprueba', cambiaCuerpo('/cursos/curso-a/leccion-1', '/precios'), 'enlace interno que no se puede comprobar')
falla('«acá» con tilde', cambiaCuerpo('Una línea.', 'Una línea acá.'), '«acá» no es español neutro')
falla('«móvil»', cambiaCuerpo('Una línea.', 'Desde el móvil.'), '«móvil» no es español neutro')
falla('voseo', cambiaCuerpo('Una línea.', 'Si tenés dudas.'), '«tenés» no es español neutro')
falla('«fichero»', cambiaCuerpo('Una línea.', 'Abre el fichero.'), '«fichero» no es español neutro')
falla('captura sin texto alternativo', cambiaCuerpo('![PowerShell con el hash calculado en una línea]', '![]'), 'falta el texto alternativo')
falla('texto alternativo «Captura…»', cambiaCuerpo('![PowerShell con el hash calculado en una línea]', '![Captura del paso uno de todo]'), 'tiene que describir lo que se ve')
falla('captura con carpeta', cambiaCuerpo('(01-hash-calculado.webp)', '(/img/01-hash-calculado.webp)'), 'el nombre es NN-que-muestra.webp')
falla('captura en PNG', cambiaCuerpo('(01-hash-calculado.webp)', '(01-hash-calculado.png)'), 'el nombre es NN-que-muestra.webp')
falla('publicado sin la captura', tutorial(), 'no existe en public/tutoriales/', {})
falla('captura de más de 300 KB', tutorial(), 'máximo 300', { '01-hash-calculado.webp': { ancho: 1600, alto: 900, bytes: 400_000 } })

console.log(fallos ? `\n*** ${fallos} comprobacion(es) mal` : '\nTodo bien')
process.exit(fallos ? 1 : 0)
