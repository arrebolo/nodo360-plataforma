# PROMPT MAESTRO - PROYECTO NODO360

## MISION DEL PROYECTO

**Nodo360** es una plataforma educativa de Bitcoin y Blockchain en espanol.

**Objetivo**: Crear una plataforma completa donde usuarios puedan:
- Explorar cursos estructurados (modulos -> lecciones)
- Inscribirse y seguir su progreso
- Ver videos educativos
- Tomar notas y marcar contenido importante
- Obtener certificados al completar cursos
- Certificarse como instructores
- Participar en gobernanza (mentores)
- Interactuar con la comunidad

**Propuesta de valor**: Educacion de calidad en espanol, con seguimiento personalizado, sistema de gamificacion y comunidad activa.

---

## METRICAS DEL PROYECTO (06/02/2026)

| Metrica | Valor |
|---------|-------|
| Rutas de App | 100+ |
| Migraciones SQL | 18 |
| Funciones DB | 27+ |
| Tablas Core | 38+ |
| Componentes | 61+ |
| APIs | 78 (Admin: 29) |

---

## HISTORIAL DE SESIONES

### 06/02/2026
- **Sistema de Comentarios en Lecciones - Fase 26**:
  - Migracion 017: tabla `lesson_comments` con RLS (SELECT usuarios ven no-ocultos, admin ve todo)
  - Indices en lesson_id+created_at y user_id
  - `lib/comments/index.ts`: funciones server-side (getCommentsByLesson, createComment, updateComment, hideComment, markAsAnswer, getCommentCount, getLessonCourseInfo)
  - API `/api/lessons/[lessonId]/comments` (GET + POST): listar y crear comentarios
  - API `/api/comments/[commentId]` (PATCH): editar contenido (autor), marcar respuesta (instructor/mentor/admin), ocultar (admin)
  - Componente `LessonComments` integrado en LessonPlayer (solo usuarios autenticados)
  - Badges de rol: Instructor, Mentor, Admin, Consejo
  - Feature "Respuesta util" para marcar comentarios destacados
  - Notificacion in-app `lesson_comment_new` al instructor cuando hay nuevo comentario
  - Types: `LessonComment`, `LessonCommentWithUser` en database.ts

### 05/02/2026
- **Sistema de Revision por Mentores - Fase 24**:
  - Migracion 016: reemplaza sistema viejo (019) con 2 aprobaciones
  - Tabla `course_reviews` con UNIQUE(course_id, mentor_id) y trigger `check_course_approval`
  - Enum `course_review_vote` (approve, request_changes)
  - Status `changes_requested` agregado a course_status
  - `lib/courses/reviews.ts`: funciones server-side (submitReview, getCourseReviews, resetCourseReviews, etc.)
  - API `/api/mentor/courses/review` (GET + POST): listar cursos pendientes y enviar voto
  - API `/api/instructor/courses/[id]/reviews` (GET): instructor ve reviews de sus cursos
  - Email template `course-changes-requested.ts` con comentarios de mentores
  - Notificacion in-app `course_changes_requested` via broadcast
  - Panel mentor actualizado: progreso X/2 aprobaciones, boton "Solicitar cambios"
  - InstructorCourseCard: status `changes_requested` (amber), boton "Editar y reenviar"
  - Submit-review actualizado: acepta reenvio desde `changes_requested`, limpia votos anteriores
  - Auto-publicacion al recibir 2a aprobacion (trigger SQL)

### 30/01/2026
- **Sistema de Mensajeria** completo:
  - Migracion 018: tablas `conversations` y `messages`
  - APIs: `/api/messages/conversations`, `/api/messages/[id]`, `/api/messages/unread`
  - Componentes: `ChatView`, `ConversationList`, `MessageBubble`, `MessageInput`, `MessageBell`
  - Paginas: `/dashboard/mensajes`, `/dashboard/mensajes/[id]`
  - Icono de mensajes en header con badge de no leidos
  - Boton "Enviar mensaje" funcional en perfiles de instructores
- **Certificados Automaticos**:
  - Migracion 017: trigger `auto_issue_course_certificate`
  - Genera certificado al completar curso al 100%
  - Funcion `backfill_missing_certificates()` para cursos ya completados
- **Estadisticas de Alumnos para Instructores**:
  - Pagina `/dashboard/instructor/estadisticas`
  - API `/api/instructor/students/stats`
  - Metricas: total alumnos, activos mes, tasa completacion, certificados
  - Tabla por curso y lista de inscripciones recientes
