# Censo del esquema `public`

**Fecha: 28/09/2026.** Fuente de verdad sobre qué tablas existen y cuáles se usan.

> Este documento se genera a partir de la base, no de la memoria de nadie. Si algo
> aquí no cuadra con lo que dice otro documento, manda éste — y si no cuadra con la
> base, se vuelve a ejecutar la consulta y se actualiza.

## Cómo se obtuvo

La consulta está en `tmp/censo-real.sql` (no versionada, es una consulta de
diagnóstico). Enumera `pg_class` y cuenta las filas de cada tabla con
`query_to_xml`, que ejecuta un `count(*)` real dentro de cada una. Son cifras
**exactas**, no las estimaciones de `pg_class.reltuples`, que dependen del último
`ANALYZE`.

Las referencias del código se cuentan con `grep -o "\.from('tabla')"` sobre
`app/`, `lib/` y `components/`. Cuentan apariciones, no llamadas en ejecución:
una tabla con muchas referencias en código muerto sigue estando muerta.

## Las cifras

| | |
|---|---|
| **tablas base en `public`** | **77** |
| con datos | 38 |
| **vacías** | **39** (51 %) |
| vistas | 6 |
| filas en total | 1146 |

## Dos censos anteriores estaban mal

Queda escrito porque el error se repitió y conviene no repetirlo una tercera vez.

**1. «53 tablas, 30 vacías (57 %)»** — auditoría del 27/09/2026. Se contó con
`head: true`, que sobre una tabla **inexistente** no da error: devuelve
`count: null`, que se leyó como «existe y tiene 0 filas». Las 20 tablas que nunca
existieron entraron en la cuenta como tablas vacías. La migración 078 se escribió
sobre esa lista y **falló** con `42P01`.

**2. «34 tablas, 10 vacías (29 %)»** — corrección del 28/09/2026. Seguía siendo una
**muestra**: comprobaba una lista de 53 nombres escrita a mano. Había 43 tablas
que nunca se miraron porque no se les ocurrió el nombre a nadie.

**La lección:** un censo se hace enumerando el catálogo. Nunca comprobando una
lista de nombres recordados, y nunca con `head: true`.

## Tablas con datos (38)

| tabla | filas | refs en código |
|---|---:|---:|
| `quiz_questions` | 268 | 10 |
| `xp_events` | 231 | 12 |
| `user_progress` | 122 | 37 |
| `lessons` | 111 | 76 |
| `course_enrollments` | 49 | 47 |
| `instructor_exam_models` | 40 | 1 |
| `notifications` | 40 | 7 |
| `modules` | 37 | 83 |
| `user_badges` | 29 | 12 |
| `users` | 24 | 120 |
| `quiz_attempts` | 17 | 6 |
| `certificates` | 17 | 17 |
| `learning_path_courses` | 16 | 10 |
| `user_gamification_stats` | 16 | 26 |
| `courses` | 15 | 128 |
| `messages` | 12 | 5 |
| `path_courses` | 10 | 1 |
| `level_thresholds` | 10 | — |
| `mentor_config` | 10 | — |
| `badges` | 9 | 17 |
| `governance_admin_actions` | 8 | 2 |
| `governance_categories` | 8 | 1 |
| `xp_actions` | 7 | — |
| `beta_feedback` | 6 | 2 |
| `message_flags` | 6 | 10 |
| `learning_paths` | 6 | 10 |
| `instructor_exams` | 4 | 6 |
| `system_settings` | 3 | 3 |
| `user_reputation` | 3 | 4 |
| `pricing_plans` | 2 | — |
| `user_lesson_notes` | 2 | 3 |
| `user_roles` | 2 | 11 |
| `message_reports` | 1 | 10 |
| `governance_proposals` | 1 | 7 |
| `subscriptions` | 1 | — |
| `governance_votes` | 1 | 8 |
| `instructor_profiles` | 1 | 2 |
| `conversations` | 1 | 7 |

## Tablas vacías (39)

Ordenadas por referencias en el código: las de arriba son las que más importan,
porque hay código escrito contra ellas.

| tabla | filas | refs en código |
|---|---:|---:|
| `projects` | 0 | 20 |
| `project_collaborators` | 0 | 13 |
| `instructor_certifications` | 0 | 10 |
| `bookmarks` | 0 | 9 |
| `course_reviews` | 0 | 9 |
| `lesson_comments` | 0 | 9 |
| `notes` | 0 | 9 |
| `invites` | 0 | 8 |
| `entitlements` | 0 | 7 |
| `project_updates` | 0 | 7 |
| `project_reviews` | 0 | 6 |
| `referral_links` | 0 | 6 |
| `mentor_monthly_stats` | 0 | 4 |
| `mentor_points` | 0 | 4 |
| `instructor_exam_attempts` | 0 | 3 |
| `instructor_exam_questions` | 0 | 3 |
| `mentor_applications` | 0 | 3 |
| `user_notes` | 0 | 3 |
| `mentor_application_votes` | 0 | 2 |
| `user_selected_paths` | 0 | 2 |
| `course_final_quiz_attempts` | 0 | 1 |
| `mentor_warnings` | 0 | 1 |
| `course_certificates` | 0 | — |
| `course_purchases` | 0 | — |
| `course_quizzes` | 0 | — |
| `instructor_payouts` | 0 | — |
| `mentor_leaves` | 0 | — |
| `promo_code_uses` | 0 | — |
| `promo_codes` | 0 | — |
| `referral_attributions` | 0 | — |
| `referral_clicks` | 0 | — |
| `referral_conversions` | 0 | — |
| `reputation_history` | 0 | — |
| `revenue_transactions` | 0 | — |
| `subscription_points` | 0 | — |
| `user_course_progress` | 0 | — |
| `user_events` | 0 | — |
| `user_feedback` | 0 | — |
| `user_lesson_progress` | 0 | — |

