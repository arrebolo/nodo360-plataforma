/**
 * EL GUARDIAN: ninguna superficie pública lee las tablas de trabajo.
 *
 *   npx tsx scripts/comprobar-lecturas-publicas.mts            # corta si hay hallazgos
 *   npx tsx scripts/comprobar-lecturas-publicas.mts --informe  # solo los enumera
 *
 * POR QUE EXISTE
 *   Lo que leen los alumnos tiene que salir de la copia publicada (`*_publicados`), no
 *   de las tablas donde el instructor escribe. Si no, cualquier cambio suyo —guardado a
 *   medias, una lección borrada, un título a medio escribir— sale al aire en el
 *   siguiente render. Eso es lo que la copia publicada viene a arreglar, y este script
 *   es lo que impide que vuelva a colarse después.
 *
 * CORTA, NO INFORMA: `process.exit(1)` en cuanto hay un hallazgo sin declarar. Un
 * guardián que solo avisa no ha servido ninguna de las veces que ha hecho falta.
 *
 * DOS MITADES, porque una sola no basta:
 *
 *   1. PROHIBIR EL NOMBRE, EN LAS TRES SINTAXIS. `from('lessons')` es la fácil. Las
 *      que importan son los embeds:
 *
 *        a) por el nombre de la tabla:   `modules(lessons(...))`
 *        b) por el nombre de la CLAVE:   `course:course_id!inner (*)`
 *
 *      La (b) la encontró este guardián en `lib/db/learning-paths.ts` mientras lo
 *      escribía, y es la peor de las tres: ahí la palabra `courses` NO APARECE —se
 *      embebe por `course_id`, que es la columna—, así que ningún grep del nombre de la
 *      tabla la ve. El inventario del diseño daba ese fichero por «lee por el helper»,
 *      y lo que hace es llegar a `courses` sin nombrarla. Mismo punto ciego que la
 *      lista de nueve columnas de la 030.
 *
 *   2. DESCUBRIR LA LISTA, NO RECORDARLA. Las superficies se enumeran del árbol de
 *      ficheros; si aparece un fichero público nuevo que lee contenido de cursos y no
 *      está en el inventario revisado, también corta. Una lista escrita a mano envejece
 *      en silencio; un censo del catálogo, no.
 *
 * LAS RUTAS DE API DEL ALUMNO SON LA PARTE MAS SERIA, y faltaban en la primera versión.
 * `app/api/quiz/submit` corrige el examen, `app/api/quiz/questions` sirve las preguntas,
 * `app/api/progress` cuenta el denominador del progreso, `app/api/continue` decide por
 * dónde se sigue… y varias usan el CLIENTE DE SERVICIO, que salta la RLS. Para ellas,
 * cerrarle las tablas de trabajo a `anon` —lo que hace la PR 3— NO SIRVE DE NADA: el
 * service role entra igual. Este guardián es la única barrera que tienen.
 *
 * LAS EXCEPCIONES SON POR LECTURA, NO POR FICHERO. Se declara cuántas lecturas de cada
 * tabla y de cada sintaxis hay en cada fichero, así que **una lectura nueva en un
 * fichero que ya tiene excepción también corta**. Declarar la pareja fichero-tabla
 * dejaba la puerta abierta a añadir diez lecturas más donde ya había una.
 *
 * Y SON TEMPORALES Y NUMERADAS: hoy todas las lecturas públicas van a las tablas de
 * trabajo, y cambiarlas es la PR 3. El guardián corta también si una excepción deja de
 * hacer falta —así la PR 3 no puede olvidarse de quitarlas—.
 *
 * Lo que la cuenta no distingue: quitar una lectura y añadir otra de la misma tabla y
 * sintaxis en el mismo fichero. Para eso haría falta fijar la línea exacta, que se
 * desplaza con cualquier edición y acabaría en un guardián que da la lata sin motivo.
 */
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..'
)
const SOLO_INFORME = process.argv.includes('--informe')
const GENERAR = process.argv.includes('--generar')

/**
 * El motivo de cada excepción, por fichero. Lo único que se escribe a mano: la lista de
 * lecturas se genera midiendo (`--generar`), porque son 132 en 81 grupos y copiarlas a
 * mano garantiza equivocarse.
 */
