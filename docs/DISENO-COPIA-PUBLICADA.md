# La copia publicada de un curso

Diseño cerrado y aprobado. **La PR 1 es la migración 117**, que crea las tablas
espejo, `publicar_curso()`, `retirar_curso_de_la_copia()`, el trigger y el repunte de
las claves ajenas. Las lecturas no cambian hasta la PR 3.

Cifras medidas el 01/10/2026, no estimadas: 15 cursos, 10 publicados, 27 módulos, 81
lecciones, 243 preguntas, 113 filas de progreso sobre 59 lecciones distintas, 17
certificados emitidos.

## El problema que resuelve

Hoy las tablas `courses`, `modules`, `lessons`, `course_quizzes` y `quiz_questions`
son a la vez el borrador del instructor y lo que lee el público. Un instructor con
un curso publicado edita y el cambio sale al aire en el siguiente render, sin que
nadie lo haya revisado. El trigger de la 030 intenta frenarlo devolviendo el curso
a revisión, pero lista **nueve columnas a mano**: `jurisdiccion`, `specialty_id`,
`subtitle`, `learning_objectives`, `requirements`, `target_audience` y **el
contenido de las lecciones** no están en esa lista.

La copia publicada invierte el problema: el trabajo del instructor deja de ser
visible por definición, y publicar es un acto explícito.

## Forma: tablas espejo, no jsonb

`courses_publicados`, `modules_publicados`, `lessons_publicadas` y
`quiz_questions_publicadas`. Mismas columnas, **las mismas claves primarias** (el
mismo uuid que en la tabla de trabajo), más `publicado_el`, `version` y
`retirada_el`.

**No hay `course_quizzes_publicados`**: `course_quizzes` tiene 0 filas y 0
referencias en el código. La migración 078 la dejó PARADA y tenía razón — el examen
final son las preguntas de los módulos. Esto corrige la primera versión de este
documento.

Las columnas que se copian **se sacan del catálogo, no de una lista escrita a mano**,
y si al espejo le falta una columna del origen no se publica: se levanta. Una lista a
mano es exactamente lo que dejó corta a la 030.

Se descarta el snapshot en jsonb: las lecturas públicas son consultas PostgREST
con filtros, embeds y `order`. Con tablas espejo el cambio en cada sitio es el
nombre de la tabla. Con jsonb, cada lectura pasa a ser código de aplicación
—incluidos el sitemap, llms.txt y las imágenes OG— y las claves ajenas del
progreso dejan de servir.

## Punto 1 · Inventario de lecturas y comprobación en CI

### Superficies públicas o de alumno

| Superficie | Cómo lee hoy | Destino |
|---|---|---|
| `app/cursos/page.tsx` (catálogo) | `getAllCourses()` | el helper pasa al espejo |
| `app/cursos/[slug]/page.tsx` (ficha) | `getCourseBySlug()` + 4 lecturas directas + `modules(lessons(id))` embebido | espejo |
| `app/cursos/[slug]/[lessonSlug]/page.tsx` (lección) | `getLessonBySlug()`, `getAllLessonsForCourse()`, `getNextLesson()`, `getPreviousLesson()` + `modules(lessons(...))` embebido | espejo |
| `app/cursos/[slug]/quiz-final/page.tsx` (examen final) | 3 lecturas directas | espejo (punto 4) |
| `app/cursos/[slug]/opengraph-image.tsx` | 1 directa | espejo |
| `app/cursos/[slug]/[lessonSlug]/opengraph-image.tsx` | 1 directa | espejo |
| `app/rutas/page.tsx` | **embed** `course:courses!inner(... modules(lessons(...)))` desde `learning_path_courses` | espejo |
| `app/rutas/[slug]/page.tsx` | `lib/db/learning-paths.ts` | el helper pasa al espejo |
| `app/sitemap.ts` | 2 directas | espejo |
| `app/llms.txt/route.ts` | 1 directa | espejo |
| `app/r/[code]/route.ts` | 1 directa | espejo |
| `app/(public)/instructores/[id]/page.tsx` | 1 directa (cursos publicados del instructor) | espejo |
| `components/home/HomeFeaturedCourses.tsx` | 1 directa | espejo |
| JSON-LD de curso y de ruta (`CourseJsonLd`, `CourseListJsonLd`, `BreadcrumbJsonLd`) | recibe los datos de la página | hereda el origen, no lee |
| Progreso (`lib/progress/getCourseProgress.ts`, 2) | `modules(lessons)` | espejo (punto 2) |
| Progreso al avanzar (`app/api/progress/route.ts`, 3 lecturas de `lessons`) | directas | espejo: el denominador es lo publicado |
| Examen final, corrección (`lib/quiz/checkCourseQuiz.ts`) | 1 directa | espejo (punto 4) |
| Certificados (`lib/certificates/createCertificate.ts`) | 1 directa | espejo |
| Caché (`lib/cache/queries.ts`, 2) | directas | espejo |
| `scripts/generar-cursos-publicados.mjs` | lee `courses`, `modules`, `lessons` y **escribe** `lib/enlazado/cursos-publicados.ts` | espejo |
| `scripts/validar-enlazado.ts` (blog y glosario) | importa la constante `CURSOS_PUBLICADOS`, **no lee la base** | ya desacoplado; queda correcto en cuanto el generador lea del espejo |