## Vistas (6)

Las migraciones declaran **9** vistas; solo existen estas 6. No existen
`message_reports_summary`, `most_reported_users` ni `users_with_roles`.

| vista | filas |
|---|---:|
| `user_incident_summary` | 2 |
| `proposals_with_details` | 1 |
| `instructor_revenue_details` | 0 |
| `instructor_referral_stats` | 0 |
| `referral_link_performance` | 0 |
| `message_flags_summary` | 3 |

## Lo que el código usa y no está

| tabla | refs | estado |
|---|---:|---|
| `avatars` | 4 | **no existe**. Es un bucket de Storage, no una tabla: las referencias son a `storage.from('avatars')`, no a una tabla de `public`. Falso positivo del grep. |

## Tablas con datos que el código no menciona nunca

| tabla | filas | qué parece ser |
|---|---:|---|
| `level_thresholds` | 10 | umbrales de nivel. La 039 los movió a código (`DEFAULT_LEVEL_RULES`), así que la tabla quedó como registro |
| `mentor_config` | 10 | configuración del bloque de mentorías, parado |
| `xp_actions` | 7 | catálogo de acciones que dan XP; el código las tiene en `lib/gamification` |
| `pricing_plans` | 2 | plan Premium de 23 € que nunca existió; `/pricing` dejó de leerla en la #220 |
| `subscriptions` | 1 | fila de prueba |

---

# Tres tablas vacías que el código SÍ debería estar usando

Esto no es limpieza pendiente: son tres casos en los que el código lee o escribe
en una tabla vacía **mientras los datos están en otra**.

## 1. Notas de lección: tres tablas, y la viva está vacía

| tabla | filas | columnas | quién la toca |
|---|---:|---|---|
| `user_notes` | **0** | `lesson_id, note_text` | **`/api/notes`**, que es la que llama la interfaz |
| `user_lesson_notes` | **2** | `course_id, lesson_id, content` | solo métricas de admin y `reset-course` |
| `notes` | 0 | `lesson_id, content, video_timestamp_seconds` | `/api/lesson-notes`, **que no llama nadie** |

`LessonNotes.tsx` y `LessonNotesPanel.tsx` llaman a `/api/notes`, que escribe en
`user_notes`. Pero **las dos notas reales que existen están en
`user_lesson_notes`**, que la interfaz no lee nunca. Quien escribió esas notas ya
no las ve.

Y `/api/lesson-notes` —cuatro métodos, 9 referencias a la tabla `notes`— **está
huérfana**: ningún componente la llama.

⚠️ **La migración 078 dice lo contrario y se equivoca.** Su comentario sobre
`user_notes` afirma: *«PARADA. Notas sueltas. Las notas que SÍ se usan son
user_lesson_notes, que cuelgan de una lección»*. Es falso en las dos mitades:
`user_notes` **tiene `lesson_id`** y es la que usa la interfaz hoy. Hay que
corregir ese comentario.

## 2. Ruta activa: se guarda en un sitio y se lee en otro

| dónde | estado |
|---|---|
| `users.active_path_id` | **8 de 24 usuarios la tienen puesta**. Ahí escribe `/api/user/select-path` |
| `user_selected_paths` | **0 filas**. Nadie escribe en ella: no hay un solo `insert` ni `upsert` en todo el repositorio |

Y hay **dos caminos vivos** que leen la tabla vacía:

- `lib/navigation/startRoute.ts` → `getStartRouteServer` decide entre
  `/dashboard` y `/dashboard/rutas`. Al no encontrar nada, manda **siempre** a
  `/dashboard/rutas`, incluso a quien ya eligió ruta.
- `lib/progress/getPathProgress.ts` → `getActivePathProgress` devuelve `null`
  **siempre**, así que el progreso de la ruta activa no se pinta nunca.

## 3. `path_courses` frente a `learning_path_courses`: las dos tienen datos

| tabla | filas | columnas | refs |
|---|---:|---|---:|
| `learning_path_courses` | **16** | `learning_path_id, position` | 10 |
| `path_courses` | **10** | `path_id, order_index` | 1 |

No es una duplicada vacía: **las dos están pobladas, con distinto número de
filas**. Y la única referencia a `path_courses` está en
`lib/progress/getPathProgress.ts:70`, es decir, el progreso de una ruta se
calcularía sobre un conjunto de cursos **distinto** del que define la ruta.

Hoy no se nota porque esa función muere antes, en el punto 2. Cuando se arregle
el punto 2, este empieza a dar números equivocados. **Se arreglan juntos.**

---

## Duplicados sin uso, para la tarea de limpieza

Estos no tienen el problema de arriba: están a 0 y nadie los toca.

| vacía y sin usar | la que se usa |
|---|---|
| `user_course_progress`, `user_lesson_progress` | `user_progress` (122 filas) |
| `course_certificates` | `certificates` (17 filas) |
| `course_purchases` | `course_enrollments` (49 filas) |
| `course_quizzes` | `quiz_questions` + `quiz_attempts`, por módulo |
