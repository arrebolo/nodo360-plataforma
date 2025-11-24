# PROMPT MAESTRO - PROYECTO NODO360

## 🎯 MISIÓN DEL PROYECTO

**Nodo360** es una plataforma educativa de Bitcoin y Blockchain en español.

**Objetivo**: Crear una plataforma completa donde usuarios puedan:
- Explorar cursos estructurados (módulos → lecciones)
- Inscribirse y seguir su progreso
- Ver videos educativos
- Tomar notas y marcar contenido importante
- Obtener certificados al completar cursos
- Interactuar con la comunidad

**Propuesta de valor**: Educación de calidad, gratuita, en español, con seguimiento personalizado.

---

## 📋 CONTEXTO TÉCNICO

### Stack Tecnológico
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5
- **Estilos**: Tailwind CSS v4
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Deploy**: Vercel (próximamente)

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

### Estructura de Datos CRÍTICA
**REGLA DE ORO**: `lesson.module.course` (SIEMPRE SINGULAR)

```typescript
// ✅ CORRECTO
const courseTitle = lesson.module.course.title

// ❌ INCORRECTO (romperá todo)
const courseTitle = lesson.modules.courses.title
```

---

## 🗄️ ESQUEMA DE BASE DE DATOS

### Tablas Core (7 tablas principales)

1. **users** - Perfiles extendidos
   - id (UUID, FK a auth.users)
   - email, full_name, avatar_url
   - role (student/instructor/admin)
   - bio, website, social links
   - created_at, updated_at

2. **courses** - Cursos
   - id, slug, title, description
   - level (beginner/intermediate/advanced)
   - status (draft/published/archived)
   - is_free, is_premium
   - instructor_id (FK a users)
   - thumbnail_url, banner_url
   - total_modules, total_lessons, duration_hours

3. **modules** - Módulos/Secciones de curso
   - id, course_id (FK)
   - title, description
   - order_index (orden de presentación)
   - total_lessons, total_duration_minutes

4. **lessons** - Lecciones individuales
   - id, module_id (FK)
   - title, slug, description
   - order_index
   - content, content_json
   - video_url, video_duration_minutes
   - is_free_preview
   - attachments (JSON array)

5. **user_progress** - Progreso del usuario
   - id, user_id (FK), lesson_id (FK)
   - is_completed, completed_at
   - watch_time_seconds

6. **bookmarks** - Marcadores
   - id, user_id (FK), lesson_id (FK)
   - note, created_at

7. **notes** - Notas de lecciones
   - id, user_id (FK), lesson_id (FK)
   - content
   - video_timestamp_seconds
   - created_at, updated_at

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
/nodo360-plataforma
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage
│   ├── layout.tsx         # Layout raíz
│   ├── login/             # ✅ FASE 2
│   │   └── page.tsx
│   ├── register/          # ✅ FASE 2
│   │   └── page.tsx
│   ├── cursos/
│   │   ├── page.tsx       # Listado de cursos
│   │   └── [slug]/
│   │       ├── page.tsx   # Detalle del curso
│   │       └── [lessonSlug]/
│   │           └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── api/
│       ├── enroll/
│       ├── progress/
│       └── notes/
│
├── components/
│   ├── common/
│   ├── navigation/
│   ├── course/
│   └── lesson/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # ✅ Cliente browser
│   │   ├── server.ts      # ✅ Cliente server
│   │   └── types.ts
│   └── db/
│       └── courses-queries.ts
│
├── types/
│   └── database.ts
│
├── middleware.ts          # ✅ FASE 2
├── PROMPT-MAESTRO.md      # Este archivo
├── FASE_2_AUTENTICACION.md # ✅ Documentación
└── .env.local
```

---

## 🎨 CONVENCIONES DE CÓDIGO

### 1. Imports (SIEMPRE usar alias @/)
```typescript
// ✅ CORRECTO
import { Course } from '@/types/database'
import { getCourseBySlug } from '@/lib/db/courses-queries'
import { createClient } from '@/lib/supabase/server'

// ❌ INCORRECTO
import { Course } from '../../../types/database'
```

### 2. Logging (emojis estándar)
```typescript
console.log('🔍 [functionName] Iniciando operación:', params)
console.log('✅ [functionName] Éxito:', result)
console.error('❌ [functionName] Error:', error)