- Revenue share actualizado: 35/65 (instructor/plataforma), 40% con referidos
- **Sistema de Revision de Cursos por Mentores** (v1, reemplazado por Fase 24):
  - Migracion 019: tabla `course_reviews` y funcion `submit_course_review`
  - Paginas: `/dashboard/mentor/cursos/pendientes`, `/dashboard/mentor/cursos/pendientes/[id]`
  - Helper `requireMentor()` para autenticacion de mentores/admins

### 26/01/2026
- Merge de paginas publicas `/instructores` y `/mentores`
- Merge de seccion "Conecta con Expertos" en dashboard
- Migracion 010: funciones admin para asignar roles
- Migracion 011: requisitos adicionales para examen instructor
- 4 funciones SQL nuevas:
  - `can_attempt_exam()` - actualizada con 3 nuevos requisitos
  - `get_path_completion_status()` - cursos completados de ruta
  - `get_path_quiz_status()` - quizzes aprobados de ruta
  - `get_exam_eligibility_details()` - detalles para UI
- Columna `has_final_quiz` en tabla courses
- PRs mergeados: #54, #55

### 25/01/2026
- Sistema de examenes de instructor completo
- UI de certificaciones en dashboard/instructor
- APIs de examenes con timer y resultados

### 24/01/2026
- Sistema de suscripciones y compras (migracion 007)
- Sistema de instructor (migracion 008)
- Sistema de mentor (migracion 009)

---

## CONTEXTO TECNICO

### Stack Tecnologico
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5
- **Estilos**: Tailwind CSS v4 (tema oscuro glassmorphism)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticacion**: Supabase Auth
- **Deploy**: Vercel

### Arquitectura
```
Server Components (por defecto)
├── Obtienen datos de Supabase directamente
├── Renderizan en servidor (SEO, performance)
└── Pasan props a Client Components

Client Components ('use client')
├── Interactividad (forms, modals, etc.)
├── Estado del lado del cliente
└── Event handlers (onClick, onChange, etc.)
```

### Estructura de Datos CRITICA
**REGLA DE ORO**: `lesson.module.course` (SIEMPRE SINGULAR)

```typescript
// CORRECTO
const courseTitle = lesson.module.course.title

// INCORRECTO (rompera todo)
const courseTitle = lesson.modules.courses.title
```

---

## ESQUEMA DE BASE DE DATOS

### Migraciones SQL

| # | Archivo | Descripcion |
|---|---------|-------------|
| 003 | `003_learning_paths.sql` | Rutas de aprendizaje |
| 004 | `004_gamification_system.sql` | XP, badges, leaderboard |
| 005 | `005_user_lesson_notes_and_final_quiz.sql` | Notas y quiz final |
| 006 | `006_course_counters_triggers.sql` | Contadores automaticos |
| 007 | `007_subscriptions_purchases.sql` | Suscripciones premium |
| 008 | `008_instructor_system.sql` | Sistema de instructores |
| 009 | `009_mentor_system.sql` | Sistema de mentores |
| 010 | `010_admin_role_assignment.sql` | Asignacion de roles por admin |
| 011 | `011_instructor_requirements.sql` | Requisitos examen instructor |
| 017 | `017_student_certificates.sql` | Certificados automaticos al completar |
| 018 | `018_messaging_system.sql` | Sistema de mensajeria 1:1 |
| 019 | `019_mentor_course_review.sql` | Revision de cursos por mentores (reemplazado por 016) |
| 015e | `015_entitlements.sql` (docs/migrations/) | Sistema de entitlements para acceso premium |
| 016 | `016_mentor_course_reviews.sql` (docs/migrations/) | Revision de cursos: 2 aprobaciones, changes_requested, trigger auto-publish |
| 017c | `017_lesson_comments.sql` (docs/migrations/) | Comentarios en lecciones con RLS y moderacion |

### Funciones SQL Principales (27+ funciones)