Las superficies de admin e instructor siguen leyendo las tablas de trabajo: es su
función. Son la mayoría de los 88 ficheros que tocan contenido de cursos.

### La comprobación en CI

`scripts/comprobar-lecturas-publicas.mts`, encadenado en el check `verificar`.
**Corta, no informa**: `process.exit(1)` en el primer hallazgo. Un guardián que
solo avisa no ha servido ninguna de las veces que ha hecho falta.

Dos mitades, porque una sola no basta:

1. **Prohibir el nombre de la tabla de trabajo** en los ficheros públicos, en las
   dos sintaxis: `from('lessons')` y el **embed** `lessons (`. Esta segunda es la
   que importa: `app/rutas/page.tsx` llega a `courses` y a `modules(lessons)` sin
   escribir `from('courses')` ni una vez. Un grep de `from(` no lo habría visto:
   el mismo punto ciego que la lista de nueve columnas de la 030.
2. **Descubrir la lista, no recordarla**: el script enumera los ficheros bajo
   `app/cursos`, `app/rutas`, `app/(public)`, `app/sitemap.ts`, `app/llms.txt`,
   `app/r`, `components/home` y los helpers de alumno, y falla si aparece un
   fichero nuevo que no está en la lista revisada. Una lista escrita a mano
   envejece en silencio; un censo del catálogo, no.

### Lo que el guardián corrigió del inventario (PR 2, aplicada)

El inventario de arriba se escribió leyendo el código. Al ejecutar el guardián no
cuadraba, y las diferencias importan:

**Una tercera sintaxis de embed, que ningún grep del nombre de la tabla ve.**
`lib/db/learning-paths.ts` llega a `courses` así:

```ts
.from('learning_path_courses')
.select(`position, is_required, course:course_id!inner (*)`)
```

Embebe por el nombre de la **columna de la clave ajena**, no por el de la tabla: la
palabra `courses` no aparece. El inventario daba ese fichero por «lee por el helper» y
lo que hace es leer `courses` sin nombrarla. El guardián mira ahora las tres formas:
`from('x')`, `x (` y `clave_id (`.

**Cuatro entradas del inventario sobraban y tres lecturas faltaban.** Sobraban
`app/cursos/page.tsx` y `app/rutas/[slug]/page.tsx` —leen por su ayudante, no
directamente—, y `lib/progress/getCourseProgress.ts` no lee `courses`. Faltaban
`modules` en `app/sitemap.ts` (por embed) y las dos lecturas de
`app/certificados/[certificateId]/page.tsx`, que no estaban en el inventario y hoy no
pueden ir al espejo porque está cerrado.

La lista de excepciones del guardián **sale de ejecutarlo**, no de este documento. Son
20 ficheros y 102 lecturas, cada una numerada, y el guardián corta también cuando una
excepción deja de hacer falta: así la PR 3 no puede olvidarse de retirarlas.

