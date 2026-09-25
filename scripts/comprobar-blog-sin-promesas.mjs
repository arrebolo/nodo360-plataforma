// Comprueba que las correcciones de lib/blog-data.ts siguen aplicadas: que no
// han vuelto las promesas de rendimiento, las marcas ni las cifras sin fuente.
//
// POR QUE EXISTE
//   Las correcciones se hicieron en dos rondas y las dos miraron SOLO el cuerpo
//   del articulo (`content`). Al rebasar la rama sobre main se descubrio que
//   quedaban OCHO promesas en campos que nadie habia mirado -`title`,
//   `description` y los `caption` de las imagenes-, incluida una en el propio
//   titulo del articulo de staking: "Como Generar Ingresos Pasivos".
//   De ahi el ultimo bloque, que es el que faltaba.
//
//   Tambien existe porque tres de los primeros "fallos" que dio la comprobacion
//   a mano eran falsos positivos de la propia comprobacion: "Lido" dentro de
//   "fallido", "patron historico" dentro del titulo que lo desmiente, y
//   "rendimientos" dentro de la advertencia de la ficha. Aqui van acotados.
//
// Uso: node scripts/comprobar-blog-sin-promesas.mjs   (sale 1 si algo falla)
import { readFileSync } from 'node:fs'

// OJO: el archivo esta con CRLF en Windows. Node no normaliza los saltos de
// linea al leer -Python si-, y sin normalizarlos el delimitador de articulo
// que usa art() no casa nunca: el corte se va al final del archivo y las
// comprobaciones acaban mirando articulos ajenos, dando fallos que no son.
// Paso obligatorio, no cosmetico.
const s = readFileSync('lib/blog-data.ts', 'utf8').split('\r').join('')

const art = (slug) => {
  const i = s.indexOf(`slug: '${slug}'`)
  if (i < 0) { console.error('no encuentro el articulo', slug); process.exit(1) }
  const j = s.indexOf('\n  {\n    slug:', i + 40)
  return j > 0 ? s.slice(i, j) : s.slice(i)
}
const STK = art('staking-criptomonedas-guia')
const HAL = art('halving-bitcoin-que-es-cuando')
const ETH = art('que-es-ethereum-guia-completa')
const DAO = art('dao-organizaciones-descentralizadas')

// el array de keywords es SEO, no texto que lea nadie: se excluye del cuerpo
const sinKeywords = (a) => a.replace(/keywords:\s*\[[^\]]*\]/gs, '')
const sinContent = (a) => sinKeywords(a).replace(/content:\s*`[\s\S]*?`/g, '')

const fallos = []
const cuenta = (ambito, re) => (ambito.match(re) || []).length
const no = (ambito, re, etq, nombre) => {
  const n = cuenta(ambito, re)
  console.log(`  ${n === 0 ? 'OK   ' : 'FALLO'} [${etq}] fuera ${nombre}${n ? `  -> ${n}` : ''}`)
  if (n) fallos.push(nombre)
}
const si = (ambito, txt, etq, nombre) => {
  const hay = ambito.includes(txt)
  console.log(`  ${hay ? 'OK   ' : 'FALLO'} [${etq}] esta ${nombre}`)
  if (!hay) fallos.push('falta: ' + nombre)
}

console.log('=== RONDA 1: las siete sustituciones ===')
no(sinKeywords(STK), /ingresos? pasivos?/gi, '1', 'la expresion "ingresos pasivos"')
si(STK, 'la comparación engaña en lo esencial', '2', 'la analogia del plazo fijo, invertida para desmontarla')
no(STK, /\|\s*(Cardano|Solana|Cosmos|Polkadot|Tezos)\s*\|/g, '3', 'la tabla de rendimientos por red')
si(STK, 'de dónde sale la recompensa', '3', 'la seccion que la sustituye')
no(STK, /\/cursos\/(staking|defi|web3-avanzado|ethereum)/g, '4', 'la llamada a cursos inexistentes')
no(ETH, /4\s*-\s*5\s*%|entre\s+4\s+y\s+5\s*%/g, '5', 'el "4-5% anual"')
no(ETH, /99[.,]9\d\s*%/g, '6', 'el "99,95%"')
no(DAO, /5\s*-\s*15\s*%|entre\s+5\s+y\s+15\s*%/g, '7', 'el "5-15%"')