| Funcion | Proposito |
|---------|-----------|
| `has_premium_access()` | Verifica suscripcion premium |
| `has_course_access()` | Verifica acceso a curso |
| `can_attempt_exam()` | Verifica elegibilidad para examen |
| `select_exam_model()` | Selecciona modelo aleatorio |
| `issue_instructor_certification()` | Emite certificacion |
| `get_path_completion_status()` | Estado de cursos completados |
| `get_path_quiz_status()` | Estado de quizzes aprobados |
| `get_exam_eligibility_details()` | Detalles de elegibilidad |
| `admin_assign_instructor()` | Admin asigna rol instructor |
| `admin_assign_mentor()` | Admin asigna rol mentor |
| `admin_revoke_instructor()` | Admin revoca instructor |
| `admin_revoke_mentor()` | Admin revoca mentor |
| `apply_for_mentor()` | Usuario aplica a mentor |
| `approve_mentor_application()` | Aprueba aplicacion |
| `remove_mentor_status()` | Remueve status mentor |
| `check_expiring_certifications()` | Certificaciones por expirar |
| `expire_certifications()` | Expira certificaciones |
| `auto_issue_course_certificate()` | Trigger: genera certificado al completar |
| `issue_course_certificate_manual()` | Emite certificado manualmente |
| `backfill_missing_certificates()` | Genera certificados faltantes |
| `get_or_create_conversation()` | Obtiene o crea conversacion |
| `get_unread_message_count()` | Cuenta mensajes no leidos |
| `mark_messages_as_read()` | Marca mensajes como leidos |
| `check_course_approval()` | Trigger: auto-publica curso con 2 aprobaciones o marca changes_requested |
| `update_course_review_updated_at()` | Trigger: actualiza updated_at en course_reviews |

### Tablas Core

**Usuarios y Roles:**
- `users` - Perfiles extendidos
- `user_roles` - Roles asignados (instructor, mentor, admin)
- `subscriptions` - Suscripciones premium

**Cursos:**
- `courses` - Cursos con `has_final_quiz`
- `modules` - Modulos de curso
- `lessons` - Lecciones
- `learning_paths` - Rutas de aprendizaje
- `path_courses` - Relacion ruta-curso

**Progreso:**
- `course_enrollments` - Inscripciones con `completed_at`
- `user_progress` - Progreso por leccion
- `course_final_quiz_attempts` - Intentos de quiz final

**Instructores:**
- `instructor_profiles` - Perfil publico
- `instructor_exams` - Examenes de certificacion
- `instructor_exam_models` - Modelos de examen (10 por examen)
- `instructor_exam_questions` - Preguntas (20 por modelo)
- `instructor_exam_attempts` - Intentos de examen
- `instructor_certifications` - Certificaciones emitidas

**Mentores:**
- `mentor_applications` - Solicitudes
- `mentor_points` - Puntos de merito
- `mentor_monthly_stats` - Estadisticas mensuales
- `course_reviews` - Revisiones de cursos (2 aprobaciones, UNIQUE por mentor+curso)

**Mensajeria:**
- `conversations` - Conversaciones 1:1 entre usuarios
- `messages` - Mensajes (max 5000 chars, tracking de leidos)

**Comentarios:**
- `lesson_comments` - Comentarios en lecciones (is_hidden, is_answer, moderacion)

**Acceso/Entitlements:**
- `entitlements` - Permisos de acceso a contenido premium (course_access, full_platform, learning_path_access)

### Enums Personalizados

| Enum | Valores |
|------|---------|
| `course_status` | draft, pending_review, published, rejected, changes_requested, archived, coming_soon |
| `course_review_vote` | approve, request_changes |

---

## SISTEMA DE INSTRUCTORES

### Requisitos para Examen de Certificacion

| # | Requisito | Verificacion |
|---|-----------|--------------|
| 1 | Suscripcion Premium | `has_premium_access()` |
| 2 | Cursos de la ruta completados | `course_enrollments.completed_at IS NOT NULL` |
| 3 | Quiz final aprobado | `course_final_quiz_attempts.passed = true` |
| 4 | Sin certificacion activa | `instructor_certifications.status != 'active'` |
| 5 | Sin cooldown activo | 15 dias tras fallo, 6 meses si agota modelos |

### Configuracion del Examen

| Parametro | Valor |
|-----------|-------|
| Preguntas por examen | 20 |
| Tiempo limite | 30 minutos |
| Porcentaje aprobacion | 80% (16/20) |
| Modelos por ruta | 10 |
| Cooldown tras fallo | 15 dias |
| Cooldown tras agotar modelos | 6 meses |
| Validez certificacion | 2 anos |

### Beneficios del Instructor Certificado

- Crear cursos premium en la plataforma
- Revenue share 35/65 (instructor/plataforma), 40% con referidos
- Badge de verificado en perfil publico
- Listado en `/instructores`
- Acceso a herramientas de instructor
- Estadisticas de alumnos en `/dashboard/instructor/estadisticas`

### Flujo de Certificacion