**Lo que el guardián no ve, y por qué no basta con él**: una función de la base que lea
por dentro, una vista sobre las tablas de trabajo, o una lectura en un fichero fuera de
las zonas. Las dos primeras las cierra la PR 3 quitándole a `anon` el SELECT sobre las
tablas de trabajo: entonces lo que no esté en el espejo no se puede leer, lo diga el
código como lo diga.

## Punto 2 · Identificadores estables

### Lo que hay hoy, medido

`user_progress` es `(user_id, lesson_id)`: no tiene `course_id`. Y su clave ajena
a `lessons.id` es **ON DELETE CASCADE**. Medido creando una lección, un progreso
sobre ella y borrando la lección: la fila de progreso desapareció (1 antes, 0
después).

Es decir: **hoy, un instructor que borra una lección de un curso publicado borra
para siempre el progreso de todos los alumnos en ella**, sin aviso y sin rastro.
Eso ya es un fallo, independiente de este diseño.

`certificates` apunta a `course_id` y `module_id`, nunca a lecciones: los
certificados ya emitidos son inmunes al baile de lecciones.

### Cómo queda

1. **La identidad es el uuid de la lección**, y no cambia nunca. Reordenar es
   cambiar `order_index`, que solo afecta a la presentación y al escalonado; el
   progreso no lo mira.
2. **`lessons_publicadas` es el registro de referencia y no borra nunca**. Al
   publicar una versión que ya no incluye una lección, esa fila no se borra: se
   marca `retirada_el = now()`. Si la lección vuelve, se le quita la marca.
3. **Las claves ajenas de la gente se repuntan al espejo, sin cascada.** Medido una
   por una:

   | clave ajena | antes | ahora |
   |---|---|---|
   | `user_progress.lesson_id` | `lessons` CASCADE | `lessons_publicadas` RESTRICT |
   | `xp_events.lesson_id` | `lessons` CASCADE | `lessons_publicadas` RESTRICT |
   | `xp_events.course_id` | `courses` CASCADE | `courses_publicados` RESTRICT |
   | `certificates.course_id` | `courses` **CASCADE** | `courses_publicados` RESTRICT |
   | `certificates.module_id` | `modules` SET NULL | `modules_publicados` RESTRICT |

   La de los certificados es la peor de las cinco: **borrar un curso borraba las
   credenciales que había emitido**, y `/verificar/[código]` dejaba de encontrarlas.

   Consecuencias, todas deseables:
   - El instructor borra una lección en su copia de trabajo: **el progreso no se
     entera**. El fallo medido arriba desaparece.
   - Se aprueba una versión que elimina lecciones con progreso: la fila publicada
     queda retirada y el progreso sobrevive intacto.
   - Solo se puede registrar progreso sobre una lección publicada. Una vista
     previa del instructor ya no puede crear progreso: lo impide la base, no un
     `if`.
4. **El denominador es lo publicado y vivo**: el porcentaje se cuenta sobre
   `lessons_publicadas WHERE retirada_el IS NULL`, y el numerador con un INNER
   JOIN contra ese mismo conjunto. Si no, el progreso de una lección retirada
   inflaría el porcentaje por encima de 100.
5. **`completed_at` de la matrícula no se limpia nunca.** Ya es la regla en
   `app/api/progress/route.ts`, con su comentario: cuando se añadieron tres
   lecciones a un curso, el porcentaje bajó a 78 y el completado se perdía. Quitar
   lecciones solo puede subir el porcentaje; añadirlas no descompleta a nadie.
6. **Los certificados no necesitan nada**: son del curso. Opcional y barato,
   guardar en `certificates` la `version` del curso certificado, para poder
   responder dentro de un año qué contenía el curso que aprobó.

## Dos piezas que solo aparecieron al escribir la migración

**El relleno no puede ser «lo publicado».** 59 lecciones tienen progreso y **21 de
ellas no son de un curso publicado**. Si el registro no las tuviera, la clave ajena
del progreso no se podría ni crear. Así que se siembra **lo publicado ∪ todo lo que
alguien ya tocó** —progreso, XP, certificados, matrículas—, y lo segundo entra
**retirado**: está en el registro para que esa persona siga cuadrando, pero no es
contenido vivo.

