// Las PR que NO tuvieron main como base, y si su contenido llego a main.
//
// Por que por contenido y no por ancestros: este repo mergea con squash, que crea un
// commit nuevo sin relacion de ancestro con la rama. `git branch --contains` miente
// aqui. Lo unico fiable es comparar el CONTENIDO de los ficheros.
import { execFileSync } from 'node:child_process'

const REPO = 'arrebolo/nodo360-plataforma'
const DIR = 'C:/Users/alber/nodo360-projects/nodo360-plataforma'

const s = execFileSync('git', ['credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', cwd: DIR,
})
const cred = Object.fromEntries(s.split('\n').filter((l) => l.includes('=')).map((l) => {
  const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
}))

async function api(ruta) {
  const r = await fetch(`https://api.github.com${ruta}`, {
    headers: {
      Authorization: `Bearer ${cred.password}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json()
}

const git = (...args) => execFileSync('git', args, { cwd: DIR, encoding: 'utf8' }).trim()

const todas = []
for (let pagina = 1; pagina <= 5; pagina++) {
  const lote = await api(`/repos/${REPO}/pulls?state=all&per_page=100&page=${pagina}`)
  todas.push(...lote)
  if (lote.length < 100) break
}

const encadenadas = todas.filter((p) => p.base.ref !== 'main')
console.log(`\n${todas.length} PR en total. ${encadenadas.length} con una base que NO es main:\n`)

git('fetch', 'origin', '--quiet')

for (const p of encadenadas.sort((a, b) => a.number - b.number)) {
  const estado = p.merged_at ? 'MERGEADA' : p.state === 'closed' ? 'CERRADA' : 'abierta'
  console.log(`#${p.number}  base=${p.base.ref}  ${estado}`)
  console.log(`      ${p.title}`)

  // Los ficheros que tocaba
  let ficheros = []
  try {
    const f = await api(`/repos/${REPO}/pulls/${p.number}/files?per_page=100`)
    ficheros = f.map((x) => ({ nombre: x.filename, estado: x.status }))
  } catch (e) {
    console.log(`      (no se pudieron leer los ficheros: ${e.message.slice(0, 60)})`)
    continue
  }

  // ¿Esta su contenido en main? Se compara el fichero de la cabeza de la PR con el
  // de main. Si son iguales, llego; si no, falta algo.
  const sha = p.merge_commit_sha || p.head.sha
  let faltan = []
  let iguales = 0
  for (const { nombre, estado: ef } of ficheros) {
    if (ef === 'removed') continue
    let enLaPr = null
    let enMain = null
    try { enLaPr = git('show', `${sha}:${nombre}`) } catch { enLaPr = null }
    try { enMain = git('show', `origin/main:${nombre}`) } catch { enMain = null }
    if (enLaPr === null) continue
    if (enMain === enLaPr) iguales++
    else faltan.push(nombre)
  }

  console.log(`      ${ficheros.length} ficheros: ${iguales} identicos en main, ${faltan.length} distintos`)
  if (faltan.length) {
    for (const f of faltan.slice(0, 12)) console.log(`         != ${f}`)
    if (faltan.length > 12) console.log(`         ... y ${faltan.length - 12} mas`)
  }
  console.log('')
}
