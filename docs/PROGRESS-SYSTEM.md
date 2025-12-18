# Sistema de Progreso de Cursos - Nodo360

## Arquitectura Unificada

El sistema de progreso de cursos utiliza una arquitectura centralizada con un único punto de verdad.

## Componentes Principales

### 1. Fuente de Datos Central

**`lib/progress/getCourseProgress.ts`**

Función principal del servidor que calcula el progreso completo de un usuario en un curso:

```typescript
export async function getCourseProgressForUser(
  courseId: string,
  userId: string
): Promise<CourseProgress>
```

**Responsabilidades:**
- Obtener todos los módulos y lecciones del curso
- Consultar el progreso del usuario desde `user_progress`
- Calcular estados de desbloqueo según reglas de negocio
- Retornar estructura completa con estados de cada módulo/lección

**Reglas de Desbloqueo:**
- Módulo 1: Siempre desbloqueado
- Módulo N (N > 1): Desbloqueado si el módulo N-1 está 100% completado
- Lecciones: Desbloqueadas si su módulo está desbloqueado

### 2. API de Completar Lección

**`app/api/progress/route.ts`**

Endpoint único para marcar lecciones como completadas:

```
POST /api/progress
Body: { lessonId: string, courseId?: string }
```

**Responsabilidades:**
- Marcar lección como completada en `user_progress`
- Recalcular `progress_percentage` en `course_enrollments`
- Actualizar XP y nivel en `user_gamification_stats`
- Registrar evento en `xp_events`
- Crear certificado automático si se completa el curso
- Retornar datos de gamificación y certificado

**Respuesta:**
```typescript
{
  success: boolean
  xp_gained: number
  new_total_xp: number
  new_level: number
  course_completed: boolean
  certificate_issued: boolean
  certificate_number?: string
  course_title?: string
  certificate?: {
    id: string
    number: string
    title: string
  }
}
```

### 3. Componente de UI

**`components/lesson/NextLessonButton.tsx`**

Componente cliente que maneja la interacción del usuario:

- Llama a `/api/progress` para completar lecciones
- Muestra notificación de XP ganado
- Muestra modal de certificado si se completa el curso
- Navega a la siguiente lección automáticamente
- Soporta atajos de teclado (Enter, →)

### 4. Página del Curso

**`app/cursos/[slug]/page.tsx`**

Página servidor que renderiza el curso con progreso:

```typescript
// Obtiene progreso centralizado
const courseProgress = await getCourseProgressForUser(course.id, user.id)

// Usa los módulos con estado directamente
const modules = courseProgress?.modules || []
```

## Tablas de Base de Datos

### user_progress
```sql
- user_id: UUID
- lesson_id: UUID
- is_completed: boolean
- completed_at: timestamp
- watch_time_seconds: integer
```

### course_enrollments
```sql
- user_id: UUID
- course_id: UUID
- progress_percentage: integer (0-100)
- completed_at: timestamp (null si no completado)
- enrolled_at: timestamp
```

### user_gamification_stats
```sql
- user_id: UUID
- total_xp: integer
- current_level: integer
- lessons_completed: integer
- xp_to_next_level: integer
```

### certificates
```sql
- id: UUID
- user_id: UUID
- course_id: UUID
- certificate_number: string
- title: string
- type: 'course' | 'module'
- issued_at: timestamp
```

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                    Usuario completa lección                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              NextLessonButton (Cliente)                          │
│              POST /api/progress                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              API /api/progress (Servidor)                        │
│              1. Marcar user_progress                             │
│              2. Actualizar course_enrollments                    │
│              3. Actualizar gamification_stats                    │
│              4. Crear certificado (si 100%)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Respuesta con datos de gamificación                 │
│              + certificado si aplica                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              NextLessonButton muestra feedback                   │
│              + modal certificado + navega a siguiente            │
└─────────────────────────────────────────────────────────────────┘
```

## Código Eliminado (Deprecado)

Los siguientes archivos fueron eliminados por ser redundantes:

- `components/course/ModuleListEnhanced.tsx` - Tenía lógica duplicada de progreso
- `components/course/LessonFooter.tsx` - No se usaba
- `app/api/lessons/complete/route.ts` - API redundante sin gamificación

## Tipos Exportados

```typescript
// lib/progress/getCourseProgress.ts

export interface LessonWithState {
  id: string
  title: string
  slug: string
  order_index: number
  isCompleted: boolean
  isUnlocked: boolean
}

export interface ModuleWithState {
  id: string
  title: string
  slug: string
  order_index: number
  isUnlocked: boolean
  isCompleted: boolean
  progress: number
  lessons: LessonWithState[]
}

export interface CourseProgress {
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  modules: ModuleWithState[]
}
```
