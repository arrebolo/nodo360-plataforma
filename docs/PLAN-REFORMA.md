# Plan de Reforma y Desarrollo — Nodo360
*Basado en la auditoría del 20/09/2026*

**Workspace local:** `C:\Users\alber\nodo360-projects`
**Repo:** github.com/arrebolo/nodo360-plataforma

---

## Tier 0 — Parar la sangría

- [x] Arreglar el despliegue: producción corre desde `content/cold-storage-course`, no desde `main` — restaurar el flujo normal (deploy desde `main`) *(20/09/2026: PR #104 mergeada; producción sirve `main` @ `5ba986c` con `source: git`; rama `content/cold-storage-course` borrada)*
- [ ] Quitar o arreglar `/proyectos`: hoy promete DAO, NFTs y DEX con fechas de 2025 caducadas y progreso inventado (viola Principio #7)
- [ ] Decidir sobre Phase 27 (sistema de proyectos comunitarios):
  - [ ] Opción A: aplicar migración `019_projects_system.sql` + construir la UI
  - [ ] Opción B: revertir/ocultar los 12 endpoints hasta que haya usuarios premium reales
- [ ] Cerrar PR #49 (Fix/mentor panel styling) — obsoleto
- [ ] Cerrar PR #7 (Integrate/route groups auth sidebar) — no mergeable
- [ ] Cerrar PR #6 (Fix RSC CVE) — ya resuelto en `main`
- [ ] Revisar y cerrar PR #1 (Claude/claude md) — rescatar mejoras de `sitemap.ts` y metadata antes de cerrar
- [ ] Validar la contraseña en el registro: exigir 8 caracteres como mínimo. Hoy no se comprueba en cliente y solo queda el mínimo de Supabase. El cambio estaba en `feature/lesson-comments`, que se borra porque su función principal ya está en `main`; conviene rehacerlo aparte y revisar de paso el formulario de cambio de contraseña
- [x] Los respaldos de lecciones deben incluir el `slug` ademas de `title` y `content`. El 23/09/2026 los `volver-atras` de la 043 se ejecutaron por error y restauraron solo contenido: los slugs se quedaron en los nuevos y cinco de las seis URLs del curso servian una leccion distinta de la suya, con la base de datos internamente coherente. *(24/09/2026: corregido en la 044 y elevado a regla 21 del prompt maestro. Pendiente revisar si alguna migracion anterior dejo respaldos incompletos del mismo tipo)*
- [ ] Si el blog pasa alguna vez de `lib/blog-data.ts` a la base de datos, automatizar entonces el anuncio en Discord. Hoy se hace a mano llamando al endpoint con `type: new_blog_post` (documentado en el prompt maestro), y con un articulo al mes no compensa: automatizarlo sobre un archivo estatico exige una tabla nueva de contenido ya anunciado, y aun asi un rollback o un rebuild reanunciarian lo viejo. Con los articulos en la BD hay un evento real al que engancharse y el problema desaparece (24/09/2026: decision tomada a proposito, no es un olvido)
- [ ] `scripts/download-blog-images.mjs` debe saltar los archivos que ya existen salvo que se le pase una opción explícita. Hoy el bucle va directo a la descarga para las 16 entradas y sobrescribe cada `.webp`, asi que ejecutarlo entero vuelve a bajar de Unsplash las portadas ya publicadas y puede cambiarlas sin que nadie lo pida (23/09/2026: la portada del articulo de Coldcard se genero con un script filtrado al slug nuevo por este motivo)
- [x] Commitear `docs/content/` (69 KB sin subir a git: guiones de Cold Storage, Nodos Bitcoin, guía de slides) *(20/09/2026: PR #103)*
- [ ] **RLS de `lessons` no mira el estado del curso: las 87 lecciones de la base son legibles con la clave anónima pública, incluidas las de cursos archivados o sin publicar.** Comprobado el 24/09/2026: `anon` lee `lessons` entero, `content` incluido, con los 87 registros que existen. La web no lo deja ver —la página de lección resuelve antes el curso y `resolveCourseAccess` corta— pero la API va por otro camino y no pasa por ahí. La clave anónima está en el HTML de cualquier página, así que basta una petición.
  Hoy el daño es acotado (todo el catálogo es gratuito y los 2 cursos archivados ya estuvieron publicados), pero fija el techo de lo que puede protegerse: mientras la política siga así, **cualquier curso premium, en borrador o retirado tendrá su contenido accesible desde el primer día**, y el Tier 3 contempla contenido de pago. Lo mismo hay que comprobar en `modules` y en `quiz_questions` (esta última sí tiene política propia, de la migración 024).
  No se toca dentro de una migración de contenido: cambiar la política de `lessons` puede dejar fuera al panel de instructor y a la vista previa de borradores, así que necesita su propia rama y su propia verificación.

- [ ] **No hay forma de saber si un endpoint se consultó.** El incidente del 24/09/2026 dejó una ventana de 10 meses sin ninguna manera de comprobar si alguien la aprovechó: los registros de ejecución de Vercel no llegan (sin *Log Drain* la retención es de días), los de API de Supabase duran 1 día en gratuito y 7 en Pro, y la aplicación no audita lecturas. Decidir si se configura un *Log Drain*, aunque sea al almacenamiento más barato: sin él, cualquier incidente futuro se documentará igual de a ciegas.

- [ ] **Barrer el código muerto que sigue teniendo ruta.** `components/gamification/Leaderboard.tsx` no lo importa nadie desde 2025 y su endpoint seguía publicado devolviendo datos personales. El componente y `/api/gamification/leaderboard` son candidatos a borrarse enteros, no solo a limpiarse. Buscar el resto: un endpoint sin consumidor sigue respondiendo.

- [ ] Configurar CI en PRs (typecheck + lint + build) — hoy no hay ninguna verificación automática antes de mergear
- [x] Corregir validación de quiz server-side (`/api/quiz/submit` aceptaba `score` y `passed` del cliente: se podía emitir un certificado sin responder) — rama `fix/rls-quiz-security`
- [x] Dejar de exponer `correct_answer` al navegador (API, payload RSC y corrección en cliente)
- [ ] Aplicar migración 021 en Supabase (RLS en `course_final_quiz_attempts` y `quiz_questions` + REVOKE de `correct_answer`)
- [ ] Decidir qué hacer con los 13 certificados emitidos antes del fix: no es posible verificar retroactivamente cuáles se ganaron respondiendo el quiz. Decisión de producto pendiente (Principio #4)

## Tier 1 — Ganancias rápidas de contenido

- [ ] Sustituir el contenido corto de **Cold Storage** (draft, ~1.000 chars/lección) por el guion completo de `docs/content/curso-cold-storage-completo.md` (26 KB)
- [ ] Sustituir el contenido corto de **Nodos Bitcoin** (draft, ~996 chars/lección) por el guion completo de `docs/content/curso-nodos-bitcoin-completo.md` (27 KB)
- [ ] Publicar la lección rica de dApps/smart contracts de `/output-lessons` (18 min) sustituyendo la versión breve actual
- [ ] Fusionar los 2 cursos de custodia duplicados en uno solo
- [ ] Fusionar los 2 cursos "Web3 básico" duplicados en uno solo

## Tier 2 — Reforma estructural del catálogo

- [ ] **Los eventos de XP anteriores a la migración 037 tienen `related_id` nulo, y eso permite pagar XP dos veces por la misma lección.** El índice único es `(user_id, event_type, related_id)`, y en Postgres los nulos no colisionan entre sí: dos filas con `related_id` nulo conviven sin conflicto. Así que si alguien vuelve a completar una lección cuyo evento quedó sin fuente, se le concede XP otra vez. Hoy no molesta porque nadie está rehaciendo lecciones viejas, pero el escalonado y el aviso de contenido nuevo invitan justamente a volver a cursos ya empezados *(24/09/2026: detectado al revisar los cursos ampliados; el usuario `01b68344` tiene 3 de sus 6 eventos con `related_id` nulo)*. Antes de decidir nada hay que contar cuántos son en total y de qué tipo: rellenar el `related_id` a posteriori solo es posible si el evento guarda en otro campo a qué lección correspondía.

- [ ] **Hay matrículas al 100% cuyo progreso nunca se registró entero**, y no por contenido nuevo. Cuatro casos al 24/09/2026: tres en *Gestión del riesgo* (3 de 6 lecciones) y uno en *Introducción al trading* (5 de 6), todos con certificado emitido en enero con el **formato antiguo** (`NODO-20260121-D581J`), el que emitía el trigger `auto_issue_course_certificate`, frente al actual (`NODO360-2026-17E580DE`). Parece que aquel camino marcaba la matrícula como completa sin escribir las filas de `user_progress`. La migración 047 los dejó **sin tocar a propósito**: bajarles el porcentaje diría "has perdido progreso" cuando no hay nada nuevo que consumir. Queda por decidir si se rellenan esas filas o se acepta el desfase, y por revisar si ese trigger sigue activo.

- [ ] **Auditar todas las consultas que traen `courses`, `modules` o `lessons` como relación embebida sin `!inner` y asumen que la fila existe.** En PostgREST ese embed es un LEFT JOIN: cuando RLS oculta la fila —y la oculta en cuanto el curso no está `published`— llega `null`, no un error. El código que hace `x.course.title` revienta con 500, y el que hace `{...x.course}` produce un objeto vacío que se pinta como una tarjeta sin enlace.
  Archivar **un solo** curso el 24/09/2026 obligó a tres arreglos seguidos, cada uno descubierto después del anterior: el título en `/dashboard/certificados` (ponía «Curso» a secas), la tarjeta rota en `/dashboard/cursos` (`href="/cursos/undefined"`) y un **500** en `/certificados/[id]`, que es justo la página del botón «Ver tu certificado».
  Inventario al 24/09/2026, ya revisado: `/rutas` y `/dashboard/rutas` **están protegidas** (`if (!course) continue`); `lib/certificates/generator.ts:459` usa `module?.title`, correcto. Queda **`lib/db/enrollments.ts:131`**, que hace `enrollment.course.id` sin proteger: hoy no afecta a nadie porque `getUserEnrollments` **no la importa ningún archivo**, pero es una mina para quien la conecte.
  Lo que falta es convertir esto en una comprobación repetible en vez de una ronda manual: decidir el criterio por defecto (`!inner` cuando la fila es imprescindible, `?.` y respaldo cuando no) y dejarlo escrito, porque el patrón volverá cada vez que se archive o despublique algo. *(El primero que lo descubra si no, será un usuario.)*

- [ ] **Las matrículas de un curso archivado se quedan huérfanas, y nadie avisa a quien las tiene.** Al archivar los dos cursos de custodia (24/09/2026) quedaron **6 matrículas de 5 personas** y **4 filas de `user_progress`** apuntando a contenido que ya no se sirve. No se rompe nada —RLS oculta el curso, el embed devuelve `null` y la tarjeta se descarta—, pero la tarjeta simplemente **desaparece del panel sin explicación**, y una de esas personas iba por el 50%. Ninguna tenía certificado, así que esta vez no había nada que preservar. Falta decidir el trato por defecto: matricular automáticamente en el curso que absorbe el contenido, mostrar un aviso de «este curso se fusionó en X», o dejarlo como está y asumir la pérdida silenciosa. La decisión vale también para el curso monetario, archivado el mismo día con el mismo efecto.

- [ ] **Los dos números de las rutas y los cursos no los calcula nadie.** `courses.total_modules` y `total_lessons` se escriben a mano en cada migración de contenido; `modules.total_lessons` vale 0 en casi todas las filas y aun así se pinta. Hoy cuadran porque cada migración los actualiza, pero nada lo garantiza: quien añada una lección desde el panel dejará el contador mintiendo. O se calculan en la consulta, o hay un disparador que los mantiene.

- [ ] Decidir destino de la ruta **Trading** (2 cursos huérfanos del mapa Web3): archivar / mantener aparte / reconvertir
- [ ] Reencuadrar "Seguridad básica en Bitcoin y criptomonedas" como Seguridad Transversal nivel 1 (ampliar a riesgos Web3, no solo Bitcoin)
- [x] ~~Arreglar colisión de `position` entre rutas Seguridad Avanzada y Trading Básico~~ *(24/09/2026: resuelto por eliminación — la ruta Seguridad Avanzada desaparece en la migración 048 y su único curso, Cold Storage, pasa a Seguridad en Criptomonedas con `position` 1. Queda un 301 desde `/rutas/seguridad-avanzada`)*
- [ ] Definir secuencia (`position`) dentro de las rutas legacy (hoy todas en 0)
- [ ] Documentar `is_admin` en una migración del repo (existe en la DB con parámetro `check_user_id`, pero no está en ninguna migración — una reconstrucción desde cero no la crearía)
- [ ] Documentar el esquema real de `learning_paths` (columnas: id, slug, name, emoji, short_description…) — el error `lp.title` en lugar de `lp.name` ha aparecido ya tres veces (migraciones 008, 020 y rama `feature/instructores-mentores`)
- [ ] Integrar `lib/quiz/validateQuizSubmission.ts` en `/api/quiz/submit` — hoy el endpoint corrige las respuestas pero no valida que los `question_id` pertenezcan al módulo del curso
- [ ] Los grants por columna de `quiz_questions` no cubren columnas futuras: al añadir una columna nueva hay que concederla explícitamente a `authenticated` o las consultas con lista explícita empezarán a fallar
- [x] La página de lección (`app/cursos/[slug]/[lessonSlug]/page.tsx`) filtra solo por slug, sin comprobar `course.status`: el contenido de cursos en draft es accesible por URL directa a cualquier usuario autenticado. El quiz final sí exige `status = 'published'` — incoherencia a resolver *(21/09/2026: regla única en `lib/courses/access.ts` aplicada a la ficha, la lección y el examen final — publicado lo ve cualquiera, no publicado solo el admin y el instructor del curso, el resto 404. Los tres muestran aviso de vista previa y los borradores salen con `noindex`. De paso queda arreglado el botón «Vista previa» del panel admin, que daba 404)*
- [ ] Decidir si las ediciones de módulos y lecciones de un curso publicado hechas por un instructor deben pasar por revisión. Hoy el trigger `check_course_modification` solo vigila los metadatos de `courses` (título, descripción, nivel, precio, imágenes): se puede reescribir una lección publicada sin revisión, mientras que cambiar una coma del título del curso sí manda todo a `pending_review`. **Resolver antes de admitir instructores externos.**
- [ ] Decidir si el esquema `backup_nodo360` sigue siendo necesario; si no, exportarlo fuera del proyecto y eliminarlo (contiene una copia de `users` con datos personales)
- [ ] Unificar las dos carpetas de migraciones (`supabase/migrations/` y `docs/migrations/`) en una sola secuencia sin números duplicados. Hoy conviven **dos 015, dos 016, dos 019, dos 020 y dos 021 distintos**, y en el caso de `course_reviews` las dos versiones del 019 crean la misma tabla con esquemas incompatibles (`mentor_id`/`vote`/`comment` frente a `reviewer_id`/`decision`/`feedback`); ganó la de `docs/`, pero solo se puede saber consultando la base de datos. Ningún archivo declara qué carpeta es la buena ni qué orden se siguió
- [ ] Decidir el tratamiento de los cursos `coming_soon`: aparecen en `/cursos` (los lista `getAllCourses` con `.in('status', ['published','coming_soon'])`) pero su ficha no deja entrar, porque la regla de visibilidad de `lib/courses/access.ts` solo abre los `published`: se muestra la página de «curso en preparación». Opciones: ficha propia sin lecciones, o no listarlos. Valorar contra el Principio #7 (no prometer). Hoy no hay ningún curso en ese estado, así que no rompe nada todavía
- [ ] Decidir si se elimina la tabla `user_lesson_progress` (0 filas). El progreso real vive en `user_progress` (91 filas), y las dos tienen esquemas distintos: `user_progress` añade `is_completed`, `watch_time_seconds` y `last_position_seconds`. Mientras convivan, hay código leyendo de cada una y ninguna forma de saber cuál es la buena sin contar filas
- [ ] Registrar qué contenido contiene datos que caducan (tamaños de blockchain, versiones de software, requisitos de hardware, tiempos de sincronización) y cuándo se revisó por última vez. Debe cubrir **`lessons` y también `quiz_questions`**: el quiz de Nodos Bitcoin ya afirma «aproximadamente 1 TB recomendado» de almacenamiento y «entre 2 y 7 días» de sincronización inicial, datos que envejecen igual que los del cuerpo de la lección. Los comentarios HTML `<!-- REVISAR -->` no sirven como registro: no sobreviven a una edición desde TipTap, y en `quiz_questions` no hay ningún sitio donde ponerlos

## Tier 3 — Construcción nueva (por orden)

- [ ] **Fundamentos Blockchain** — curso base: consenso, PoW/PoS, forks, criptografía (0% cobertura actual)
- [ ] **Ethereum y Smart Contracts** — apoyarse en el artículo de blog existente + lección de dApps ya generada
- [ ] **DAOs** — sinergia con el sistema de gobernanza propio; resuelve la contradicción de `/proyectos`
- [ ] **NFTs** — usar como semilla la lección "Tokens y NFTs" de Ecosistema Web3 + artículo de blog
- [ ] **DeFi** — usar como semilla los 2 artículos de blog + 11 términos de glosario ya existentes
- [ ] **Otras L1/L2 e Interoperabilidad** — usar como semilla el artículo de blog sobre Layer 2

---

## Notas
- El blog (15 artículos) y el glosario (72 términos) ya cubren Ethereum, DeFi, NFTs, DAOs y Layer 2 — son la materia prima más barata para el Tier 3, no hay que partir de cero conceptualmente.
- Phase 27 no tiene sentido completarla hasta que `entitlements` tenga usuarios premium reales (hoy: 0).
