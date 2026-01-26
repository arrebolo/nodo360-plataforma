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

## METRICAS DEL PROYECTO (26/01/2026)

| Metrica | Valor |
|---------|-------|
| Rutas de App | 91 |
| Migraciones SQL | 11 |
| Funciones DB | 17 |
| Tablas Core | 25+ |
| Componentes | 50+ |
| APIs | 40+ |

---

## HISTORIAL DE SESIONES

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

### Funciones SQL Principales (17 funciones)

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
- Revenue share 60/40 (instructor/plataforma)
- Badge de verificado en perfil publico
- Listado en `/instructores`
- Acceso a herramientas de instructor

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

## ESTADO ACTUAL (26/01/2026)

```
Sistema Core                 COMPLETADO
├── Autenticacion
├── Cursos y Lecciones
├── Progreso y Enrollments
├── Gamificacion (XP, Badges)
└── Certificados

Sistema Premium             COMPLETADO
├── Suscripciones
├── Revenue Share
└── Compras de Cursos

Sistema Instructores        COMPLETADO
├── Examenes de Certificacion
├── Verificacion Premium
├── Verificacion Cursos
├── Verificacion Quizzes
├── Perfil Publico
└── Pagina /instructores

Sistema Mentores            COMPLETADO
├── Aplicaciones
├── Puntos de Merito
├── Votacion Consejo
├── Perfil Publico
└── Pagina /mentores

Panel Admin                 COMPLETADO
├── Gestion Usuarios
├── Gestion Cursos
├── Asignacion Roles
└── Configuracion
```

---

**Ultima actualizacion:** 26/01/2026
**Proyecto:** Nodo360 Plataforma Educativa
**Version:** 2.0