const MOTIVOS: [string, string][] = [
  ['app/api/quiz/submit', 'CORRIGE EL EXAMEN del alumno. Usa el cliente de servicio: cerrar las tablas a anon no lo protege, este guardian es su unica barrera. PR 3'],
  ['app/api/quiz/questions', 'SIRVE LAS PREGUNTAS al alumno, con el cliente de servicio. PR 3'],
  ['app/api/progress', 'el denominador del progreso: tiene que ser lo publicado. PR 3'],
  ['app/api/continue', 'decide por donde sigue el alumno. PR 3'],
  ['app/api/enroll', 'matricula: comprueba que el curso esta publicado. PR 3'],
  ['app/api/bookmarks', 'guardados del alumno: embebe la leccion y su curso. PR 3'],
  ['app/api/lesson-notes', 'notas del alumno: embebe la leccion y su curso. PR 3'],
  ['app/api/comments', 'comentarios: embebe leccion, modulo y curso para saber de quien es. PR 3'],
  ['app/api/internal/discord-notify', 'anuncio interno: lee el curso para contarlo. PR 3'],
  ['app/api/health', 'comprobacion de salud: solo cuenta filas. PR 3 o se deja dicho que no sirve contenido'],
  ['app/cursos/[slug]/quiz-final', 'examen final (punto 4 del diseno). PR 3'],
  ['app/cursos/[slug]/[lessonSlug]/opengraph-image', 'imagen OG de la leccion. PR 3'],
  ['app/cursos/[slug]/[lessonSlug]', 'leccion. PR 3'],
  ['app/cursos/[slug]/opengraph-image', 'imagen OG del curso. PR 3'],
  ['app/cursos/[slug]', 'ficha del curso. PR 3'],
  ['app/certificados', 'titulo del curso y del modulo del certificado: hoy no puede leer el espejo, que esta cerrado. PR 3'],
  ['app/rutas', 'rutas de aprendizaje. PR 3'],
  ['app/sitemap.ts', 'sitemap. PR 3'],
  ['app/llms.txt', 'llms.txt. PR 3'],
  ['app/r/', 'enlaces de referido. PR 3'],
  ['app/(public)/instructores', 'ficha publica del instructor. PR 3'],
  ['components/home', 'portada. PR 3'],
  ['lib/db/courses-queries.ts', 'ayudantes del catalogo y de la ficha. PR 3'],
  ['lib/db/queries.ts', 'ayudantes antiguos. PR 3'],
  ['lib/db/learning-paths.ts', 'embed por la clave ajena (course:course_id!inner). PR 3'],
  ['lib/cache/queries.ts', 'cache del catalogo. PR 3'],
  ['lib/progress/getCourseProgress.ts', 'el denominador del progreso es lo publicado (punto 2). PR 3'],
  ['lib/progress/getPathProgress.ts', 'progreso de una ruta. PR 3'],
  ['lib/quiz/checkCourseQuiz.ts', 'correccion y estado del examen (punto 4). PR 3'],
  ['lib/certificates/createCertificate.ts', 'titulo del certificado. PR 3'],
  ['lib/comments/index.ts', 'comentarios de una leccion, con el cliente de servicio. PR 3'],
  ['lib/projects/eligibility.ts', 'decide si un alumno puede entregar proyecto, con el cliente de servicio. PR 3'],
  ['lib/progress/recalcularMatriculas.ts', 'el denominador del progreso de todos, con el cliente de servicio. PR 3'],
  ['scripts/generar-cursos-publicados.mjs', 'genera lib/enlazado/cursos-publicados.ts, que usan el blog y el glosario. PR 3'],
]

const motivoDe = (fichero: string) =>
  MOTIVOS.find(([prefijo]) => fichero.startsWith(prefijo))?.[1] ?? 'pendiente de revisar'

/** Las tablas donde escribe el instructor. Lo público no las toca. */
const TABLAS_DE_TRABAJO = ['courses', 'modules', 'lessons', 'quiz_questions'] as const

/**
 * Superficies públicas, DESCUBIERTAS del árbol: todo lo que cuelgue de aquí se mira.
 * Añadir una página pública nueva no requiere tocar esta lista.
 */
const ZONAS_PUBLICAS = [
  'app/cursos',
  'app/rutas',
  'app/(public)',
  'app/sitemap.ts',
  'app/llms.txt',
  'app/r',
  'app/verificar',
  'app/certificados',
  'components/home',
  'components/course',
  'components/cursos',
  // Las rutas de API que sirven o corrigen contenido para alumnos. Se descubre
  // `app/api` entero y se descartan las de personal (ver ZONAS_DE_PERSONAL): así una
  // ruta nueva del alumno entra en el guardián sin que nadie se acuerde de añadirla.
  'app/api',
  // El generador de la constante de cursos publicados: escribe
  // lib/enlazado/cursos-publicados.ts, que usan el blog y el glosario.
  'scripts/generar-cursos-publicados.mjs',
]

/**
 * Lo que NO es superficie de alumno: el panel, el instructor y el mentor leen las
 * tablas de trabajo porque es su función. Se descartan por ruta, no por lista de
 * ficheros, para que una ruta nueva de personal tampoco haya que declararla.
 */
const ZONAS_DE_PERSONAL = ['app/api/admin/', 'app/api/instructor/', 'app/api/mentor/']