// Emojis:
// 🔍 Inicio
// ✅ Éxito
// ❌ Error
// ℹ️ Info
// ⚠️ Advertencia
```

### 3. Nomenclatura
- Archivos de páginas: `page.tsx`, `layout.tsx`
- Componentes: `ComponentName.tsx` (PascalCase)
- Utilidades: `kebab-case.ts`
- Tipos: `database.ts`, `lesson-content.ts`
- Queries: `*-queries.ts`

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### ✅ FASE 0: FUNDACIÓN (MANUAL)
**Estado:** ✅ COMPLETADA
- Base de datos creada en Supabase
- Variables de entorno configuradas
- Cliente Supabase instalado

### ✅ FASE 1: DATOS DE PRUEBA
**Estado:** ⚠️ PENDIENTE
**Objetivo:** Tener 1 curso funcional en la base de datos
- Script de seed
- Curso "Bitcoin desde Cero" con 2 módulos

### ✅ FASE 2: AUTENTICACIÓN
**Estado:** ✅ COMPLETADA (2025-11-17)
**Archivos creados:**
- `app/login/page.tsx`
- `app/register/page.tsx`
- `middleware.ts`
- `FASE_2_AUTENTICACION.md`

**Funcionalidades:**
- Login con email/password
- Registro de usuarios
- Middleware de protección de rutas
- Redirecciones automáticas

### 📍 FASE 3: INSCRIPCIONES
**Estado:** ⚠️ PENDIENTE (SIGUIENTE)
**Objetivo:** Usuarios pueden inscribirse a cursos
- Crear tabla `course_enrollments`
- API endpoint `/api/enroll`
- Botón "Inscribirse" en curso
- Dashboard muestra cursos inscritos

### FASE 4: DASHBOARD REAL
**Estado:** ⚠️ PENDIENTE
- Reemplazar mock data con datos reales
- Mostrar cursos inscritos
- Estadísticas de progreso

### FASE 5: PROGRESO DE LECCIONES
**Estado:** ⚠️ PENDIENTE
- Marcar lecciones como completadas
- Actualizar progreso en dashboard

### FASE 6: BOOKMARKS
**Estado:** ⚠️ PENDIENTE
- Guardar lecciones favoritas
- Página de bookmarks

### FASE 7: NOTAS
**Estado:** ⚠️ PENDIENTE
- Tomar notas en lecciones
- Panel de notas

### FASE 8: CERTIFICADOS
**Estado:** ⚠️ PENDIENTE
- Generar certificados al completar curso

### FASE 9: ADMIN PANEL
**Estado:** ⚠️ PENDIENTE
- CRUD de cursos
- Panel de administración

### FASE 10: OPTIMIZACIONES
**Estado:** ⚠️ PENDIENTE
- Caching, lazy loading, SEO

---

## ⚠️ REGLAS CRÍTICAS

### ❌ NUNCA HACER
- Usar relaciones plurales (`lesson.modules.courses`)
- Saltarse lectura de archivos antes de editar
- Ignorar tipos de `types/database.ts`
- Commit sin probar que compila
- Importaciones relativas (usar `@/`)
- Hardcodear datos sensibles

### ✅ SIEMPRE HACER
- Usar `lesson.module.course` (singular)
- Leer archivos con Read tool antes de Edit
- Seguir tipos de `types/database.ts`
- Usar alias `@/` para imports
- Logging con emojis (🔍 ✅ ❌)
- Verificar estructura de datos
- Probar flujo end-to-end

---

## 🎯 INSTRUCCIONES PARA LA IA

### Al recibir este prompt:
1. Confirmar que leíste PROMPT-MAESTRO.md
2. Preguntar en qué FASE estamos
3. Verificar estado actual del proyecto
4. Proponer siguiente paso específico según el plan
5. Pedir confirmación antes de generar código

### Al generar código:
1. Seguir convenciones de este documento
2. Usar tipos correctos de `types/database.ts`
3. Logging apropiado con emojis
4. Comentarios en español
5. Código limpio y mantenible

### Al terminar una tarea:
1. Resumir lo que se hizo
2. Indicar cómo verificar que funciona
3. Proponer siguiente paso lógico
4. Actualizar estado de la fase
5. Reportar resultado

---

## 📊 ESTADO ACTUAL DEL PROYECTO (2025-11-17)

```
FASE 0: Fundación               ✅ Completada
FASE 1: Datos de Prueba         ⚠️ Pendiente
FASE 2: Autenticación           ✅ Completada (2025-11-17)
FASE 3: Inscripciones           📍 SIGUIENTE
FASE 4: Dashboard Real          ⚠️ Pendiente
FASE 5: Progreso Lecciones      ⚠️ Pendiente
FASE 6: Bookmarks               ⚠️ Pendiente
FASE 7: Notas                   ⚠️ Pendiente
FASE 8: Certificados            ⚠️ Pendiente
FASE 9: Admin Panel             ⚠️ Pendiente
FASE 10: Optimizaciones         ⚠️ Pendiente
```

**Próxima acción:** Implementar FASE 3 (Inscripciones)

---

## 🚀 INICIO DE SESIÓN

**PREGUNTA INICIAL:** ¿En qué fase estamos y qué tarea específica vamos a hacer hoy?

**VERIFICAR:**
1. PROMPT-MAESTRO.md está adjunto
2. Tengo acceso al código del proyecto
3. .env.local está configurado
4. Supabase está operativo

**COMENZAR:** Dime qué fase implementamos y te guío paso a paso.

---

## 📝 CÓMO USAR ESTE PROMPT

### Opción 1: Claude.ai (Web)
1. Copiar este archivo completo
2. Nuevo chat en Claude.ai
3. Pegar el prompt
4. Agregar: "Estoy listo para continuar. Actualmente estamos en FASE [número]."

### Opción 2: Claude Code (VS Code)
1. Abrir proyecto en VS Code
2. Claude leerá este archivo automáticamente
3. Decir: "Lee PROMPT-MAESTRO.md. Continuemos desde donde lo dejamos."

---

**FIN DEL PROMPT MAESTRO**

---

Última actualización: 2025-11-17
Proyecto: Nodo360 Plataforma Educativa