**Hace falta el inverso de publicar.** `retirar_curso_de_la_copia()`, que el mismo
trigger llama cuando un curso deja de estar `published`. Sin ella, despublicar o
archivar un curso no lo quitaría del espejo y, en cuanto las lecturas pasen al
espejo, seguiría en el catálogo con el estado cambiado. Retirar marca; no borra.

Por lo mismo, el relleno publica **solo lo que está publicado ahora**, y no «lo que
tenga `published_at`»: desde la 116 un curso archivado que estuvo publicado alguna
vez tiene fecha, y con esa condición habría vuelto al catálogo por la puerta de
atrás.

## Punto 3 · Cómo publica el admin

```
publicar_curso(p_course_id uuid)
  RETURNS TABLE (version int, modulos int, lecciones int, retiradas int, preguntas int)
```

`SECURITY DEFINER`, con `SET search_path` y `REVOKE ALL … FROM PUBLIC` en la misma
migración, y `GRANT EXECUTE` a `authenticated`. Dentro: deja pasar si
`es_admin_actual()` o si `auth.uid() IS NULL` (el dueño, que es quien ejecuta las
migraciones). Copia por `id` con upsert, marca `retirada_el` en lo que ya no está,
lo desmarca si ha vuelto, sube `version` y pone `publicado_el`.

Devuelve **una fila con las cuentas**, para que cada migración de contenido y el
panel impriman una línea de verificación en vez de dar por hecho que salió bien.

Tres vías de publicación, y ninguna depende de acordarse:

- **Las migraciones de contenido** terminan con `SELECT * FROM publicar_curso('…')`.
  Queda en la plantilla de migración y en CLAUDE.md.
- **Aprobar desde el panel** llama a la función. Y además un trigger
  `AFTER UPDATE OF status ON public.courses` la invoca cuando el estado pasa a
  `published`: así aprobar no puede olvidarse de publicar.
- **Refrescar a mano** un curso ya publicado, desde `/admin/cursos`, con la fila
  de cuentas a la vista.

## Punto 4 · El examen final sale de la copia publicada

`quiz_questions_publicadas` hereda **la misma postura de permisos** que su original:
`correct_answer` y `explanation` no se abren a `anon` ni a `authenticated` por el
hecho de estar en otra tabla —hoy están cerradas a todos los roles, y se queda así—.
La corrección (`lib/quiz/checkCourseQuiz.ts` y `/api/quiz/submit`) lee del espejo,
para que a nadie se le corrija con un examen distinto del que hizo.

## Un curso publicado con cambios pendientes de revisión

Esto sale de un caso real: un curso aprobado, modificado por su autor y reenviado a
revisión. Lo que tiene que pasar es claro —la versión publicada sigue en pie y los
cambios no se ven hasta aprobarlos— y la copia publicada lo resuelve, pero **no
gratis**: hacen falta tres cosas más de las que estaban escritas.

### 1. `status` pasa a describir la COPIA DE TRABAJO

Hoy `status` intenta decir dos cosas a la vez —qué hay publicado y en qué punto está la
revisión— y no puede: es una sola columna. De ahí que un curso aprobado y reenviado
«desaparezca» de publicado.

Con la copia publicada se separan sin añadir ninguna columna:

- **qué está en el catálogo** lo dice el espejo: `courses_publicados.retirada_el IS NULL`
- **en qué punto está el trabajo** lo dice `status`: `draft`, `pending_review`,
  `changes_requested`

Así «publicado con cambios pendientes» es simplemente *espejo vivo + `status =
pending_review`*, y no hay estado nuevo que inventar. Lo que sí hay que escribir en
algún sitio es que `status` ya no habla del catálogo, porque hoy medio código lo lee
como si hablara.

### 2. El trigger de la 117 tiene que dejar de retirar la copia al salir de «published»

**Esto es un cambio de la 117, así que la PR 3 lleva migración**, y no me había dado
cuenta al escribir el diseño.