/**
 * Y los ayudantes que usan esas páginas.
 *
 * Esta lista SI es declarada, y no descubierta, porque `lib/` no está separado por
 * público y administración: el mismo fichero sirve a las dos cosas. Es la parte frágil
 * del guardián y conviene saberlo; la PR 3 separa lo que haga falta separar.
 */
const AYUDANTES_DE_ALUMNO = [
  'lib/db/courses-queries.ts',
  'lib/db/queries.ts',
  'lib/db/learning-paths.ts',
  'lib/cache/queries.ts',
  'lib/progress/getCourseProgress.ts',
  'lib/progress/getPathProgress.ts',
  'lib/quiz/checkCourseQuiz.ts',
  'lib/certificates/createCertificate.ts',
  // Estos tres los encontro el barrido de createAdminClient, no la lista de arriba: los
  // tres leen contenido de cursos CON EL CLIENTE DE SERVICIO para algo que ve un
  // alumno, y por tanto la RLS no los frena.
  'lib/comments/index.ts',
  'lib/projects/eligibility.ts',
  'lib/progress/recalcularMatriculas.ts',
]

type Excepcion = {
  numero: number
  fichero: string
  tabla: string
  /** `from`, `embed` (por nombre de tabla) o `clave` (por nombre de la clave ajena). */
  como: 'from' | 'embed' | 'clave'
  /** Cuántas lecturas de esa tabla y esa sintaxis hay revisadas en ese fichero. */
  cuantas: number
  porque: string
}

/**
 * LO QUE TODAVIA LEE DE TRABAJO, a 2 de octubre de 2026. Cada línea se va con la PR 3.
 *
 * ESTA LISTA SALE DE EJECUTAR EL GUARDIAN, no del documento de diseño. La escribí
 * primero a partir del inventario del diseño y no cuadraba: sobraban cuatro entradas
 * —ficheros que leen por su ayudante y no directamente— y faltaban tres lecturas que el
 * inventario no recogía. Un inventario escrito a mano envejece; el que vale es el que
 * se mide.
 */