```
Usuario Premium
    │
    ▼
Completar todos los cursos de la ruta
    │
    ▼
Aprobar quiz final de cada curso
    │
    ▼
Iniciar examen de certificacion
    │
    ▼
Aprobar con 80%+ → Certificacion emitida
    │
    ▼
Rol instructor + Perfil publico + Crear cursos
```

---

## SISTEMA DE MENTORES

### Requisitos

- 650 puntos de merito minimo
- Votacion del consejo de mentores
- Minimo 3 votos a favor

### Puntos de Merito

| Categoria | Puntos |
|-----------|--------|
| Completar curso | +10 |
| Ayudar en comunidad | +5 |
| Sesion de mentoria | +20 |
| Propuesta aprobada | +50 |

---

## SISTEMA DE MENSAJERIA

### Arquitectura

```
conversations (1:1)
├── participant_1, participant_2
├── last_message_at
└── RLS: solo participantes ven sus conversaciones

messages
├── conversation_id, sender_id
├── content (max 5000 chars)
├── read_at (NULL = no leido)
└── RLS: solo participantes del chat
```

### Endpoints API

| Endpoint | Metodo | Proposito |
|----------|--------|-----------|
| `/api/messages/conversations` | GET | Listar conversaciones |
| `/api/messages/conversations` | POST | Crear conversacion |
| `/api/messages/[id]` | GET | Obtener mensajes |
| `/api/messages/[id]` | POST | Enviar mensaje |
| `/api/messages/[id]/read` | POST | Marcar como leidos |
| `/api/messages/unread` | GET | Contador no leidos |

### Endpoints API - Revision de Cursos (Mentor)

| Endpoint | Metodo | Proposito |
|----------|--------|-----------|
| `/api/mentor/courses/review` | GET | Listar cursos pendientes con info de votos |
| `/api/mentor/courses/review` | POST | Enviar review (vote + comment) |
| `/api/instructor/courses/[id]/reviews` | GET | Ver reviews de un curso (solo instructor dueno) |

### Endpoints API - Entitlements (Admin)

| Endpoint | Metodo | Proposito |
|----------|--------|-----------|
| `/api/admin/entitlements` | GET | Listar entitlements (filtros: user_id, type, page) |
| `/api/admin/entitlements` | POST | Otorgar entitlement a usuario |
| `/api/admin/entitlements` | DELETE | Revocar entitlement |

### Endpoints API - Comentarios en Lecciones

| Endpoint | Metodo | Proposito |
|----------|--------|-----------|
| `/api/lessons/[lessonId]/comments` | GET | Listar comentarios (filtra ocultos para no-admins) |
| `/api/lessons/[lessonId]/comments` | POST | Crear comentario (notifica al instructor) |
| `/api/comments/[commentId]` | PATCH | Editar (autor), marcar respuesta (instructor/mentor/admin), ocultar (admin) |

### Componentes

- `MessageBell` - Icono en header con badge de no leidos
- `ConversationList` - Lista de conversaciones con busqueda
- `ChatView` - Vista de chat con auto-scroll
- `MessageBubble` - Burbuja con check de lectura
- `MessageInput` - Textarea auto-resize
- `SendMessageButton` - Boton en perfil de instructor

---

## SISTEMA DE COMENTARIOS EN LECCIONES

### Arquitectura

```
lesson_comments
├── lesson_id, user_id
├── content (max 2000 chars)
├── is_hidden (moderacion)
├── is_answer (respuesta util)
└── RLS: usuarios ven no-ocultos, admin ve todo
```

### Roles y Permisos

| Accion | Autor | Instructor | Mentor | Admin |
|--------|-------|------------|--------|-------|
| Crear comentario | Si | Si | Si | Si |
| Editar propio | Si | Si | Si | Si |
| Marcar respuesta | - | Si | Si | Si |
| Ocultar comentario | - | - | - | Si |

### Componentes

- `LessonComments` - Componente principal integrado en LessonPlayer
- Badges de rol: Instructor (cyan), Mentor (purple), Admin (red), Consejo (amber)
- Badge "Respuesta util" (green) para comentarios destacados
- Tiempo relativo: "hace 5 min", "hace 2h", "hace 3d"

---

## SISTEMA DE ROLES

### Tipos de Rol

| Rol | Jerarquia | Descripcion |
|-----|-----------|-------------|
| `user` | 1 | Usuario base |
| `beta_tester` | 1 | Acceso a funciones beta |
| `instructor` | 2 | Puede crear cursos |
| `candidate_mentor` | 2 | Aplicacion en proceso |
| `mentor` | 3 | Guia comunidad, vota gobernanza |
| `admin` | 4 | Panel administracion |
| `council` | 5 | Consejo de gobernanza |

