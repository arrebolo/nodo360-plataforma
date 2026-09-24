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

- [ ] **Auditar todas las consultas que traen `courses`, `modules` o `lessons` como relación embebida sin `!inner` y asumen que la fila existe.** En PostgREST ese embed es un LEFT JOIN: cuando RLS oculta la fila —y la oculta en cuanto el curso no está `published`— llega `null`, no un error. El código que hace `x.course.title` revienta con 500, y el que hace `{...x.course}` produce un objeto vacío que se pinta como una tarjeta sin enlace.
  Archivar **un solo** curso el 24/09/2026 obligó a tres arreglos seguidos, cada uno descubierto después del anterior: el título en `/dashboard/certificados` (ponía «Curso» a secas), la tarjeta rota en `/dashboard/cursos` (`href="/cursos/undefined"`) y un **500** en `/certificados/[id]`, que es justo la página del botón «Ver tu certificado».
  Inventario al 24/09/2026, ya revisado: `/rutas` y `/dashboard/rutas` **están protegidas** (`if (!course) continue`); `lib/certificates/generator.ts:459` usa `module?.title`, correcto. Queda **`lib/db/enrollments.ts:131`**, que hace `enrollment.course.id` sin proteger: hoy no afecta a nadie porque `getUserEnrollments` **no la importa ningún archivo**, pero es una mina para quien la conecte.
  Lo que falta es convertir esto en una comprobación repetible en vez de una ronda manual: decidir el criterio por defecto (`!inner` cuando la fila es imprescindible, `?.` y respaldo cuando no) y dejarlo escrito, porque el patrón volverá cada vez que se archive o despublique algo. *(El primero que lo descubra si no, será un usuario.)*

- [ ] Decidir destino de la ruta **Trading** (2 cursos huérfanos del mapa Web3): archivar / mantener aparte / reconvertir
- [ ] Reencuadrar "Seguridad básica en Bitcoin y criptomonedas" como Seguridad Transversal nivel 1 (ampliar a riesgos Web3, no solo Bitcoin)
- [ ] Arreglar colisión de `position` entre rutas Seguridad Avanzada y Trading Básico
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