Hoy `al_publicar_refrescar_la_copia()` retira el espejo en cuanto el estado deja de ser
`published`. Eso es lo correcto mientras `status` signifique «está en el catálogo»: si
el admin archiva un curso, fuera. Pero en cuanto `status` describa el trabajo, ese mismo
trigger **despublicaría el curso en el momento en que su autor reenvía cambios** — justo
lo contrario de lo que queremos.

La regla nueva: se retira cuando la administración lo decide (`archived`, o `draft`
puesto por un admin), **no** cuando el curso pasa a `pending_review` o a
`changes_requested`. Publicar sigue siendo `publicar_curso()`, que al aprobar una
revisión hace exactamente lo que ya hace: refrescar la copia y retirar lo que ya no
está.

### 3. Qué ha cambiado, para poder revisarlo

El espejo guarda los valores publicados, así que la comparación sale de los datos y no
hay que guardar diffs: `courses` frente a `courses_publicados` campo a campo, y
`lessons` frente a `lessons_publicadas` por `id` —título y contenido—. Con eso, la
pantalla de revisión del admin puede enseñar **lo que cambia respecto a lo publicado**,
que es lo único que hace falta revisar.

En `/admin/cursos`, el curso aparece como **«Cambios pendientes de revisión»** y entra en
la lista de pendientes, con acceso a revisar, pedir cambios o aprobar. Eso ya está hecho
—sin esperar a la copia publicada— distinguiendo por `published_at IS NOT NULL AND
status = 'pending_review'`, que es lo que hoy se puede saber.

### Lo que NO hace falta

- Ninguna columna nueva.
- Ninguna tabla de versiones: la «versión pendiente» es la copia de trabajo, que ya
  existe. Era el punto de todo el diseño.
- Guardar diffs: se calculan.

## Esfuerzo y orden

Cuatro PR, en este orden, porque el orden es la parte peligrosa:

1. **Migración** (la 117): tablas espejo, `publicar_curso()`,
   `retirar_curso_de_la_copia()`, el trigger, el repunte de las cinco claves ajenas y
   el relleno. **Las tablas nacen cerradas**: RLS activada sin políticas y sin GRANT
   a `anon` ni a `authenticated`. Nadie las lee todavía, y abrir una tabla que nadie
   lee es abrirla a ciegas; los permisos los pone la PR 3, superficie por
   superficie. Autoprueba obligatoria: para cada curso publicado, las cuentas de
   módulos, lecciones y preguntas del espejo coinciden con las de trabajo. Es la
   pieza grande.
2. **El guardián de CI**, con las lecturas todavía apuntando a las tablas de
   trabajo declaradas como excepción temporal y numerada.
3. **El cambio de las lecturas** al espejo, quitando las excepciones del guardián.
   Mecánico, y el guardián se vuelve verde por sí solo.
4. **Retirar el trigger de la 030** con su lista de nueve columnas: con la copia
   publicada, cualquier cambio en las tablas de trabajo es invisible por
   definición, así que ya no hay nada que devolver a revisión por cambiar una
   columna. El flujo de revisión antes de publicar se queda.

El riesgo real no es el diseño, es el despliegue: **si el código pasa al espejo
antes de que el relleno esté aplicado en producción, el catálogo se queda en
blanco.** Mismo patrón que la 106 con la #275. Por eso el relleno va en la PR 1 y
el cambio de lecturas en la 3, y la 3 no se mergea hasta que la 1 esté aplicada y
comprobada.

## La alternativa más simple, y por qué no alcanza

Bloquear la edición: en un curso publicado el instructor no puede tocar nada; para
cambiar algo pide un desbloqueo al admin, que devuelve el curso a `draft` y lo
despublica mientras se edita. Es una migración corta y un trigger sin listas de
columnas.

Es igual de segura frente al problema de esta auditoría, y bastante peor para todo
lo demás: el curso desaparece del catálogo cada vez que su autor corrige una falta
de ortografía, y los alumnos matriculados se quedan sin la lección a medias. Sirve
como parche si hiciera falta algo hoy mismo; no como destino.