---

## ESTRUCTURA DE ARCHIVOS

```
/nodo360-plataforma
├── app/
│   ├── (private)/          # Rutas autenticadas
│   │   ├── dashboard/
│   │   │   ├── instructor/ # Panel instructor
│   │   │   └── mentor/     # Panel mentor
│   │   └── admin/          # Panel admin
│   ├── (public)/           # Rutas publicas
│   │   ├── instructores/   # Listado + perfiles
│   │   └── mentores/       # Listado mentores
│   ├── api/
│   │   ├── admin/          # APIs admin
│   │   ├── instructor/     # APIs instructor
│   │   └── mentor/         # APIs mentor
│   └── mentoria/           # Landing page
├── components/
│   ├── dashboard/
│   ├── gamification/
│   ├── messages/          # Componentes de mensajeria
│   ├── navigation/
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── db/
│   ├── gamification/
│   └── roles/
├── types/
│   ├── database.ts
│   └── roles.ts
└── supabase/
    └── migrations/         # 11 migraciones
```

---

## CONVENCIONES DE CODIGO

### Imports (SIEMPRE usar alias @/)
```typescript
// CORRECTO
import { Course } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

// INCORRECTO
import { Course } from '../../../types/database'
```

### Logging (emojis estandar)
```typescript
console.log('[functionName] Iniciando operacion:', params)
console.log('[functionName] Exito:', result)
console.error('[functionName] Error:', error)
```

### Estilos (Glassmorphism oscuro)
```typescript
// Card basica
className="rounded-2xl bg-white/5 border border-white/10 p-6"

// Card hover
className="hover:border-brand/30 hover:bg-white/[0.07] transition-all"

// Gradiente brand
className="bg-gradient-to-r from-brand-light to-brand"
```

---

## REGLAS CRITICAS

### NUNCA HACER
- Usar relaciones plurales (`lesson.modules.courses`)
- Saltarse lectura de archivos antes de editar
- Commit sin probar que compila
- Hardcodear datos sensibles
- Ignorar verificaciones de elegibilidad

### SIEMPRE HACER
- Usar `lesson.module.course` (singular)
- Leer archivos con Read tool antes de Edit
- Verificar build antes de commit
- Usar alias `@/` para imports
- Castear tipos Supabase cuando es necesario: `as unknown as { ... }`

---

## ESTADO ACTUAL (06/02/2026)

```
Sistema Core                 COMPLETADO
├── Autenticacion
├── Cursos y Lecciones
├── Progreso y Enrollments
├── Gamificacion (XP, Badges)
└── Certificados (auto-generacion al completar)

Sistema Premium             COMPLETADO
├── Suscripciones
├── Revenue Share (35/65, 40% con referidos)
└── Compras de Cursos

Sistema Instructores        COMPLETADO
├── Examenes de Certificacion
├── Verificacion Premium
├── Verificacion Cursos
├── Verificacion Quizzes
├── Perfil Publico
├── Pagina /instructores
└── Estadisticas de Alumnos

Sistema Mentores            COMPLETADO
├── Aplicaciones
├── Puntos de Merito
├── Votacion Consejo
├── Perfil Publico
├── Pagina /mentores
└── Revision de Cursos (2 aprobaciones, changes_requested)

Sistema Mensajeria          COMPLETADO
├── Conversaciones 1:1
├── Mensajes con read receipts
├── Icono en header con badge
├── Chat en tiempo real (polling)
└── Integracion con perfiles

Sistema Comentarios (Lecciones) COMPLETADO
├── Tabla lesson_comments con RLS
├── APIs GET/POST/PATCH con rate limiting
├── Componente LessonComments
├── Badges de rol (Instructor, Mentor, Admin, Consejo)
├── Feature "Respuesta util"
├── Moderacion: admin puede ocultar
└── Notificacion al instructor

Sistema de Acceso (Entitlements) COMPLETADO
├── Tabla entitlements con RLS
├── Tipos: course_access, full_platform, learning_path_access
├── API admin para gestionar entitlements
├── Gating server-side en cursos premium
├── Gating server-side en lecciones premium
└── Soporte expiracion

Panel Admin                 COMPLETADO
├── Gestion Usuarios
├── Gestion Cursos
├── Asignacion Roles
└── Configuracion
```

---

**Ultima actualizacion:** 06/02/2026
**Proyecto:** Nodo360 Plataforma Educativa
**Version:** 2.5
