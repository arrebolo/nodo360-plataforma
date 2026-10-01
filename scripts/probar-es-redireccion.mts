/**
 * esRedireccion(): ¿reconoce lo que Next lanza de verdad?
 *
 *   npx tsx scripts/probar-es-redireccion.mts
 *
 * Los `digest` son los que Next pone en las excepciones de `redirect()` y
 * `notFound()`. Importa que la comprobación no sea una igualdad exacta: el digest de
 * un redirect lleva el destino y el código detrás, separados por punto y coma.
 */
// Import dinamico: con el estatico, Node resuelve el .ts por su cuenta y no
// encuentra el export. Con await sí.
const { esRedireccion } = await import('../lib/navegacion/es-redireccion.ts')

let fallos = 0
const di = (ok: boolean, t: string) => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}`)
}

// Lo que Next lanza
di(esRedireccion(Object.assign(new Error('NEXT_REDIRECT'), {
  digest: 'NEXT_REDIRECT;replace;/dashboard/instructor/cursos/abc;307;',
})), 'redirect() con destino y codigo en el digest')

di(esRedireccion(Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT' })),
  'redirect() con el digest a secas')

di(esRedireccion(Object.assign(new Error('NEXT_HTTP_ERROR_FALLBACK;404'), { digest: 'NEXT_NOT_FOUND' })),
  'notFound()')

// Cuando el digest se pierde al cruzar la frontera cliente/servidor, queda el mensaje
di(esRedireccion(new Error('NEXT_REDIRECT')), 'solo el mensaje, sin digest')

// Y lo que NO es una navegacion
di(!esRedireccion(new Error('duplicate key value violates unique constraint')), 'un error de la base no lo es')
di(!esRedireccion(new Error('Failed to fetch')), 'un fallo de red no lo es')
di(!esRedireccion(null), 'null no lo es')
di(!esRedireccion(undefined), 'undefined no lo es')
di(!esRedireccion('NEXT_REDIRECT'), 'una cadena suelta no lo es (no es un error)')
di(!esRedireccion({ digest: 12345 }), 'un digest que no es texto no lo es')

console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} fallan\n`)
process.exit(fallos === 0 ? 0 : 1)