const EXCEPCIONES: Excepcion[] = [
  { numero: 1, fichero: 'app/(public)/instructores/[id]/page.tsx', tabla: 'courses', como: 'from', cuantas: 1, porque: 'ficha publica del instructor. PR 3' },
  { numero: 2, fichero: 'app/api/bookmarks/route.ts', tabla: 'courses', como: 'clave', cuantas: 1, porque: 'guardados del alumno: embebe la leccion y su curso. PR 3' },
  { numero: 3, fichero: 'app/api/bookmarks/route.ts', tabla: 'lessons', como: 'clave', cuantas: 1, porque: 'guardados del alumno: embebe la leccion y su curso. PR 3' },
  { numero: 4, fichero: 'app/api/bookmarks/route.ts', tabla: 'modules', como: 'clave', cuantas: 1, porque: 'guardados del alumno: embebe la leccion y su curso. PR 3' },
  { numero: 5, fichero: 'app/api/comments/[commentId]/route.ts', tabla: 'courses', como: 'embed', cuantas: 1, porque: 'comentarios: embebe leccion, modulo y curso para saber de quien es. PR 3' },
  { numero: 6, fichero: 'app/api/comments/[commentId]/route.ts', tabla: 'lessons', como: 'embed', cuantas: 1, porque: 'comentarios: embebe leccion, modulo y curso para saber de quien es. PR 3' },
  { numero: 7, fichero: 'app/api/comments/[commentId]/route.ts', tabla: 'modules', como: 'embed', cuantas: 1, porque: 'comentarios: embebe leccion, modulo y curso para saber de quien es. PR 3' },
  { numero: 8, fichero: 'app/api/continue/route.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'decide por donde sigue el alumno. PR 3' },
  { numero: 9, fichero: 'app/api/continue/route.ts', tabla: 'lessons', como: 'from', cuantas: 1, porque: 'decide por donde sigue el alumno. PR 3' },
  { numero: 10, fichero: 'app/api/continue/route.ts', tabla: 'modules', como: 'from', cuantas: 1, porque: 'decide por donde sigue el alumno. PR 3' },
  { numero: 11, fichero: 'app/api/enroll/route.ts', tabla: 'courses', como: 'from', cuantas: 2, porque: 'matricula: comprueba que el curso esta publicado. PR 3' },
  { numero: 12, fichero: 'app/api/health/route.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'comprobacion de salud: solo cuenta filas. PR 3 o se deja dicho que no sirve contenido' },
  { numero: 13, fichero: 'app/api/internal/discord-notify/route.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'anuncio interno: lee el curso para contarlo. PR 3' },
  { numero: 14, fichero: 'app/api/lesson-notes/route.ts', tabla: 'courses', como: 'clave', cuantas: 1, porque: 'notas del alumno: embebe la leccion y su curso. PR 3' },
  { numero: 15, fichero: 'app/api/lesson-notes/route.ts', tabla: 'lessons', como: 'clave', cuantas: 1, porque: 'notas del alumno: embebe la leccion y su curso. PR 3' },
  { numero: 16, fichero: 'app/api/lesson-notes/route.ts', tabla: 'modules', como: 'clave', cuantas: 1, porque: 'notas del alumno: embebe la leccion y su curso. PR 3' },
  { numero: 17, fichero: 'app/api/progress/route.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'el denominador del progreso: tiene que ser lo publicado. PR 3' },
  { numero: 18, fichero: 'app/api/progress/route.ts', tabla: 'lessons', como: 'from', cuantas: 3, porque: 'el denominador del progreso: tiene que ser lo publicado. PR 3' },
  { numero: 19, fichero: 'app/api/quiz/questions/route.ts', tabla: 'modules', como: 'from', cuantas: 1, porque: 'SIRVE LAS PREGUNTAS al alumno, con el cliente de servicio. PR 3' },
  { numero: 20, fichero: 'app/api/quiz/questions/route.ts', tabla: 'quiz_questions', como: 'from', cuantas: 1, porque: 'SIRVE LAS PREGUNTAS al alumno, con el cliente de servicio. PR 3' },
  { numero: 21, fichero: 'app/api/quiz/submit/route.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'CORRIGE EL EXAMEN del alumno. Usa el cliente de servicio: cerrar las tablas a anon no lo protege, este guardian es su unica barrera. PR 3' },
  { numero: 22, fichero: 'app/api/quiz/submit/route.ts', tabla: 'lessons', como: 'from', cuantas: 1, porque: 'CORRIGE EL EXAMEN del alumno. Usa el cliente de servicio: cerrar las tablas a anon no lo protege, este guardian es su unica barrera. PR 3' },
  { numero: 23, fichero: 'app/api/quiz/submit/route.ts', tabla: 'modules', como: 'from', cuantas: 1, porque: 'CORRIGE EL EXAMEN del alumno. Usa el cliente de servicio: cerrar las tablas a anon no lo protege, este guardian es su unica barrera. PR 3' },
  { numero: 24, fichero: 'app/api/quiz/submit/route.ts', tabla: 'quiz_questions', como: 'from', cuantas: 2, porque: 'CORRIGE EL EXAMEN del alumno. Usa el cliente de servicio: cerrar las tablas a anon no lo protege, este guardian es su unica barrera. PR 3' },
  { numero: 25, fichero: 'app/certificados/[certificateId]/page.tsx', tabla: 'courses', como: 'from', cuantas: 1, porque: 'titulo del curso y del modulo del certificado: hoy no puede leer el espejo, que esta cerrado. PR 3' },
  { numero: 26, fichero: 'app/certificados/[certificateId]/page.tsx', tabla: 'modules', como: 'from', cuantas: 1, porque: 'titulo del curso y del modulo del certificado: hoy no puede leer el espejo, que esta cerrado. PR 3' },
  { numero: 27, fichero: 'app/cursos/[slug]/[lessonSlug]/opengraph-image.tsx', tabla: 'courses', como: 'embed', cuantas: 1, porque: 'imagen OG de la leccion. PR 3' },
  { numero: 28, fichero: 'app/cursos/[slug]/[lessonSlug]/opengraph-image.tsx', tabla: 'lessons', como: 'from', cuantas: 1, porque: 'imagen OG de la leccion. PR 3' },
  { numero: 29, fichero: 'app/cursos/[slug]/[lessonSlug]/page.tsx', tabla: 'courses', como: 'embed', cuantas: 1, porque: 'leccion. PR 3' },
  { numero: 30, fichero: 'app/cursos/[slug]/[lessonSlug]/page.tsx', tabla: 'courses', como: 'from', cuantas: 1, porque: 'leccion. PR 3' },
  { numero: 31, fichero: 'app/cursos/[slug]/[lessonSlug]/page.tsx', tabla: 'lessons', como: 'embed', cuantas: 1, porque: 'leccion. PR 3' },
  { numero: 32, fichero: 'app/cursos/[slug]/[lessonSlug]/page.tsx', tabla: 'lessons', como: 'from', cuantas: 2, porque: 'leccion. PR 3' },
  { numero: 33, fichero: 'app/cursos/[slug]/[lessonSlug]/page.tsx', tabla: 'modules', como: 'embed', cuantas: 1, porque: 'leccion. PR 3' },
  { numero: 34, fichero: 'app/cursos/[slug]/opengraph-image.tsx', tabla: 'courses', como: 'from', cuantas: 1, porque: 'imagen OG del curso. PR 3' },
  { numero: 35, fichero: 'app/cursos/[slug]/page.tsx', tabla: 'courses', como: 'from', cuantas: 2, porque: 'ficha del curso. PR 3' },
  { numero: 36, fichero: 'app/cursos/[slug]/page.tsx', tabla: 'lessons', como: 'embed', cuantas: 1, porque: 'ficha del curso. PR 3' },
  { numero: 37, fichero: 'app/cursos/[slug]/page.tsx', tabla: 'lessons', como: 'from', cuantas: 1, porque: 'ficha del curso. PR 3' },
  { numero: 38, fichero: 'app/cursos/[slug]/page.tsx', tabla: 'modules', como: 'embed', cuantas: 1, porque: 'ficha del curso. PR 3' },
  { numero: 39, fichero: 'app/cursos/[slug]/page.tsx', tabla: 'modules', como: 'from', cuantas: 1, porque: 'ficha del curso. PR 3' },
  { numero: 40, fichero: 'app/cursos/[slug]/quiz-final/page.tsx', tabla: 'courses', como: 'from', cuantas: 1, porque: 'examen final (punto 4 del diseno). PR 3' },
  { numero: 41, fichero: 'app/cursos/[slug]/quiz-final/page.tsx', tabla: 'modules', como: 'from', cuantas: 1, porque: 'examen final (punto 4 del diseno). PR 3' },
  { numero: 42, fichero: 'app/cursos/[slug]/quiz-final/page.tsx', tabla: 'quiz_questions', como: 'from', cuantas: 1, porque: 'examen final (punto 4 del diseno). PR 3' },
  { numero: 43, fichero: 'app/llms.txt/route.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'llms.txt. PR 3' },
  { numero: 44, fichero: 'app/r/[code]/route.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'enlaces de referido. PR 3' },
  { numero: 45, fichero: 'app/rutas/page.tsx', tabla: 'courses', como: 'embed', cuantas: 1, porque: 'rutas de aprendizaje. PR 3' },
  { numero: 46, fichero: 'app/rutas/page.tsx', tabla: 'lessons', como: 'embed', cuantas: 1, porque: 'rutas de aprendizaje. PR 3' },
  { numero: 47, fichero: 'app/rutas/page.tsx', tabla: 'modules', como: 'embed', cuantas: 1, porque: 'rutas de aprendizaje. PR 3' },
  { numero: 48, fichero: 'app/sitemap.ts', tabla: 'courses', como: 'embed', cuantas: 1, porque: 'sitemap. PR 3' },
  { numero: 49, fichero: 'app/sitemap.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'sitemap. PR 3' },
  { numero: 50, fichero: 'app/sitemap.ts', tabla: 'lessons', como: 'from', cuantas: 1, porque: 'sitemap. PR 3' },
  { numero: 51, fichero: 'app/sitemap.ts', tabla: 'modules', como: 'embed', cuantas: 1, porque: 'sitemap. PR 3' },
  { numero: 52, fichero: 'components/home/HomeFeaturedCourses.tsx', tabla: 'courses', como: 'from', cuantas: 1, porque: 'portada. PR 3' },
  { numero: 53, fichero: 'lib/cache/queries.ts', tabla: 'courses', como: 'clave', cuantas: 1, porque: 'cache del catalogo. PR 3' },
  { numero: 54, fichero: 'lib/cache/queries.ts', tabla: 'courses', como: 'from', cuantas: 2, porque: 'cache del catalogo. PR 3' },
  { numero: 55, fichero: 'lib/cache/queries.ts', tabla: 'lessons', como: 'embed', cuantas: 1, porque: 'cache del catalogo. PR 3' },
  { numero: 56, fichero: 'lib/cache/queries.ts', tabla: 'modules', como: 'embed', cuantas: 1, porque: 'cache del catalogo. PR 3' },
  { numero: 57, fichero: 'lib/certificates/createCertificate.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'titulo del certificado. PR 3' },
  { numero: 58, fichero: 'lib/comments/index.ts', tabla: 'courses', como: 'embed', cuantas: 1, porque: 'comentarios de una leccion, con el cliente de servicio. PR 3' },
  { numero: 59, fichero: 'lib/comments/index.ts', tabla: 'lessons', como: 'from', cuantas: 1, porque: 'comentarios de una leccion, con el cliente de servicio. PR 3' },
  { numero: 60, fichero: 'lib/comments/index.ts', tabla: 'modules', como: 'embed', cuantas: 1, porque: 'comentarios de una leccion, con el cliente de servicio. PR 3' },
  { numero: 61, fichero: 'lib/db/courses-queries.ts', tabla: 'courses', como: 'from', cuantas: 4, porque: 'ayudantes del catalogo y de la ficha. PR 3' },
  { numero: 62, fichero: 'lib/db/courses-queries.ts', tabla: 'lessons', como: 'embed', cuantas: 1, porque: 'ayudantes del catalogo y de la ficha. PR 3' },
  { numero: 63, fichero: 'lib/db/courses-queries.ts', tabla: 'lessons', como: 'from', cuantas: 8, porque: 'ayudantes del catalogo y de la ficha. PR 3' },
  { numero: 64, fichero: 'lib/db/courses-queries.ts', tabla: 'modules', como: 'embed', cuantas: 1, porque: 'ayudantes del catalogo y de la ficha. PR 3' },
  { numero: 65, fichero: 'lib/db/courses-queries.ts', tabla: 'modules', como: 'from', cuantas: 7, porque: 'ayudantes del catalogo y de la ficha. PR 3' },
  { numero: 66, fichero: 'lib/db/learning-paths.ts', tabla: 'courses', como: 'clave', cuantas: 2, porque: 'embed por la clave ajena (course:course_id!inner). PR 3' },
  { numero: 67, fichero: 'lib/db/queries.ts', tabla: 'courses', como: 'clave', cuantas: 4, porque: 'ayudantes antiguos. PR 3' },
  { numero: 68, fichero: 'lib/db/queries.ts', tabla: 'courses', como: 'from', cuantas: 3, porque: 'ayudantes antiguos. PR 3' },
  { numero: 69, fichero: 'lib/db/queries.ts', tabla: 'lessons', como: 'clave', cuantas: 3, porque: 'ayudantes antiguos. PR 3' },
  { numero: 70, fichero: 'lib/db/queries.ts', tabla: 'lessons', como: 'embed', cuantas: 1, porque: 'ayudantes antiguos. PR 3' },
  { numero: 71, fichero: 'lib/db/queries.ts', tabla: 'lessons', como: 'from', cuantas: 9, porque: 'ayudantes antiguos. PR 3' },
  { numero: 72, fichero: 'lib/db/queries.ts', tabla: 'modules', como: 'clave', cuantas: 4, porque: 'ayudantes antiguos. PR 3' },
  { numero: 73, fichero: 'lib/db/queries.ts', tabla: 'modules', como: 'embed', cuantas: 1, porque: 'ayudantes antiguos. PR 3' },
  { numero: 74, fichero: 'lib/db/queries.ts', tabla: 'modules', como: 'from', cuantas: 7, porque: 'ayudantes antiguos. PR 3' },
  { numero: 75, fichero: 'lib/progress/getCourseProgress.ts', tabla: 'lessons', como: 'embed', cuantas: 2, porque: 'el denominador del progreso es lo publicado (punto 2). PR 3' },
  { numero: 76, fichero: 'lib/progress/getCourseProgress.ts', tabla: 'modules', como: 'from', cuantas: 2, porque: 'el denominador del progreso es lo publicado (punto 2). PR 3' },
  { numero: 77, fichero: 'lib/progress/getPathProgress.ts', tabla: 'courses', como: 'embed', cuantas: 1, porque: 'progreso de una ruta. PR 3' },
  { numero: 78, fichero: 'lib/progress/getPathProgress.ts', tabla: 'lessons', como: 'from', cuantas: 1, porque: 'progreso de una ruta. PR 3' },
  { numero: 79, fichero: 'lib/progress/getPathProgress.ts', tabla: 'modules', como: 'from', cuantas: 1, porque: 'progreso de una ruta. PR 3' },
  { numero: 80, fichero: 'lib/progress/recalcularMatriculas.ts', tabla: 'lessons', como: 'from', cuantas: 1, porque: 'el denominador del progreso de todos, con el cliente de servicio. PR 3' },
  { numero: 81, fichero: 'lib/projects/eligibility.ts', tabla: 'courses', como: 'from', cuantas: 1, porque: 'decide si un alumno puede entregar proyecto, con el cliente de servicio. PR 3' },
  { numero: 82, fichero: 'lib/quiz/checkCourseQuiz.ts', tabla: 'modules', como: 'from', cuantas: 1, porque: 'correccion y estado del examen (punto 4). PR 3' },
  { numero: 83, fichero: 'lib/quiz/checkCourseQuiz.ts', tabla: 'quiz_questions', como: 'from', cuantas: 2, porque: 'correccion y estado del examen (punto 4). PR 3' },
  { numero: 84, fichero: 'scripts/generar-cursos-publicados.mjs', tabla: 'courses', como: 'from', cuantas: 1, porque: 'genera lib/enlazado/cursos-publicados.ts, que usan el blog y el glosario. PR 3' },
  { numero: 85, fichero: 'scripts/generar-cursos-publicados.mjs', tabla: 'lessons', como: 'from', cuantas: 1, porque: 'genera lib/enlazado/cursos-publicados.ts, que usan el blog y el glosario. PR 3' },
  { numero: 86, fichero: 'scripts/generar-cursos-publicados.mjs', tabla: 'modules', como: 'from', cuantas: 1, porque: 'genera lib/enlazado/cursos-publicados.ts, que usan el blog y el glosario. PR 3' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Los .mjs también: el generador de cursos publicados es uno, y un script que lea las
// tablas de trabajo para escribir algo que leen las páginas públicas cuenta igual.
const EXT = ['.ts', '.tsx', '.mjs', '.js']

function recorrer(p: string, acc: string[] = []): string[] {
  const abs = path.join(RAIZ, p)
  if (!fs.existsSync(abs)) return acc
  if (fs.statSync(abs).isFile()) {
    if (EXT.includes(path.extname(abs))) acc.push(p)
    return acc
  }
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const hijo = `${p}/${e.name}`
    if (e.isDirectory()) recorrer(hijo, acc)
    else if (EXT.includes(path.extname(e.name))) acc.push(hijo)
  }
  return acc
}

type Hallazgo = {
  fichero: string
  tabla: string
  /** `clave` es el embed por el nombre de la columna: `course:course_id!inner(*)`. */
  como: 'from' | 'embed' | 'clave'
  linea: number
}

/** La columna de la clave ajena, y la tabla de trabajo a la que llega. */
const CLAVES_A_TABLA: Record<string, string> = {
  course_id: 'courses',
  module_id: 'modules',
  lesson_id: 'lessons',
}

/** Los `.select(...)` de un fichero, con su posición. */
function selects(texto: string): { contenido: string; desde: number }[] {
  const fuera: { contenido: string; desde: number }[] = []
  for (const m of texto.matchAll(/\.select\(\s*([`'"])([\s\S]*?)\1/g)) {
    fuera.push({ contenido: m[2], desde: m.index! })
  }
  return fuera
}

function hallazgosDe(fichero: string): Hallazgo[] {
  const texto = fs.readFileSync(path.join(RAIZ, fichero), 'utf8')
  const linea = (i: number) => texto.slice(0, i).split('\n').length
  const fuera: Hallazgo[] = []

  for (const tabla of TABLAS_DE_TRABAJO) {
    // 1) from('tabla')
    for (const m of texto.matchAll(new RegExp(`from\\(\\s*['"\`]${tabla}['"\`]`, 'g'))) {
      fuera.push({ fichero, tabla, como: 'from', linea: linea(m.index!) })
    }
    // 2) el embed por el nombre de la tabla: `tabla (`, con o sin alias y con o sin !hint
    for (const sel of selects(texto)) {
      for (const m of sel.contenido.matchAll(new RegExp(`(?:^|[\\s,:(!])${tabla}\\s*(?:!\\w+)?\\s*\\(`, 'g'))) {
        fuera.push({ fichero, tabla, como: 'embed', linea: linea(sel.desde + m.index!) })
      }
    }
  }

  // 3) el embed por el nombre de la CLAVE AJENA: `course:course_id!inner (*)`.
  //    Aquí la tabla no se nombra, así que buscarla por su nombre no sirve. Se exige el
  //    paréntesis detrás para no confundirlo con la columna a secas en un select.
  for (const [clave, tabla] of Object.entries(CLAVES_A_TABLA)) {
    for (const sel of selects(texto)) {
      for (const m of sel.contenido.matchAll(new RegExp(`(?:^|[\\s,:(!])${clave}\\s*(?:!\\w+)?\\s*\\(`, 'g'))) {
        fuera.push({ fichero, tabla, como: 'clave', linea: linea(sel.desde + m.index!) })
      }
    }
  }

  return fuera
}

const ficheros = [
  ...new Set([...ZONAS_PUBLICAS.flatMap((z) => recorrer(z)), ...AYUDANTES_DE_ALUMNO]),
]
  .filter((f) => fs.existsSync(path.join(RAIZ, f)))
  .filter((f) => !ZONAS_DE_PERSONAL.some((z) => f.startsWith(z)))
  .sort()

const hallazgos = ficheros.flatMap(hallazgosDe)

/** La clave de una lectura: fichero + tabla + sintaxis. */
const claveDe = (h: { fichero: string; tabla: string; como: string }) =>
  `${h.fichero}|${h.tabla}|${h.como}`

const contadas = new Map<string, number>()
for (const h of hallazgos) contadas.set(claveDe(h), (contadas.get(claveDe(h)) ?? 0) + 1)

const declaradas = new Map(EXCEPCIONES.map((e) => [claveDe(e), e]))

// ── 1. Lecturas de más: sin declarar, o más de las revisadas ────────────────
type DeMas = { clave: string; encontradas: number; declaradas: number; ejemplo?: Hallazgo }
const deMas: DeMas[] = []
for (const [clave, encontradas] of contadas) {
  const e = declaradas.get(clave)
  const cuantas = e?.cuantas ?? 0
  if (encontradas > cuantas) {
    deMas.push({
      clave,
      encontradas,
      declaradas: cuantas,
      ejemplo: hallazgos.find((h) => claveDe(h) === clave),
    })
  }
}

// ── 2. Excepciones que ya no hacen falta, del todo o en parte ───────────────
const sobrantes: { excepcion: Excepcion; encontradas: number }[] = []
for (const e of EXCEPCIONES) {
  const encontradas = contadas.get(claveDe(e)) ?? 0
  if (encontradas < e.cuantas) sobrantes.push({ excepcion: e, encontradas })
}

const totalDeclarado = EXCEPCIONES.reduce((a, e) => a + e.cuantas, 0)
console.log(`\nficheros de alumno o públicos mirados: ${ficheros.length}`)
console.log(`lecturas de tablas de trabajo encontradas: ${hallazgos.length}`)
console.log(`declaradas como excepción temporal: ${totalDeclarado} lecturas en ${new Set(EXCEPCIONES.map((e) => e.fichero)).size} ficheros`)

if (GENERAR) {
  // Escupe la lista para pegarla aquí abajo. Se usa al crear el guardián y cada vez que
  // la PR 3 mueva lecturas: regenerar es más fiable que ajustar a mano 81 grupos.
  console.log('\n// ---- pegar en EXCEPCIONES ----')
  let n = 0
  for (const [clave, cuantas] of [...contadas.entries()].sort()) {
    const [fichero, tabla, como] = clave.split('|')
    n++
    console.log(
      `  { numero: ${n}, fichero: '${fichero}', tabla: '${tabla}', como: '${como}', ` +
      `cuantas: ${cuantas}, porque: '${motivoDe(fichero).replace(/'/g, "\\'")}' },`
    )
  }
  console.log('// ---- fin ----\n')
  process.exit(0)
}

if (SOLO_INFORME) {
  console.log('\n=== todas las lecturas, una línea por fichero|tabla|sintaxis ===')
  for (const [clave, cuantas] of [...contadas.entries()].sort()) {
    const e = declaradas.get(clave)
    const [f, tabla, como] = clave.split('|')
    console.log(
      `   ${e ? `#${String(e.numero).padStart(2)}` : ' SIN'}  ${String(cuantas).padStart(2)}x  ` +
      `${tabla.padEnd(15)} ${como.padEnd(5)} ${f}`
    )
  }
}

if (deMas.length > 0) {
  console.log(`\n=== LECTURAS DE MAS: ${deMas.length} ===`)
  for (const d of deMas.slice(0, 40)) {
    const [f, tabla, como] = d.clave.split('|')
    const comoLoHace =
      como === 'embed' ? 'por embed' : como === 'clave' ? 'por embed de la clave ajena' : 'directamente'
    console.log(
      `   ${f}  lee «${tabla}» ${comoLoHace}: ${d.encontradas} ` +
      `(revisadas ${d.declaradas})` + (d.ejemplo ? `, p. ej. linea ${d.ejemplo.linea}` : '')
    )
  }
  console.log(
    '\nLo que leen los alumnos sale de la copia publicada (*_publicados). Si esta\n' +
    'lectura tiene que existir por ahora, declárala en EXCEPCIONES con su motivo y su\n' +
    'cuenta; si no, cámbiala al espejo.'
  )
}

if (sobrantes.length > 0) {
  console.log(`\n=== EXCEPCIONES QUE SOBRAN: ${sobrantes.length} ===`)
  for (const x of sobrantes) {
    console.log(
      `   #${x.excepcion.numero} ${x.excepcion.fichero}: declaradas ${x.excepcion.cuantas} ` +
      `lecturas de «${x.excepcion.tabla}» (${x.excepcion.como}) y hay ${x.encontradas}`
    )
  }
  console.log('\nAjústalas o quítalas: una excepción que sobra es una puerta abierta.')
}

const mal = deMas.length + sobrantes.length
console.log(
  `\nlecturas_de_mas ${deMas.length}, excepciones_sobrantes ${sobrantes.length}  ` +
  (mal === 0 ? 'TODO CORRECTO' : 'REVISAR') + '\n'
)

// LO QUE ESTE GUARDIAN NO VE, para que nadie lo dé por cubierto:
//
//   - una función de la base (`rpc`) que lea por dentro las tablas de trabajo;
//   - una vista sobre ellas (el nombre de la vista no delata la tabla);
//   - una lectura escrita en un fichero que no esté en las zonas de arriba.
//
// Las dos primeras se tapan en la PR 3 quitándole a `anon` el SELECT sobre las tablas
// de trabajo: entonces lo que no esté en el espejo no se puede leer, lo diga el código
// como lo diga. Esto es lo que impide que vuelva a entrar por el camino conocido.

if (!SOLO_INFORME && mal > 0) process.exit(1)
