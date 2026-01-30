# AUDITORÍA COMPLETA DEL PROYECTO NODO360

**Fecha:** 30 de Enero de 2026
**Versión del proyecto:** 2.2
**Tipo de auditoría:** Solo lectura (sin modificaciones)

---

## RESUMEN EJECUTIVO

| Métrica | Cantidad |
|---------|----------|
| Páginas (page.tsx) | 94 |
| APIs (route.ts) | 76 |
| Componentes (.tsx) | 100+ |
| Migraciones SQL | 15 |
| Tablas de DB | 36 |
| Funciones RPC | 54 |
| Triggers | 23 |
| Views | 3 |
| Archivos lib/*.ts | 79 |

---

## 1. ESTRUCTURA DE PÁGINAS (94 páginas)

### 1.1 Páginas Públicas (app)
| Ruta | Archivo | Estado |
|------|---------|--------|
| `/` | `app/page.tsx` | ✅ |
| `/cursos` | `app/cursos/page.tsx` | ✅ |
| `/cursos/[slug]` | `app/cursos/[slug]/page.tsx` | ✅ |
| `/cursos/[slug]/[lessonSlug]` | `app/cursos/[slug]/[lessonSlug]/page.tsx` | ✅ |
| `/cursos/[slug]/quiz-final` | `app/cursos/[slug]/quiz-final/page.tsx` | ✅ |
| `/rutas` | `app/rutas/page.tsx` | ✅ |
| `/rutas/[slug]` | `app/rutas/[slug]/page.tsx` | ✅ |
| `/comunidad` | `app/comunidad/page.tsx` | ✅ |
| `/proyectos` | `app/proyectos/page.tsx` | ✅ |
| `/mentoria` | `app/mentoria/page.tsx` | ✅ |
| `/sobre-nosotros` | `app/sobre-nosotros/page.tsx` | ✅ |
| `/beta` | `app/beta/page.tsx` | ✅ |
| `/certificados/[certificateId]` | `app/certificados/[certificateId]/page.tsx` | ✅ |
| `/verificar/[verificationCode]` | `app/verificar/[verificationCode]/page.tsx` | ✅ |
| `/debug-env` | `app/debug-env/page.tsx` | ✅ (dev) |
| `/test-quiz` | `app/test-quiz/page.tsx` | ✅ (dev) |
| `/test-supabase` | `app/test-supabase/page.tsx` | ✅ (dev) |

### 1.2 Páginas Públicas (app/(public))
| Ruta | Archivo | Estado |
|------|---------|--------|
| `/privacidad` | `app/(public)/privacidad/page.tsx` | ✅ |
| `/terminos` | `app/(public)/terminos/page.tsx` | ✅ |
| `/cuenta-suspendida` | `app/(public)/cuenta-suspendida/page.tsx` | ✅ |
| `/instructores` | `app/(public)/instructores/page.tsx` | ✅ |
| `/instructores/[id]` | `app/(public)/instructores/[id]/page.tsx` | ✅ |
| `/mentores` | `app/(public)/mentores/page.tsx` | ✅ |
| `/mentores/[id]` | `app/(public)/mentores/[id]/page.tsx` | ✅ |
| `/gobernanza` | `app/(public)/gobernanza/page.tsx` | ✅ |
| `/gobernanza/[slug]` | `app/(public)/gobernanza/[slug]/page.tsx` | ✅ |
| `/gobernanza/nueva` | `app/(public)/gobernanza/nueva/page.tsx` | ✅ |
| `/gobernanza/mis-propuestas` | `app/(public)/gobernanza/mis-propuestas/page.tsx` | ✅ |
| `/gobernanza/historial` | `app/(public)/gobernanza/historial/page.tsx` | ✅ |

### 1.3 Páginas de Autenticación (app/(auth))
| Ruta | Archivo | Estado |
|------|---------|--------|
| `/login` | `app/(auth)/login/page.tsx` | ✅ |
| `/onboarding` | `app/(auth)/onboarding/page.tsx` | ✅ |
| `/auth/callback` | `app/(auth)/auth/callback/route.ts` | ✅ (route) |

### 1.4 Dashboard Usuario (app/(private)/dashboard)
| Ruta | Archivo | Estado |
|------|---------|--------|
| `/dashboard` | `app/(private)/dashboard/page.tsx` | ✅ |
| `/dashboard/cursos` | `app/(private)/dashboard/cursos/page.tsx` | ✅ |
| `/dashboard/cursos/[...rest]` | `app/(private)/dashboard/cursos/[...rest]/page.tsx` | ✅ |
| `/dashboard/rutas` | `app/(private)/dashboard/rutas/page.tsx` | ✅ |
| `/dashboard/rutas/[routeSlug]` | `app/(private)/dashboard/rutas/[routeSlug]/page.tsx` | ✅ |
| `/dashboard/certificados` | `app/(private)/dashboard/certificados/page.tsx` | ✅ |
| `/dashboard/progreso` | `app/(private)/dashboard/progreso/page.tsx` | ✅ |
| `/dashboard/badges` | `app/(private)/dashboard/badges/page.tsx` | ✅ |
| `/dashboard/leaderboard` | `app/(private)/dashboard/leaderboard/page.tsx` | ✅ |
| `/dashboard/guardados` | `app/(private)/dashboard/guardados/page.tsx` | ✅ |
| `/dashboard/notas` | `app/(private)/dashboard/notas/page.tsx` | ✅ |
| `/dashboard/mensajes` | `app/(private)/dashboard/mensajes/page.tsx` | ✅ |
| `/dashboard/mensajes/[id]` | `app/(private)/dashboard/mensajes/[id]/page.tsx` | ✅ |
| `/dashboard/perfil` | `app/(private)/dashboard/perfil/page.tsx` | ✅ |
| `/dashboard/perfil/cambiar-password` | `app/(private)/dashboard/perfil/cambiar-password/page.tsx` | ✅ |
| `/dashboard/configuracion` | `app/(private)/dashboard/configuracion/page.tsx` | ✅ |

### 1.5 Dashboard Instructor (app/(private)/dashboard/instructor)
| Ruta | Archivo | Estado |
|------|---------|--------|
| `/dashboard/instructor` | `app/(private)/dashboard/instructor/page.tsx` | ✅ |
| `/dashboard/instructor/cursos` | `app/(private)/dashboard/instructor/cursos/page.tsx` | ✅ |
| `/dashboard/instructor/cursos/nuevo` | `app/(private)/dashboard/instructor/cursos/nuevo/page.tsx` | ✅ |
| `/dashboard/instructor/cursos/[courseId]` | `app/(private)/dashboard/instructor/cursos/[courseId]/page.tsx` | ✅ |
| `/dashboard/instructor/cursos/[courseId]/preview` | `app/(private)/dashboard/instructor/cursos/[courseId]/preview/page.tsx` | ✅ |
| `/dashboard/instructor/cursos/[courseId]/modulos` | `app/(private)/dashboard/instructor/cursos/[courseId]/modulos/page.tsx` | ✅ |
| `/dashboard/instructor/cursos/[courseId]/modulos/nuevo` | `app/(private)/dashboard/instructor/cursos/[courseId]/modulos/nuevo/page.tsx` | ✅ |
| `/dashboard/instructor/cursos/[courseId]/modulos/[moduleId]` | `app/(private)/dashboard/instructor/cursos/[courseId]/modulos/[moduleId]/page.tsx` | ✅ |
| `/dashboard/instructor/cursos/[courseId]/modulos/[moduleId]/lecciones` | `app/(private)/dashboard/instructor/cursos/[courseId]/modulos/[moduleId]/lecciones/page.tsx` | ✅ |
| `/dashboard/instructor/cursos/[courseId]/modulos/[moduleId]/lecciones/nueva` | `app/(private)/dashboard/instructor/cursos/[courseId]/modulos/[moduleId]/lecciones/nueva/page.tsx` | ✅ |
| `/dashboard/instructor/cursos/[courseId]/modulos/[moduleId]/lecciones/[lessonId]` | `app/(private)/dashboard/instructor/cursos/[courseId]/modulos/[moduleId]/lecciones/[lessonId]/page.tsx` | ✅ |
| `/dashboard/instructor/referidos` | `app/(private)/dashboard/instructor/referidos/page.tsx` | ✅ |
| `/dashboard/instructor/referidos/nuevo` | `app/(private)/dashboard/instructor/referidos/nuevo/page.tsx` | ✅ |
| `/dashboard/instructor/estadisticas` | `app/(private)/dashboard/instructor/estadisticas/page.tsx` | ✅ |
| `/dashboard/instructor/examen/[examId]` | `app/(private)/dashboard/instructor/examen/[examId]/page.tsx` | ✅ |
| `/dashboard/instructor/examen/[examId]/intento` | `app/(private)/dashboard/instructor/examen/[examId]/intento/page.tsx` | ✅ |
| `/dashboard/instructor/examen/[examId]/resultado/[attemptId]` | `app/(private)/dashboard/instructor/examen/[examId]/resultado/[attemptId]/page.tsx` | ✅ |

### 1.6 Dashboard Mentor (app/(private)/dashboard/mentor)
| Ruta | Archivo | Estado |
|------|---------|--------|
| `/dashboard/mentor` | `app/(private)/dashboard/mentor/page.tsx` | ✅ |
| `/dashboard/mentor/aplicar` | `app/(private)/dashboard/mentor/aplicar/page.tsx` | ✅ |
| `/dashboard/mentor/cursos/pendientes` | `app/(private)/dashboard/mentor/cursos/pendientes/page.tsx` | ✅ |
| `/dashboard/mentor/cursos/pendientes/[id]` | `app/(private)/dashboard/mentor/cursos/pendientes/[id]/page.tsx` | ✅ |
| `/gobernanza/mentores` | `app/(private)/gobernanza/mentores/page.tsx` | ✅ |

### 1.7 Panel Admin (app/(private)/admin)
| Ruta | Archivo | Estado |
|------|---------|--------|
| `/admin` | `app/(private)/admin/page.tsx` | ✅ |
| `/admin/estadisticas` | `app/(private)/admin/estadisticas/page.tsx` | ✅ |
| `/admin/usuarios` | `app/(private)/admin/usuarios/page.tsx` | ✅ |
| `/admin/usuarios/[id]` | `app/(private)/admin/usuarios/[id]/page.tsx` | ✅ |
| `/admin/cursos` | `app/(private)/admin/cursos/page.tsx` | ✅ |
| `/admin/cursos/nuevo` | `app/(private)/admin/cursos/nuevo/page.tsx` | ✅ |
| `/admin/cursos/pendientes` | `app/(private)/admin/cursos/pendientes/page.tsx` | ✅ |
| `/admin/cursos/pendientes/[id]` | `app/(private)/admin/cursos/pendientes/[id]/page.tsx` | ✅ |
| `/admin/cursos/[id]` | `app/(private)/admin/cursos/[id]/page.tsx` | ✅ |
| `/admin/cursos/[id]/modulos` | `app/(private)/admin/cursos/[id]/modulos/page.tsx` | ✅ |
| `/admin/cursos/[id]/modulos/nuevo` | `app/(private)/admin/cursos/[id]/modulos/nuevo/page.tsx` | ✅ |
| `/admin/cursos/[id]/modulos/[moduleId]` | `app/(private)/admin/cursos/[id]/modulos/[moduleId]/page.tsx` | ✅ |
| `/admin/cursos/[id]/modulos/[moduleId]/lecciones` | `app/(private)/admin/cursos/[id]/modulos/[moduleId]/lecciones/page.tsx` | ✅ |
| `/admin/cursos/[id]/modulos/[moduleId]/lecciones/nueva` | `app/(private)/admin/cursos/[id]/modulos/[moduleId]/lecciones/nueva/page.tsx` | ✅ |
| `/admin/cursos/[id]/modulos/[moduleId]/lecciones/[lessonId]` | `app/(private)/admin/cursos/[id]/modulos/[moduleId]/lecciones/[lessonId]/page.tsx` | ✅ |
| `/admin/invitaciones` | `app/(private)/admin/invitaciones/page.tsx` | ✅ |
| `/admin/anuncios` | `app/(private)/admin/anuncios/page.tsx` | ✅ |
| `/admin/gobernanza` | `app/(private)/admin/gobernanza/page.tsx` | ✅ |
| `/admin/gamificacion` | `app/(private)/admin/gamificacion/page.tsx` | ✅ |
| `/admin/gamificacion/hitos` | `app/(private)/admin/gamificacion/hitos/page.tsx` | ✅ |
| `/admin/gamificacion/hitos/nuevo` | `app/(private)/admin/gamificacion/hitos/nuevo/page.tsx` | ✅ |
| `/admin/gamificacion/hitos/[id]` | `app/(private)/admin/gamificacion/hitos/[id]/page.tsx` | ✅ |
| `/admin/configuracion` | `app/(private)/admin/configuracion/page.tsx` | ✅ |
| `/admin/feedback` | `app/(private)/admin/feedback/page.tsx` | ✅ |
| `/admin/reportes` | `app/(private)/admin/reportes/page.tsx` | ✅ |

---

## 2. RUTAS API (76 endpoints)

### 2.1 APIs de Autenticación
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/auth/logout` | POST | Cerrar sesión |
| `/auth/callback` | GET | OAuth callback |

### 2.2 APIs de Usuario
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/user/avatar` | GET/PATCH | Obtener/actualizar avatar |
| `/api/user/avatar/upload` | POST | Subir avatar |
| `/api/user/select-path` | POST | Seleccionar ruta de aprendizaje |

### 2.3 APIs de Cursos
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/enroll` | POST | Inscribirse a curso |
| `/api/continue` | GET | Continuar aprendiendo |
| `/api/bookmarks` | GET/POST/DELETE | Gestión de favoritos |
| `/api/progress` | POST | Actualizar progreso |
| `/api/notes` | GET/POST/DELETE | Notas de usuario |
| `/api/lesson-notes` | GET/POST/PATCH/DELETE | Notas por lección |

### 2.4 APIs de Quiz
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/quiz/questions` | GET | Obtener preguntas |
| `/api/quiz/status` | GET | Estado del quiz |
| `/api/quiz/submit` | POST | Enviar respuestas |

### 2.5 APIs de Certificados
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/certificates/generate` | POST | Generar certificado |

### 2.6 APIs de Gamificación
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/gamification/stats` | GET | Estadísticas del usuario |
| `/api/gamification/leaderboard` | GET | Tabla de líderes |

### 2.7 APIs de Gobernanza
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/governance/proposals` | GET/POST | Listar/crear propuestas |
| `/api/governance/proposals/[id]/vote` | POST | Votar propuesta |
| `/api/governance/admin` | GET/PATCH | Admin de gobernanza |

### 2.8 APIs de Mensajería
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/messages/conversations` | GET/POST | Conversaciones |
| `/api/messages/[conversationId]` | GET/POST | Mensajes de conversación |
| `/api/messages/[conversationId]/read` | POST | Marcar como leído |
| `/api/messages/unread` | GET | Mensajes no leídos |

### 2.9 APIs de Notificaciones
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/notifications` | GET | Listar notificaciones |
| `/api/notifications/[id]` | PATCH/DELETE | Gestionar notificación |
| `/api/notifications/read-all` | POST | Marcar todas como leídas |

### 2.10 APIs de Instructor
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/instructor/courses/[id]/duplicate` | POST | Duplicar curso |
| `/api/instructor/courses/[id]/status` | PATCH | Cambiar estado |
| `/api/instructor/courses/[id]/submit-review` | POST | Enviar a revisión |
| `/api/instructor/referral` | GET/POST | Sistema de referidos |
| `/api/instructor/referral/[id]` | GET/PATCH/DELETE | Gestionar referido |
| `/api/instructor/referral/stats` | GET | Estadísticas referidos |
| `/api/instructor/students/stats` | GET | Estadísticas de alumnos |
| `/api/instructor/exams` | GET | Exámenes disponibles |
| `/api/instructor/exams/[examId]/attempt` | POST | Iniciar intento |
| `/api/instructor/exams/[examId]/submit` | POST | Enviar examen |

### 2.11 APIs de Mentor
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/mentor/apply` | POST | Aplicar como mentor |
| `/api/mentor/applications` | GET | Listar aplicaciones |
| `/api/mentor/applications/[id]/vote` | POST | Votar aplicación |

### 2.12 APIs de Admin
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/admin/badges` | GET/POST | Gestión de badges |
| `/api/admin/badges/[id]` | PATCH/DELETE | Editar/eliminar badge |
| `/api/admin/courses/[id]` | GET/PATCH/DELETE | Gestión de curso |
| `/api/admin/courses/[id]/paths` | GET/PATCH | Rutas del curso |
| `/api/admin/courses/[id]/publish` | POST | Publicar curso |
| `/api/admin/courses/[id]/refresh-counts` | POST | Refrescar contadores |
| `/api/admin/courses/refresh-all-counts` | POST | Refrescar todos |
| `/api/admin/lessons/[id]` | PATCH/DELETE | Gestión de lección |
| `/api/admin/lessons/reorder` | POST | Reordenar lecciones |
| `/api/admin/modules/[id]` | PATCH/DELETE | Gestión de módulo |
| `/api/admin/modules/reorder` | POST | Reordenar módulos |
| `/api/admin/learning-paths` | GET | Rutas de aprendizaje |
| `/api/admin/quiz` | POST/PATCH | Gestión de quizzes |
| `/api/admin/users/[id]` | GET/PATCH | Gestión de usuario |
| `/api/admin/users/[id]/courses` | GET | Cursos del usuario |
| `/api/admin/users/[id]/reset-course` | POST | Resetear progreso |
| `/api/admin/users/[id]/role` | PATCH | Cambiar rol |
| `/api/admin/users/[id]/xp-events` | GET | Historial XP |
| `/api/admin/users/beta` | GET/PATCH | Usuarios beta |
| `/api/admin/xp/adjust` | POST | Ajustar XP |
| `/api/admin/invites` | GET/POST/DELETE | Invitaciones |
| `/api/admin/announcements` | GET/POST/DELETE | Anuncios |
| `/api/admin/roles` | GET/POST | Gestión de roles |
| `/api/admin/settings` | GET/PATCH | Configuración |
| `/api/admin/students/stats` | GET | Estadísticas alumnos |
| `/api/admin/metrics` | GET | Métricas KPI |

### 2.13 Otras APIs
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/newsletter` | POST | Suscripción newsletter |
| `/api/mentorship` | POST | Solicitud mentoría |
| `/api/feedback` | POST | Enviar feedback |
| `/api/invites/validate` | POST | Validar invitación |
| `/api/invites/consume` | POST | Consumir invitación |
| `/r/[code]` | GET | Redirect referidos |

---

## 3. MIGRACIONES SQL (15 archivos)

### Migración 003: Learning Paths
**Tablas:**
- `learning_paths` - Rutas de aprendizaje
- `path_courses` - Relación ruta-curso
- `user_selected_paths` - Rutas seleccionadas por usuario

### Migración 004: Gamification System
**Tablas:**
- `user_gamification_stats` - Estadísticas de gamificación
- `xp_events` - Eventos de XP
- `badges` - Insignias disponibles
- `user_badges` - Insignias obtenidas

**Funciones:**
- `calculate_level_from_xp` - Calcular nivel
- `calculate_xp_to_next_level` - XP necesario para subir
- `update_user_stats_on_xp` - Actualizar stats
- `create_user_stats` - Crear stats iniciales
- `award_xp_on_lesson_complete` - Otorgar XP por lección
- `check_and_award_badges` - Verificar y otorgar badges
- `check_badges_on_xp` - Verificar badges por XP

**Triggers:** 4 triggers de gamificación

### Migración 005: User Lesson Notes and Final Quiz
**Tablas:**
- `user_lesson_notes` - Notas por lección
- `course_final_quiz_attempts` - Intentos de quiz final

### Migración 006: Course Counters Triggers
**Funciones:**
- `update_course_module_count` - Contador de módulos
- `update_lesson_counts` - Contador de lecciones

### Migración 007: Subscriptions and Purchases
**Tablas:**
- `pricing_plans` - Planes de precios
- `subscriptions` - Suscripciones activas
- `course_purchases` - Compras de cursos
- `revenue_transactions` - Transacciones
- `subscription_points` - Puntos de suscripción

**Funciones:**
- `has_premium_access` - Verificar acceso premium
- `has_course_access` - Verificar acceso a curso
- `set_grace_period` - Período de gracia

### Migración 008: Instructor System
**Tablas:**
- `instructor_exams` - Exámenes de instructor
- `instructor_exam_models` - Modelos de examen
- `instructor_exam_questions` - Preguntas
- `instructor_exam_attempts` - Intentos de examen
- `instructor_certifications` - Certificaciones
- `instructor_profiles` - Perfiles de instructor

**Funciones:**
- `can_attempt_exam` - Verificar elegibilidad
- `select_exam_model` - Seleccionar modelo
- `generate_instructor_cert_number` - Generar número certificado
- `issue_instructor_certification` - Emitir certificación
- `check_expiring_certifications` - Verificar expiración
- `expire_certifications` - Expirar certificaciones
- `calculate_exam_attempt_result` - Calcular resultado

### Migración 009: Mentor System
**Tablas:**
- `mentor_config` - Configuración de mentores
- `mentor_points` - Puntos de mentor
- `mentor_applications` - Aplicaciones
- `mentor_application_votes` - Votos
- `mentor_monthly_stats` - Estadísticas mensuales
- `mentor_warnings` - Advertencias
- `mentor_leaves` - Licencias

**Funciones:**
- `calculate_mentor_plazas` - Calcular plazas disponibles
- `get_mentor_points` - Obtener puntos
- `can_apply_mentor` - Verificar elegibilidad
- `submit_mentor_application` - Enviar aplicación
- `vote_mentor_application` - Votar aplicación
- `resolve_mentor_application` - Resolver aplicación
- `admin_decide_mentor_application` - Decisión admin
- `remove_mentor_status` - Remover status
- `evaluate_mentor_monthly` - Evaluación mensual
- `request_mentor_leave` - Solicitar licencia
- `resolve_expired_mentor_votes` - Resolver votos expirados
- `get_mentor_leave_balance` - Balance de licencias

### Migración 010: Admin Role Assignment
**Funciones:**
- `admin_assign_instructor` - Asignar instructor
- `admin_assign_mentor` - Asignar mentor
- `admin_revoke_instructor` - Revocar instructor
- `admin_revoke_mentor` - Revocar mentor
- `admin_list_assignable_users` - Listar usuarios

### Migración 011: Instructor Requirements
**Funciones:**
- `get_path_completion_status` - Estado de ruta
- `get_path_quiz_status` - Estado de quiz
- `get_exam_eligibility_details` - Detalles de elegibilidad

### Migración 012: Referral System
**Tablas:**
- `referral_links` - Enlaces de referido
- `referral_clicks` - Clicks registrados
- `referral_conversions` - Conversiones
- `promo_codes` - Códigos promocionales
- `promo_code_uses` - Usos de códigos
- `referral_attributions` - Atribuciones

**Funciones:**
- `generate_referral_code` - Generar código
- `track_referral_click` - Registrar click
- `track_referral_conversion` - Registrar conversión
- `validate_promo_code` - Validar código
- `apply_promo_code` - Aplicar código
- `get_or_create_referral_attribution` - Atribución
- `cleanup_expired_attributions` - Limpieza

**Views:**
- `instructor_referral_stats` - Estadísticas de referidos
- `referral_link_performance` - Rendimiento de enlaces

### Migración 013: Course Approval System
- Añade columnas `status`, `submitted_at`, `reviewed_by`, `reviewed_at`, `rejection_reason`
- Índices para búsqueda eficiente

### Migración 014: Instructor Content RLS
- Actualiza políticas RLS para instructores

### Migración 015: Course Modification Trigger
**Funciones:**
- `check_course_modification` - Verificar modificaciones
- `admin_update_course` - Actualización admin

**Triggers:**
- `trigger_course_modification` - Detectar cambios

### Migración 016: Commission System
**Tablas:**
- `system_settings` - Configuración del sistema
- `instructor_payouts` - Pagos a instructores

**Funciones:**
- `process_course_purchase_commission` - Procesar comisión
- `get_instructor_earnings_summary` - Resumen de ganancias
- `trigger_process_purchase_commission` - Trigger de comisión

**Views:**
- `instructor_revenue_details` - Detalles de ingresos

### Migración 019: Mentor Course Review
**Tablas:**
- `course_reviews` - Revisiones de cursos

**Funciones:**
- `submit_course_review` - Enviar revisión
- `get_course_review_history` - Historial de revisiones

---

## 4. COMPONENTES PRINCIPALES (100+)

### 4.1 Admin Components
- `AdminHeader.tsx` - Cabecera admin
- `AdminSidebar.tsx` - Sidebar admin
- `CourseAdminCard.tsx` - Tarjeta de curso
- `CourseForm.tsx` - Formulario de curso
- `CoursePathsSelector.tsx` - Selector de rutas
- `CoursesFilters.tsx` - Filtros de cursos
- `CoursesList.tsx` - Lista de cursos
- `DeleteCourseButton.tsx` - Botón eliminar
- `DeleteLessonButton.tsx` - Eliminar lección
- `DeleteModuleButton.tsx` - Eliminar módulo
- `PublishCourseButton.tsx` - Publicar curso
- `ReorderLessonButtons.tsx` - Reordenar lecciones
- `ReorderModuleButtons.tsx` - Reordenar módulos
- `ResetCourseSection.tsx` - Resetear curso
- `UserXPHistory.tsx` - Historial XP

### 4.2 Course Components
- `CourseGrid.tsx` - Grid de cursos
- `CourseModulesPreview.tsx` - Preview de módulos
- `CourseSidebar.tsx` - Sidebar del curso
- `CourseTabs.tsx` - Tabs del curso
- `EnrollButton.tsx` - Botón inscribirse
- `LessonList.tsx` - Lista de lecciones
- `LessonNavigation.tsx` - Navegación de lecciones
- `MaterialCard.tsx` - Tarjeta de material
- `ModuleCard.tsx` - Tarjeta de módulo
- `ModuleLockBadge.tsx` - Badge de bloqueo
- `ModuleQuizSection.tsx` - Sección de quiz
- `ModuleStatusBadge.tsx` - Estado del módulo
- `PremiumUpgradeBanner.tsx` - Banner premium
- `RelatedCourses.tsx` - Cursos relacionados
- `RelatedLinks.tsx` - Enlaces relacionados
- `SimpleLessonSidebar.tsx` - Sidebar simple
- `UpgradeBanner.tsx` - Banner upgrade
- `UserProgressWidget.tsx` - Widget de progreso

### 4.3 Lesson Components
- `AccessGuard.tsx` - Guardia de acceso
- `CodeBlock.tsx` - Bloque de código
- `CommunityButton.tsx` - Botón comunidad
- `CompleteButton.tsx` - Botón completar
- `CourseCompletionModal.tsx` - Modal de completación
- `InteractiveList.tsx` - Lista interactiva
- `LessonCallout.tsx` - Callout de lección
- `LessonFooter.tsx` - Footer de lección
- `LessonLockIndicator.tsx` - Indicador de bloqueo
- `LessonNavigation.tsx` - Navegación
- `LessonNotes.tsx` - Notas de lección
- `LessonNotesPanel.tsx` - Panel de notas
- `LessonPageWrapper.tsx` - Wrapper de página
- `LessonRenderer.tsx` - Renderer de contenido
- `LessonResources.tsx` - Recursos
- `LessonResourcesPanel.tsx` - Panel de recursos
- `LessonShell.tsx` - Shell de lección
- `LessonStatus.tsx` - Estado de lección
- `LessonTabs.tsx` - Tabs de lección
- `LessonVideo.tsx` - Video de lección
- `NextLessonButton.tsx` - Botón siguiente
- `QuizBlock.tsx` - Bloque de quiz
- `ResourceUploader.tsx` - Subir recursos
- `SlidesEmbed.tsx` - Embed de slides
- `TableOfContents.tsx` - Índice
- `VideoPlayer.tsx` - Reproductor de video

### 4.4 Certificate Components
- `CertificateCard.tsx` - Tarjeta de certificado
- `CertificateDownload.tsx` - Descargar certificado
- `CertificatePreview.tsx` - Preview
- `CertificateQR.tsx` - Código QR
- `DownloadPDFButton.tsx` - Botón PDF
- `ShareButtons.tsx` - Botones compartir

### 4.5 Gamification Components
- `BadgeDisplay.tsx` - Mostrar badges
- `BadgeProvider.tsx` - Provider de badges
- `BadgeToast.tsx` - Toast de badge
- `Leaderboard.tsx` - Tabla de líderes
- `StreakIndicator.tsx` - Indicador de racha

### 4.6 Navigation Components
- `AppShell.tsx` - Shell de aplicación
- `Footer.tsx` - Footer principal
- `FooterMinimal.tsx` - Footer mínimo
- `GlobalHeader.tsx` - Header global
- `SiteHeader/` - Header del sitio

### 4.7 Auth Components
- `LoginPrompt.tsx` - Prompt de login
- `LogoutButton.tsx` - Botón logout

### 4.8 Messages Components
- `MessageBell.tsx` - Campana de mensajes

### 4.9 Instructor Components
- `LearningPathSelect.tsx` - Selector de ruta

### 4.10 Forms Components
- `MentorshipForm.tsx` - Formulario mentoría

---

## 5. VERIFICACIÓN DE ENLACES

### 5.1 Enlaces Internos Verificados
Total de enlaces internos encontrados: 200+

### 5.2 Enlaces Potencialmente Rotos
| Enlace | Ubicación | Estado |
|--------|-----------|--------|
| `/pricing` | `dashboard/instructor/page.tsx:425` | ⚠️ Página no existe |
| `/auth/reset-password` | `dashboard/configuracion/page.tsx:166` | ⚠️ Flujo diferente |

### 5.3 Enlaces Externos (no verificados)
- `mailto:team@nodo360.com`
- `mailto:soporte@nodo360.com`
- `mailto:legal@nodo360.com`
- `mailto:privacidad@nodo360.com`
- `https://discord.gg/nodo360`
- `https://discord.gg/qjQUC7e4`
- `https://t.me/nodo360`
- `https://twitter.com/nodo360`

---

## 6. LIBRERÍAS Y UTILIDADES (lib/)

### 6.1 Autenticación
- `lib/auth/getUser.ts` - Obtener usuario actual
- `lib/auth/requireAuth.ts` - Middleware de autenticación
- `lib/auth/requireInstructor.ts` - Middleware instructor
- `lib/auth/requireMentor.ts` - Middleware mentor
- `lib/auth/redirect-after-login.ts` - Redirección post-login
- `lib/auth/error-messages.ts` - Mensajes de error

### 6.2 Base de Datos
- `lib/db/queries.ts` - Queries generales
- `lib/db/courses-queries.ts` - Queries de cursos
- `lib/db/courses-queries-client.ts` - Queries cliente
- `lib/db/enrollments.ts` - Inscripciones
- `lib/db/learning-paths.ts` - Rutas de aprendizaje

### 6.3 Supabase
- `lib/supabase/client.ts` - Cliente browser
- `lib/supabase/server.ts` - Cliente server
- `lib/supabase/admin.ts` - Cliente admin
- `lib/supabase/helpers.ts` - Helpers
- `lib/supabase/types.ts` - Tipos generados

### 6.4 Gamificación
- `lib/gamification/awardXP.ts` - Otorgar XP
- `lib/gamification/checkAndAwardBadges.ts` - Verificar badges
- `lib/gamification/updateStreak.ts` - Actualizar racha
- `lib/gamification/levels.ts` - Sistema de niveles

### 6.5 Progreso
- `lib/progress/checkLessonAccess.ts` - Acceso a lección
- `lib/progress/checkModuleAccess.ts` - Acceso a módulo
- `lib/progress/getCourseProgress.ts` - Progreso del curso
- `lib/progress/getPathProgress.ts` - Progreso de ruta
- `lib/progress/unlockNextModule.ts` - Desbloquear módulo
- `lib/progress-manager.ts` - Manager de progreso

### 6.6 Certificados
- `lib/certificates/createCertificate.ts` - Crear certificado
- `lib/certificates/generateCertificate.ts` - Generar PDF
- `lib/certificates/generator.ts` - Generador
- `lib/certificates/storage.ts` - Almacenamiento

### 6.7 Email
- `lib/email/welcome-email.ts` - Email de bienvenida
- `lib/email/badge-earned.ts` - Email de badge
- `lib/email/course-completed.ts` - Email de curso completado
- `lib/email/course-approved.ts` - Email curso aprobado
- `lib/email/course-rejected.ts` - Email curso rechazado
- `lib/email/send-access-granted.ts` - Email acceso otorgado

### 6.8 Notificaciones
- `lib/notifications/index.ts` - Sistema de notificaciones
- `lib/notifications/broadcast.ts` - Broadcast
- `lib/notifications/discord.ts` - Webhook Discord
- `lib/notifications/telegram.ts` - Webhook Telegram

### 6.9 Quiz
- `lib/quiz/checkCourseQuiz.ts` - Verificar quiz
- `lib/quiz/validateQuizAttempt.ts` - Validar intento
- `lib/quiz/validateQuizSubmission.ts` - Validar envío

### 6.10 Roles
- `lib/roles/getUserRoles.ts` - Obtener roles
- `lib/roles/index.ts` - Exports

### 6.11 Admin
- `lib/admin/actions.ts` - Acciones admin
- `lib/admin/auth.ts` - Auth admin
- `lib/admin/publish-rules.ts` - Reglas publicación
- `lib/admin/queries.ts` - Queries admin
- `lib/admin/utils.ts` - Utilidades

### 6.12 Otros
- `lib/utils.ts` - Utilidades generales
- `lib/env.ts` - Variables de entorno
- `lib/ratelimit.ts` - Rate limiting
- `lib/brand-config.ts` - Configuración de marca
- `lib/community-config.ts` - Config comunidad
- `lib/design-tokens.ts` - Tokens de diseño
- `lib/structured-data.ts` - Datos estructurados SEO
- `lib/settings/defaults.ts` - Defaults
- `lib/settings/getSetting.ts` - Obtener config

---

## 7. ESTADO DE FEATURES

### 7.1 Features Completas ✅
- [x] Autenticación (Magic Link, OAuth)
- [x] Onboarding de usuarios
- [x] Catálogo de cursos
- [x] Inscripción a cursos
- [x] Progreso de lecciones
- [x] Sistema de módulos con bloqueo secuencial
- [x] Quiz por módulo
- [x] Quiz final de curso
- [x] Certificados PDF con QR
- [x] Sistema de XP y niveles
- [x] Badges/insignias
- [x] Leaderboard
- [x] Rutas de aprendizaje
- [x] Notas de lección
- [x] Favoritos/bookmarks
- [x] Panel de instructor
- [x] Creación de cursos (instructor)
- [x] Sistema de revisión de cursos
- [x] Panel de mentor
- [x] Votación de aplicaciones mentor
- [x] Sistema de referidos
- [x] Gobernanza (propuestas y votaciones)
- [x] Sistema de mensajería
- [x] Notificaciones
- [x] Panel admin completo
- [x] Estadísticas KPI
- [x] Invitaciones beta
- [x] Anuncios del sistema
- [x] Examen de certificación instructor

### 7.2 Features Parciales ⚠️
- [ ] Sistema de pagos/suscripciones (tablas existen, UI incompleta)
- [ ] Página de precios (`/pricing` no existe)
- [ ] Puntos de suscripción (funcionalidad pendiente)

### 7.3 Features Planificadas 📋
- [ ] Sesiones de mentoría 1:1 (sin tablas)
- [ ] Chat en tiempo real
- [ ] Foro de discusión por curso
- [ ] Sistema de comisiones automático (parcial)

---

## 8. NOTAS TÉCNICAS

### 8.1 Stack Tecnológico
- **Framework:** Next.js 16 (App Router)
- **React:** 19
- **TypeScript:** 5
- **CSS:** Tailwind CSS v4
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Almacenamiento:** Supabase Storage
- **Deploy:** Vercel (asumido)

### 8.2 Patrones Arquitectónicos
- Server Components por defecto
- Client Components con 'use client'
- Route Handlers para API
- Server Actions para mutaciones
- Layouts anidados
- Grupos de rutas (auth), (private), (public)
- Middleware para protección de rutas

### 8.3 Convenciones de Código
- Componentes en PascalCase
- Archivos en kebab-case
- Types/interfaces con prefijo I (parcialmente)
- Async/await para operaciones asíncronas
- Error handling con try/catch

---

## 9. RECOMENDACIONES

### 9.1 Alta Prioridad
1. Crear página `/pricing` o eliminar enlaces a ella
2. Verificar flujo de reset-password (`/auth/reset-password`)
3. Completar migraciones faltantes (017, 018)

### 9.2 Media Prioridad
1. Implementar sistema de pagos completo
2. Añadir tests automatizados
3. Documentar APIs con OpenAPI/Swagger

### 9.3 Baja Prioridad
1. Implementar sesiones de mentoría
2. Añadir chat en tiempo real
3. Crear foro de discusión

---

*Auditoría generada automáticamente el 30 de Enero de 2026*