console.log('\n=== RONDA 2: marcas y cifras del staking ===')
for (const m of ['Binance', 'Kraken', 'Coinbase', 'Lido', 'Rocket Pool', 'Cardano', 'Solana', 'Cosmos', 'stETH', 'Yoroi', 'Daedalus', 'Ledger', 'Trezor', 'Polkadot']) {
  // El limite NO puede ser \b. En JavaScript \w es solo [A-Za-z0-9_], asi que una
  // letra acentuada cuenta como no-palabra y \bLido\b casa dentro de "solido" o
  // "invalido". Con \p{L} y la bandera u el limite es el de una palabra de verdad.
  // (En "fallido" \b ya funcionaba, porque la l va pegada a otra l. De ahi que el
  // fallo pasara desapercibido.)
  const ini = '(?<![\\p{L}\\p{N}])', fin = '(?![\\p{L}\\p{N}])'
  no(STK, new RegExp(ini + m.replace(' ', '\\s') + fin, 'giu'), 'marcas', 'la marca ' + m)
}
console.log(`  OK    [marcas] FTX se conserva a proposito, como ejemplo de quiebra  -> ${cuenta(STK, /\bFTX\b/g)}`)
no(STK, /Lo Mejor de Ambos Mundos/g, 'staking', 'el titulo "Lo Mejor de Ambos Mundos"')
si(STK, 'qué añade y qué añade de riesgo', 'staking', 'el titulo que lo sustituye')
no(STK, /~\s*\d+([.,]\d+)?\s*%/g, 'staking', 'ninguna cifra aproximada de rendimiento')
si(STK, 'Qué preguntar antes de usar', 'staking', 'las seis preguntas ante cualquier servicio')
si(STK, 'El orden en que conviene decidir', 'staking', 'la lista ordenada de decision')
{
  // el unico porcentaje que puede quedar es la advertencia sobre el tipo de cambio
  const sueltos = (STK.match(/[^\n]*\d+\s*%[^\n]*/g) || []).filter((t) => !t.includes('sigue siendo') && !t.includes('pierde'))
  console.log(`  ${sueltos.length ? 'FALLO' : 'OK   '} [staking] el unico porcentaje es la advertencia`)
  for (const t of sueltos) console.log('        ' + t.trim().slice(0, 96))
  if (sueltos.length) fallos.push('porcentaje suelto en staking')
}

console.log('\n=== RONDA 2: los retornos del halving ===')
no(HAL, /\+\s*9[.,]?000\s*%|\+\s*285\s*%|\+\s*530\s*%/g, 'halving', 'los tres retornos por ciclo')
// sin la /i: el titulo nuevo dice «patron historico» en minuscula, a proposito
no(HAL, /Patrón histórico/g, 'halving', 'el titulo viejo "Patron historico"')
si(HAL, 'Por qué no hay «patrón histórico»', 'halving', 'el titulo que lo sustituye')
si(HAL, 'ha habido cuatro halvings', 'halving', 'el argumento de que cuatro no son una serie')
no(HAL, /mercado alcista|all[- ]time high|\brally\b|70\s*-\s*80\s*%/gi, 'halving', 'el vocabulario de ciclo de precio')
no(HAL, /\$\s?\d{2,3}[.,]\d{3}|\$\s?\d{4,}/g, 'halving', 'los puntos de precio en dolares')
no(HAL, /precio compensa/gi, 'halving', 'la afirmacion de que el precio compensa')
{
  // lo unico con "% anual" debe ser la emision, que es un dato del protocolo
  const pct = (HAL.match(/[^\n]*%\s*anual[^\n]*/g) || []).map((t) => t.trim())
  const soloEmision = pct.every((t) => t.includes('halving 2024') || t.includes('Oro'))
  console.log(`  ${soloEmision ? 'OK   ' : 'FALLO'} [halving] lo unico con "% anual" es la emision  -> ${pct.length} lineas`)
  for (const t of pct) console.log('        ' + t.slice(0, 96))
  if (!soloEmision) fallos.push('rendimiento en el halving')
}

console.log('\n=== CAMPOS QUE NO SON content: title, description y caption ===')
const PROMESA = /ingresos? pasivos?|rendimientos? esperados?|mejores plataformas|\d+\s*[-a]\s*\d+\s*%|el precio ha subido|precio compensa|correlacionan|Afecta al Precio|impacto en el precio/i
for (const [etq, a] of [['staking', STK], ['halving', HAL], ['ethereum', ETH], ['dao', DAO]]) {
  const malos = [...sinContent(a).matchAll(/(title|description|caption): '([^']*)'/g)]
    .filter((m) => PROMESA.test(m[2]))
    .map((m) => `${m[1]}: ${m[2].slice(0, 72)}`)
  console.log(`  ${malos.length ? 'FALLO' : 'OK   '} [${etq}] title, description y caption sin promesas`)
  for (const x of malos) console.log('        ' + x)
  if (malos.length) fallos.push('promesa en un campo de ' + etq)
}

console.log('\n=== fuera del alcance de esta rama, para que conste ===')
const otros = []
for (const m of s.matchAll(/\d+([.,]\d+)?\s*%\s*(anual|al año|APY|APR)/gi)) {
  const ini = s.lastIndexOf("slug: '", m.index)
  const slug = s.slice(ini + 7, s.indexOf("'", ini + 7))
  if (slug !== 'staking-criptomonedas-guia' && slug !== 'halving-bitcoin-que-es-cuando') {
    otros.push(`[${slug}] ${s.slice(Math.max(0, m.index - 46), m.index + m[0].length).split('\n').pop().trim()}`)
  }
}
for (const o of otros) console.log('  AVISO ' + o)
if (!otros.length) console.log('  (ninguno)')
console.log('  NOTA  siguen pendientes de tu decision, y no se han tocado: los arrays')
console.log('        de keywords ("ingresos pasivos crypto", "ciclos bitcoin"), la')
console.log('        seccion "Los Ciclos de Bitcoin" y el apartado de Stock-to-Flow.')

console.log()
if (fallos.length) {
  console.log(`${fallos.length} FALLOS:`)
  for (const f of fallos) console.log('   - ' + f)
  process.exit(1)
}
console.log('TODO CORRECTO: las correcciones siguen aplicadas y no ha vuelto ninguna')
