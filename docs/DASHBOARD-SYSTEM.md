# Sistema de Dashboard del Estudiante

Documentación completa del sistema de dashboard, progreso y gamificación de Nodo360.

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Base de Datos](#base-de-datos)
3. [API Endpoints](#api-endpoints)
4. [Componentes](#componentes)
5. [Funcionalidades](#funcionalidades)
6. [Flujo de Datos](#flujo-de-datos)
7. [Próximos Pasos](#próximos-pasos)

---

## 🏗️ Arquitectura

### Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, Lucide Icons
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (a implementar)
- **Types**: TypeScript con tipos estrictos

### Estructura de Archivos

```
app/
├── dashboard/
│   └── page.tsx                    # Página principal del dashboard
├── api/
│   └── dashboard/
│       ├── stats/route.ts          # Estadísticas del usuario
│       ├── enrollments/route.ts    # Inscripciones a cursos
│       ├── progress/[lessonId]/route.ts  # Progreso de lecciones
│       └── certificates/route.ts   # Certificados

sql/
└── create-user-progress-tables.sql # Schema de BD

types/
└── database.ts                     # Tipos TypeScript

docs/
└── DASHBOARD-SYSTEM.md            # Esta documentación
```

---

## 💾 Base de Datos

### Tablas Creadas

#### 1. `course_enrollments`
Registra qué cursos ha iniciado cada usuario.

```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- course_id: UUID (FK → courses)
- enrolled_at: TIMESTAMP
- last_accessed_at: TIMESTAMP
- completed_at: TIMESTAMP (nullable)
- progress_percentage: INTEGER (0-100)
```

#### 2. `lesson_progress`
Progreso detallado por cada lección.

```sql
- id: UUID (PK)
- user_id: UUID (FK)
- lesson_id: UUID (FK → lessons)
- course_id: UUID (FK → courses)
- started_at: TIMESTAMP
- completed_at: TIMESTAMP (nullable)
- last_position: INTEGER (para videos)
- time_spent_seconds: INTEGER
- is_completed: BOOLEAN
```

#### 3. `certificates`
Certificados emitidos al completar cursos.

```sql
- id: UUID (PK)
- user_id: UUID (FK)
- course_id: UUID (FK)
- issued_at: TIMESTAMP
- certificate_number: TEXT (unique)
- certificate_url: TEXT (nullable, PDF link)
```

#### 4. `user_achievements`
Logros y badges desbloqueados.

```sql
- id: UUID (PK)
- user_id: UUID (FK)
- achievement_type: TEXT (first_lesson, streak_7, etc.)
- unlocked_at: TIMESTAMP
- metadata: JSONB
```

#### 5. `user_activity`
Timeline de actividad para el dashboard.

```sql
- id: UUID (PK)
- user_id: UUID (FK)
- activity_type: TEXT
- related_id: UUID (nullable)
- created_at: TIMESTAMP
- metadata: JSONB
```

#### 6. `user_profiles`
Perfil extendido con gamificación.

```sql
- id: UUID (PK)
- user_id: UUID (FK, unique)
- display_name: TEXT
- avatar_url: TEXT
- bio: TEXT
- current_streak: INTEGER
- longest_streak: INTEGER
- last_activity_date: DATE
- total_xp: INTEGER
- level: INTEGER
- created_at/updated_at: TIMESTAMP
```

### Funciones SQL

#### `calculate_course_progress(user_id, course_id)`
Calcula el porcentaje de progreso de un curso.

#### `update_course_progress()` (Trigger)
Se ejecuta automáticamente al actualizar `lesson_progress` para recalcular el progreso del curso.

#### `update_user_streak()` (Trigger)
Actualiza la racha de días consecutivos al registrar actividad.

#### `create_user_profile()` (Trigger)
Crea automáticamente el perfil al registrar un nuevo usuario.

---

## 🔌 API Endpoints

### 1. `GET /api/dashboard/stats`
Obtiene estadísticas agregadas del usuario.

**Response:**
```typescript
{
  data: {
    totalProgress: number
    activeCourses: number
    completedCourses: number
    completedLessons: number
    totalLessons: number
    hoursStudied: number
    currentStreak: number
    longestStreak: number
    totalXp: number
    level: number
    certificatesEarned: number
  }
}
```

### 2. `GET /api/dashboard/enrollments`
Lista cursos inscritos con detalles.

**Response:**
```typescript
{
  data: Array<{
    id: string
    course_id: string
    progress_percentage: number
    last_accessed_at: string
    course: Course
  }>
}
```

### 3. `POST /api/dashboard/enrollments`
Inscribe al usuario en un curso.

**Request Body:**
```json
{
  "course_id": "uuid"
}
```

### 4. `POST /api/dashboard/progress/[lessonId]`
Actualiza el progreso de una lección.

**Request Body:**
```json
{
  "course_id": "uuid",
  "is_completed": boolean,
  "time_spent_seconds": number,
  "last_position": number
}
```

### 5. `GET /api/dashboard/progress/[lessonId]`
Obtiene el progreso de una lección específica.

### 6. `GET /api/dashboard/certificates`
Lista certificados del usuario.

**Response:**
```typescript
{
  data: Array<{
    id: string
    course_id: string
    issued_at: string
    certificate_number: string
    certificate_url: string | null
    course: { title, slug, thumbnail_url }
  }>
}
```

---

## 🎨 Componentes del Dashboard

### Página Principal (`/dashboard`)

#### Secciones:

1. **Header**
   - Saludo personalizado
   - Fecha actual
   - Badge de racha de días

2. **Stats Cards** (4 cards)
   - Progreso Total (%)
   - Cursos Activos
   - Lecciones Completadas
   - Horas Estudiadas

3. **Continuar Aprendiendo**
   - Card destacada con último curso/lección
   - Botón para continuar
   - Progreso visual

4. **Mis Cursos**
   - Grid de cursos inscritos
   - Progreso por curso
   - Badges de nivel
   - Botón para descargar certificado (si completado)

5. **Logros y Badges**
   - Grid de achievements
   - Estados: desbloqueado / bloqueado
   - Progreso parcial visible

6. **Certificados**
   - Lista de certificados earned
   - Botones: Descargar PDF, Compartir LinkedIn

7. **Actividad Reciente** (Sidebar)
   - Timeline de últimas acciones
   - Iconos por tipo de actividad

8. **Estadísticas Rápidas** (Sidebar)
   - Racha actual
   - Certificados
   - Nivel

---

## ⚙️ Funcionalidades

### 1. Sistema de Progreso

**Tracking Automático:**
- Al abrir una lección, se crea registro en `lesson_progress`
- Se actualiza `time_spent_seconds` periódicamente
- Al completar, se marca `is_completed = true`
- El trigger recalcula automáticamente el progreso del curso

**Implementación en Frontend:**
```typescript
// Ejemplo: Marcar lección como completada
const completeLesson = async (lessonId: string, courseId: string) => {
  await fetch(`/api/dashboard/progress/${lessonId}`, {
    method: 'POST',
    body: JSON.stringify({
      course_id: courseId,
      is_completed: true,
      time_spent_seconds: 1800 // 30 minutos
    })
  })
}
```

### 2. Sistema de Gamificación

**Logros Disponibles:**
- `first_lesson`: Primera lección completada
- `streak_3`: 3 días consecutivos
- `streak_7`: 7 días consecutivos
- `streak_30`: 30 días consecutivos
- `course_completed_1`: Primer curso completado
- `course_completed_5`: 5 cursos completados
- `lessons_10/50/100`: X lecciones completadas
- `hours_10/50/100`: X horas de estudio
- `bitcoin_expert`: Todos los cursos de Bitcoin
- `blockchain_expert`: Todos los cursos de Blockchain

**Rachas (Streaks):**
- Se actualiza automáticamente al registrar actividad
- Trigger `update_user_streak` compara fechas
- Si actividad ayer → incrementa racha
- Si actividad hace >1 día → reinicia a 1

### 3. Sistema de Certificados

**Generación Automática:**
- Al completar 100% de un curso
- Se genera `certificate_number` único
- Se inserta en tabla `certificates`
- Se registra actividad `certificate_earned`

**Formato del Número:**
```
NODO360-{CATEGORY}-{SEQUENCE}-{YEAR}
Ejemplo: NODO360-BTC-001-2024
```

**Próximos Pasos:**
- Generar PDF automáticamente
- QR code para verificación
- Integración con LinkedIn API

---

## 🔄 Flujo de Datos

### Flujo: Usuario Completa una Lección

```
1. Usuario hace clic en "Marcar como completada"
   ↓
2. Frontend: POST /api/dashboard/progress/{lessonId}
   {
     course_id: "...",
     is_completed: true,
     time_spent_seconds: 1800
   }
   ↓
3. API: Upsert en lesson_progress
   ↓
4. Trigger: update_course_progress()
   - Calcula progreso del curso
   - Actualiza course_enrollments.progress_percentage
   - Si 100%: marca completed_at
   ↓
5. API: Inserta en user_activity
   activity_type: 'lesson_completed'
   ↓
6. Trigger: update_user_streak()
   - Compara last_activity_date
   - Actualiza current_streak
   ↓
7. Backend: Verifica logros
   - ¿Primera lección? → Unlock 'first_lesson'
   - ¿Lección #10? → Unlock 'lessons_10'
   - ¿Curso 100%? → Genera certificado
   ↓
8. Response: { success: true, data: {...} }
   ↓
9. Frontend: Actualiza UI
   - Refresh stats
   - Mostrar celebración si logro nuevo
```

---

## 🚀 Próximos Pasos

### Fase 1: Autenticación (URGENTE)
- [ ] Implementar Supabase Auth
- [ ] Proteger rutas del dashboard
- [ ] Redirect a login si no autenticado
- [ ] Obtener datos reales del usuario

### Fase 2: Generación de Certificados
- [ ] Integrar librería de PDF (jsPDF, PDFKit)
- [ ] Diseño de template de certificado
- [ ] Generar QR code con URL de verificación
- [ ] Almacenar PDF en Supabase Storage
- [ ] Endpoint de verificación pública

### Fase 3: Notificaciones
- [ ] Sistema de notificaciones push
- [ ] Email notifications:
  - Lección pendiente
  - Nuevo certificado
  - Racha en peligro
  - Nuevo logro desbloqueado

### Fase 4: Optimizaciones
- [ ] Caching con React Query
- [ ] Optimistic updates
- [ ] Skeleton screens
- [ ] Lazy loading de secciones
- [ ] PWA support

### Fase 5: Social Features
- [ ] Leaderboard global
- [ ] Compartir logros en redes
- [ ] Perfil público del estudiante
- [ ] Sistema de amigos/seguir

---

## 📚 Uso para Desarrolladores

### Obtener estadísticas del dashboard:
```typescript
const stats = await fetch('/api/dashboard/stats')
  .then(res => res.json())
```

### Inscribir usuario en curso:
```typescript
await fetch('/api/dashboard/enrollments', {
  method: 'POST',
  body: JSON.stringify({ course_id: 'uuid' })
})
```

### Actualizar progreso de lección:
```typescript
await fetch(`/api/dashboard/progress/${lessonId}`, {
  method: 'POST',
  body: JSON.stringify({
    course_id: 'uuid',
    is_completed: true,
    time_spent_seconds: 1800,
    last_position: 0
  })
})
```

### Obtener certificados:
```typescript
const certs = await fetch('/api/dashboard/certificates')
  .then(res => res.json())
```

---

## 🐛 Troubleshooting

### Error: "No autenticado"
- Verificar que Supabase Auth está correctamente configurado
- Revisar que el usuario tiene sesión activa
- Comprobar que el middleware protege las rutas

### Progreso no se actualiza
- Verificar que los triggers están creados
- Revisar logs de la función `calculate_course_progress`
- Comprobar que lesson_id y course_id son correctos

### Rachas no funcionan
- Verificar trigger `update_user_streak`
- Comprobar que se registran actividades correctamente
- Revisar campo `last_activity_date` en user_profiles

---

## 📄 Licencia

Todos los derechos reservados © Nodo360 2024
