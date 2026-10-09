/**
 * Valida todos los tutoriales de content/tutoriales/. Corre en el prebuild.
 *
 *     npx tsx scripts/validar-tutoriales.mts
 *     npx tsx scripts/validar-tutoriales.mts --como-publicado   antes de publicar uno
 *
 * Las reglas están en lib/tutoriales/analizar.ts y la guía en docs/TUTORIALES.md.
 * Con --como-publicado, los borradores se miran con las exigencias de un
 * tutorial publicado (capturas, fechas de prueba): es lo que hay que pasar
 * antes de cambiar `estado: borrador`.
 *
 * SALE CON CÓDIGO 1 si algo falla, para que el build se pare.
 */
// lib es CommonJS para tsx (el paquete no es type: module): se importa el
// módulo entero, igual que en scripts/comprobar-errores-de-auth.mts
import * as modulo from '../lib/tutoriales/cargar.ts'
const { cargarTutoriales } = ((modulo as any).default ?? modulo) as typeof modulo

const comoPublicado = process.argv.includes('--como-publicado')
const { tutoriales, errores } = cargarTutoriales({ comoPublicado })

for (const t of tutoriales) {
  console.log(`  ${t.estado.padEnd(9)} ${t.slug}`)
}
if (errores.length) {
  console.error(`\n*** ${errores.length} error(es) en los tutoriales:`)
  for (const e of errores) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`\nTutoriales: ${tutoriales.length}, sin errores${comoPublicado ? ' (mirados como publicados)' : ''}.`)
