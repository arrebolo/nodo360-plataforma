# CLAUDE.md - Documentación Plataforma Nodo360

> **Última Actualización**: 2025-11-17
> **Proyecto**: nodo360-plataforma
> **Propósito**: Guía completa para asistentes de IA trabajando en la plataforma educativa Nodo360

---

## Tabla de Contenidos

1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Arquitectura y Stack Tecnológico](#arquitectura-y-stack-tecnológico)
3. [Estructura del Código](#estructura-del-código)
4. [Esquema de Base de Datos y Tipos](#esquema-de-base-de-datos-y-tipos)
5. [Convenciones y Patrones Clave](#convenciones-y-patrones-clave)
6. [Flujo de Desarrollo](#flujo-de-desarrollo)
7. [Reglas Críticas para Asistentes IA](#reglas-críticas-para-asistentes-ia)
8. [Tareas Comunes y Ejemplos](#tareas-comunes-y-ejemplos)
9. [Solución de Problemas](#solución-de-problemas)

---

## Visión General del Proyecto

**Nodo360** es una plataforma educativa basada en Next.js enfocada en educación sobre Bitcoin, blockchain y criptomonedas. La plataforma proporciona:

- **Gestión de Cursos**: Cursos estructurados con módulos y lecciones
- **Contenido en Video**: Integración con plataformas de video para contenido educativo
- **Seguimiento de Progreso del Usuario**: Rastrea el completado de lecciones y tiempo de visualización
- **Contenido Premium**: Soporte para cursos/lecciones gratuitos y premium
- **Funcionalidades de Comunidad**: Newsletter, solicitudes de mentoría y engagement de usuarios

### Características Principales

- Renderizado del lado del servidor con Next.js 16
- Consultas a base de datos con tipado seguro usando Supabase
- UI responsiva con Tailwind CSS v4
- Autenticación y autorización de usuarios
- Seguimiento de progreso y marcadores
- Funcionalidad de búsqueda
- Optimización SEO con datos estructurados

---

## Arquitectura y Stack Tecnológico

### Frontend

- **Framework**: Next.js 16 (App Router)
- **React**: v19.2.0
- **TypeScript**: v5
- **Estilos**: Tailwind CSS v4
- **Iconos**: Lucide React

### Backend

- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **API**: Next.js API Routes
- **ORM**: Supabase Client (@supabase/supabase-js)

### Configuración

- **Alias de Rutas**: `@/*` mapea a la raíz del proyecto
- **Config TypeScript**: Modo estricto habilitado
- **ESLint**: Configuración recomendada de Next.js

### Patrón de Estructura del Proyecto

```
Next.js App Router + Supabase
├── Componentes de Servidor (por defecto)
│   ├── Obtiene datos de Supabase
│   └── Renderiza en el servidor
└── Componentes de Cliente ('use client')
    ├── UI interactiva
    └── Estado del lado del cliente
```

---

## Estructura del Código

```
/nodo360-plataforma
├── app/                          # Páginas Next.js App Router
│   ├── page.tsx                  # Página de inicio
│   ├── layout.tsx                # Layout raíz
│   ├── cursos/                   # Sección de cursos
│   │   ├── page.tsx              # Listado de cursos
│   │   └── [slug]/               # Páginas dinámicas de cursos
│   │       ├── page.tsx          # Página de detalle del curso
│   │       └── [lessonSlug]/     # Páginas dinámicas de lecciones
│   │           └── page.tsx      # Página del reproductor de lección
│   ├── dashboard/                # Panel de usuario
│   ├── comunidad/                # Página de comunidad
│   ├── mentoria/                 # Página de mentoría
│   ├── proyectos/                # Página de proyectos
│   └── api/                      # Rutas de API
│       ├── mentorship/           # API de mentoría
│       └── newsletter/           # API de newsletter
│
├── components/                   # Componentes React
│   ├── common/                   # Componentes compartidos
│   ├── navigation/               # Componentes de navegación
│   ├── course/                   # Componentes relacionados con cursos
│   ├── lesson/                   # Componentes relacionados con lecciones
│   │   └── premium/              # Componentes de lecciones premium
│   ├── home/                     # Componentes de la página de inicio
│   └── search/                   # Componentes de búsqueda
│
├── lib/                          # Bibliotecas de utilidades
│   ├── supabase/                 # Clientes y helpers de Supabase
│   │   ├── client.ts             # Cliente Supabase del lado del cliente
│   │   ├── server.ts             # Cliente Supabase del lado del servidor
│   │   ├── types.ts              # Tipos generados de Supabase
│   │   ├── helpers.ts            # Funciones helper de Supabase
│   │   └── index.ts              # Exports
│   ├── db/                       # Consultas a base de datos
│   │   ├── courses-queries.ts    # Consultas de cursos/lecciones
│   │   └── queries.ts            # Otras consultas
│   ├── utils/                    # Funciones de utilidad
│   │   └── logger.ts             # Utilidad de logging
│   ├── analytics.ts              # Seguimiento de analytics
│   ├── brand-config.ts           # Configuración de marca
│   ├── community-config.ts       # Configuración de comunidad
│   ├── filter-utils.ts           # Filtrado de cursos
│   ├── lesson-helpers.ts         # Funciones de utilidad para lecciones
│   ├── progress-manager.ts       # Seguimiento de progreso
│   ├── search-utils.ts           # Utilidades de búsqueda
│   └── structured-data.ts        # Datos estructurados para SEO
│
├── types/                        # Definiciones de tipos TypeScript
│   ├── database.ts               # Tipos de base de datos (PRINCIPAL)
│   └── lesson-content.ts         # Tipos de contenido de lecciones
│
├── supabase/                     # Configuración de Supabase
│   └── schema.sql                # Esquema de base de datos (504 líneas)
│
├── hooks/                        # React hooks
│
├── data/                         # Archivos de datos estáticos
│
├── backup/                       # Archivos de respaldo
│   └── cursos-old/               # Código legacy de cursos
│
├── src/                          # Código fuente adicional
│   ├── core/                     # Funcionalidad central
│   └── lib/                      # Bibliotecas adicionales
│       └── nodo360-resources/    # Gestión de recursos
│
├── scripts/                      # Scripts de build y migración
│   └── migrate-courses.ts        # Script de migración de cursos
│
├── .claude/                      # Configuración de Claude Code
│
├── next.config.ts                # Configuración de Next.js
├── tsconfig.json                 # Configuración de TypeScript
├── tailwind.config.js            # Configuración de Tailwind CSS
├── package.json                  # Dependencias y scripts
│
└── Documentación
    ├── CLAUDE.md                 # Este archivo
    ├── README.md                 # README del proyecto
    ├── SCHEMA_APPLICATION.md     # Guía de configuración del esquema
    └── LOGO-IMPLEMENTATION-REPORT.md
```

---

## Esquema de Base de Datos y Tipos

### Tablas de Base de Datos

La plataforma utiliza **7 tablas principales**:

1. **`users`** - Perfiles de usuario (extiende auth.users)
2. **`courses`** - Información de cursos
3. **`modules`** - Módulos/secciones de cursos
4. **`lessons`** - Lecciones individuales
5. **`user_progress`** - Seguimiento de completado de lecciones
6. **`bookmarks`** - Marcadores de usuario
7. **`notes`** - Notas de usuario con timestamps

### Relaciones Clave

```
users (1) ──┬── (many) user_progress
            ├── (many) bookmarks
            └── (many) notes

courses (1) ──┬── (many) modules
              └── (1) instructor (users)

modules (1) ─── (many) lessons

lessons (1) ──┬── (many) user_progress
              ├── (many) bookmarks
              └── (many) notes
```

### Sistema de Tipos

Todos los tipos de base de datos están definidos en **`types/database.ts`**. Esta es la **única fuente de verdad** para los tipos.

#### Tipos Básicos

```typescript
// Tipos de entidades básicas
type Course
type Module
type Lesson
type User
type UserProgress
type Bookmark
type Note

// Enums
type UserRole = 'student' | 'instructor' | 'admin'
type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
type CourseStatus = 'draft' | 'published' | 'archived'
type CourseCategory = 'bitcoin' | 'blockchain' | 'defi' | 'nfts' | 'development' | 'trading' | 'other'
```

#### Tipos con Relaciones

```typescript
// Con relaciones
type CourseWithInstructor       // Course + detalles del instructor
type CourseWithModules          // Course + modules + lessons (árbol completo)
type LessonWithRelations        // Lesson + module + course (CRÍTICO - ver abajo)
type LessonWithDetails          // Lesson + module/course parcial
```

#### Tipos Insert/Update

```typescript
type InsertCourse   // Omite: id, created_at, updated_at, published_at
type InsertModule   // Omite: id, created_at, updated_at
type InsertLesson   // Omite: id, created_at, updated_at
type UpdateCourse   // Partial<Course> & { id: string }
// etc.
```

### CRÍTICO: Convención de Estructura de Datos

**SIEMPRE usar nombres de relaciones en singular:**

```typescript
// ✅ CORRECTO - Usar esta estructura SIEMPRE
lesson.module.course  // Singular

// ❌ INCORRECTO - Nunca usar esto
lesson.modules.courses  // Plural
```

Esta convención se aplica en `lib/db/courses-queries.ts` y debe mantenerse en todo el código base.

---

## Convenciones y Patrones Clave

### 1. Patrón de Obtención de Datos

**Componentes de Servidor (Preferido)**

```typescript
// app/cursos/[slug]/page.tsx
import { getCourseBySlug } from '@/lib/db/courses-queries'

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug)

  if (!course) {
    notFound()
  }

  return <CourseDetail course={course} />
}
```

**Componentes de Cliente (Cuando sea Necesario)**

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function ClientComponent() {
  const [data, setData] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('courses').select('*')
      setData(data)
    }
    fetchData()
  }, [])

  return <div>{/* ... */}</div>
}
```

### 2. Patrón de Consultas a Base de Datos

**Ubicación**: Todas las consultas en `lib/db/courses-queries.ts`

**Patrón**: Consultas separadas para asegurar consistencia en la estructura de datos

```typescript
// BUENO: Consultas separadas, joins manuales
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonWithRelations | null> {
  // PASO 1: Obtener el curso
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_premium')
    .eq('slug', courseSlug)
    .single()

  // PASO 2: Obtener los módulos
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', course.id)

  // PASO 3: Obtener la lección (filtrada por IDs de módulo)
  const moduleIds = modules.map(m => m.id)
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', lessonSlug)
    .in('module_id', moduleIds)
    .single()

  // PASO 4: Obtener el módulo completo
  const { data: module } = await supabase
    .from('modules')
    .select('*')
    .eq('id', lesson.module_id)
    .single()

  // PASO 5: Retornar con estructura consistente
  return {
    ...lesson,
    module: {
      ...module,
      course: course  // lesson.module.course (singular)
    }
  }
}
```

**¿Por qué este patrón?**
- Asegura la estructura `lesson.module.course` (singular)
- Filtra lecciones por módulos del curso para prevenir duplicados entre cursos
- Proporciona control total sobre la forma de los datos retornados

### 3. Convención de Logging

```typescript
import { logger } from '@/lib/utils/logger'

console.log('🔍 [functionName] Iniciando operación:', { param1, param2 })
console.log('✅ [functionName] Éxito:', result)
console.error('❌ [functionName] Error:', error)
logger.error('[functionName] Error:', error)
```

**Convención de Emojis**:
- 🔍 - Iniciando operación
- ✅ - Éxito
- ❌ - Error
- ℹ️ - Info
- ⚠️ - Advertencia

### 4. Convención de Nombres de Archivos

- **Pages**: `page.tsx` (convención Next.js)
- **Layouts**: `layout.tsx` (convención Next.js)
- **Componentes**: `ComponentName.tsx` (PascalCase)
- **Utilidades**: `kebab-case.ts`
- **Tipos**: `database.ts`, `lesson-content.ts`
- **Queries**: `*-queries.ts`

### 5. Patrón de Alias de Importación

Siempre usar el alias `@/` para importaciones:

```typescript
// ✅ CORRECTO
import { Course } from '@/types/database'
import { getCourseBySlug } from '@/lib/db/courses-queries'
import { createClient } from '@/lib/supabase/server'

// ❌ INCORRECTO
import { Course } from '../../../types/database'
```

### 6. Patrón de Estructura de Componentes

```typescript
// 1. Importaciones
import { type ComponentProps } from 'react'
import { type Course } from '@/types/database'

// 2. Definiciones de tipos
interface CourseCardProps {
  course: Course
  onClick?: () => void
}

// 3. Componente
export function CourseCard({ course, onClick }: CourseCardProps) {
  return (
    <div>
      {/* JSX del componente */}
    </div>
  )
}

// 4. Exports (si es necesario)
export type { CourseCardProps }
```

### 7. Patrón de Manejo de Errores

```typescript
// En Componentes de Servidor
async function getData() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')

  if (error) {
    console.error('❌ [getData] Error:', error)
    logger.error('[getData] Error:', error)
    throw error  // Dejar que el error boundary de Next.js lo maneje
  }

  return data
}

// En Rutas de API
export async function GET(request: Request) {
  try {
    const data = await getData()
    return Response.json({ data })
  } catch (error) {
    console.error('❌ [API] Error:', error)
    return Response.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    )
  }
}
```

---

## Flujo de Desarrollo

### Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar servidor de producción
npm start

# Lint del código
npm run lint

# Ejecutar script de migración
npm run migrate-courses
```

### Configuración del Entorno

Variables de entorno requeridas en `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Flujo de Git

**Nombres de Ramas**:
- Ramas de features: `claude/claude-md-{session-id}`
- Todo el desarrollo en ramas de features
- Nunca hacer push directamente a main

**Convención de Commits**:
```bash
# Ejemplos
feat: agregar dashboard de usuario
fix: resolver bug de navegación de lecciones
refactor: simplificar estructura de consultas de cursos
docs: actualizar CLAUDE.md
```

### Cambios en la Base de Datos

1. **Cambios en el schema**: Actualizar `supabase/schema.sql`
2. **Cambios en tipos**: Actualizar `types/database.ts`
3. **Cambios en queries**: Actualizar `lib/db/courses-queries.ts`
4. **Probar**: Verificar consistencia de estructura de datos

---

## Reglas Críticas para Asistentes IA

### ⚠️ SIEMPRE

1. **Usar nombres de relaciones en singular**: `lesson.module.course` (nunca plural)
2. **Leer archivos antes de editar**: Siempre usar herramienta Read antes de Edit/Write
3. **Seguir definiciones de tipos**: Usar tipos de `types/database.ts`
4. **Usar alias de rutas**: Importar con prefijo `@/`
5. **Registrar operaciones**: Usar convención de logging con emojis
6. **Verificar estructura de datos**: Verificar estructura `lesson.module.course` en consultas
7. **Preservar modo estricto de TypeScript**: Mantener seguridad de tipos
8. **Usar componentes de servidor**: Preferir componentes de servidor para obtención de datos
9. **Manejar errores apropiadamente**: Registrar y lanzar/retornar errores apropiados
10. **Probar flujo de datos**: Verificar consistencia de estructura de datos de extremo a extremo

### ⚠️ NUNCA

1. **Nunca usar relaciones plurales**: `lessons.modules.courses` está MAL
2. **Nunca saltarse lectura de archivos**: Siempre leer antes de editar
3. **Nunca ignorar tipos**: Todas las operaciones de base de datos deben estar tipadas
4. **Nunca hacer commit sin probar**: Verificar que los cambios no rompan la estructura
5. **Nunca mezclar estructuras de datos**: Mantener consistencia en todo el código base
6. **Nunca usar importaciones relativas**: Usar alias `@/` en su lugar
7. **Nunca deshabilitar checks de TypeScript**: Mantener modo estricto habilitado
8. **Nunca bypass de clientes Supabase**: Usar utilidades de cliente proporcionadas
9. **Nunca hardcodear datos**: Usar consultas de base de datos o archivos de configuración
10. **Nunca saltarse logging**: Siempre registrar operaciones para debugging

### 🎯 Regla de Estructura de Datos (MÁS CRÍTICO)

```typescript
// ✅ SIEMPRE usar esta estructura
interface LessonWithRelations {
  ...lessonFields,
  module: {
    ...moduleFields,
    course: {
      ...courseFields
    }
  }
}

// Patrón de acceso: lesson.module.course
const courseTitle = lesson.module.course.title  // ✅ CORRECTO

// ❌ NUNCA usar esto
const courseTitle = lesson.modules.courses.title  // ❌ MAL - Romperá todo
```

**Por qué esto importa:**
- Una refactorización reciente estableció esto como el estándar
- Todos los componentes esperan esta estructura
- Mezclar estructuras causa errores en tiempo de ejecución
- Las consultas están construidas para asegurar esta estructura

### 🔍 Antes de Hacer Cambios

**Checklist**:
- [ ] Leer el archivo que estás por modificar
- [ ] Verificar `types/database.ts` para los tipos correctos
- [ ] Revisar `lib/db/courses-queries.ts` para patrones de consultas
- [ ] Verificar que la estructura de datos coincida con el patrón `lesson.module.course`
- [ ] Probar que los cambios no rompan componentes existentes
- [ ] Agregar logging apropiado con emojis
- [ ] Actualizar tipos si el schema cambia

---

## Tareas Comunes y Ejemplos

### Tarea 1: Crear una Nueva Consulta de Base de Datos

**Archivo**: `lib/db/courses-queries.ts`

```typescript
/**
 * Obtener cursos destacados
 * @returns Lista de cursos destacados con info del instructor
 */
export async function getFeaturedCourses(): Promise<CourseWithInstructor[]> {
  console.log('🔍 [getFeaturedCourses] Obteniendo cursos destacados...')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:instructor_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .eq('is_featured', true)  // Asumiendo que este campo existe
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    console.error('❌ [getFeaturedCourses] Error:', error)
    logger.error('[getFeaturedCourses] Error:', error)
    throw error
  }

  console.log(`✅ [getFeaturedCourses] ${data?.length || 0} cursos encontrados`)
  return data || []
}
```

### Tarea 2: Crear una Nueva Página

**Archivo**: `app/featured/page.tsx`

```typescript
import { getFeaturedCourses } from '@/lib/db/courses-queries'
import { CourseCard } from '@/components/course/CourseCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cursos Destacados - Nodo360',
  description: 'Nuestros cursos más populares de Bitcoin y blockchain',
}

export default async function FeaturedPage() {
  const courses = await getFeaturedCourses()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Cursos Destacados</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}
```

### Tarea 3: Agregar un Nuevo Tipo

**Archivo**: `types/database.ts`

```typescript
// Agregar al archivo
export interface Review {
  id: string
  user_id: string
  course_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'full_name' | 'avatar_url'>
}

export type InsertReview = Omit<Review, 'id' | 'created_at' | 'updated_at'>
```

**Archivo**: `supabase/schema.sql`

```sql
-- Agregar a schema.sql
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_reviews_course_id ON public.reviews(course_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
```

### Tarea 4: Crear un Endpoint de API

**Archivo**: `app/api/reviews/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { type InsertReview, type ApiResponse } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json(
        { error: 'No autorizado' } as ApiResponse,
        { status: 401 }
      )
    }

    // Parsear request
    const body: InsertReview = await request.json()

    // Insertar review
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [POST /api/reviews] Error:', error)
      return Response.json(
        { error: 'Error al crear review' } as ApiResponse,
        { status: 500 }
      )
    }

    console.log('✅ [POST /api/reviews] Review creado:', data.id)
    return Response.json({ data } as ApiResponse)

  } catch (error) {
    console.error('❌ [POST /api/reviews] Error inesperado:', error)
    return Response.json(
      { error: 'Error interno del servidor' } as ApiResponse,
      { status: 500 }
    )
  }
}
```

### Tarea 5: Actualizar un Componente para Usar Nueva Consulta

**Archivo**: `components/course/CourseReviews.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'
import type { ReviewWithUser } from '@/types/database'

interface CourseReviewsProps {
  courseId: string
}

export async function CourseReviews({ courseId }: CourseReviewsProps) {
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:user_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [CourseReviews] Error:', error)
    return <div>Error al cargar reviews</div>
  }

  const typedReviews = reviews as ReviewWithUser[]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Reviews</h2>

      {typedReviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{review.user.full_name}</span>
            <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
          </div>
          <p className="text-gray-700">{review.comment}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Solución de Problemas

### Problema: Estructura de datos incorrecta retornada

**Síntoma**: Obtener `lesson.modules.courses` en lugar de `lesson.module.course`

**Solución**:
1. Verificar la consulta en `lib/db/courses-queries.ts`
2. Verificar uso del patrón de consultas separadas (no joins anidados de Supabase)
3. Construir manualmente el objeto de retorno con la estructura correcta
4. Ejemplo:
   ```typescript
   return {
     ...lesson,
     module: {           // singular
       ...module,
       course: course    // singular
     }
   }
   ```

### Problema: Errores de TypeScript en consultas de base de datos

**Solución**:
1. Verificar tipos en `types/database.ts`
2. Verificar que la consulta de Supabase coincida con el tipo esperado
3. Usar aserción de tipo si es necesario: `data as CourseWithModules`
4. Asegurarse de importar tipos desde `@/types/database`

### Problema: Lecciones del curso incorrecto aparecen

**Solución**:
1. En `getLessonBySlug`, filtrar lecciones por IDs de módulos del curso
2. Nunca consultar lecciones directamente por slug sin contexto de curso
3. Usar el patrón en `courses-queries.ts`:
   ```typescript
   const moduleIds = modules.map(m => m.id)
   const { data: lesson } = await supabase
     .from('lessons')
     .eq('slug', lessonSlug)
     .in('module_id', moduleIds)  // Filtrar por módulos del curso
   ```

### Problema: Errores de cliente Supabase

**Solución**:
1. Componentes de servidor: `import { createClient } from '@/lib/supabase/server'`
2. Componentes de cliente: `import { createClient } from '@/lib/supabase/client'`
3. Verificar variables de entorno en `.env.local`
4. Verificar que el proyecto de Supabase esté activo

### Problema: Errores de build

**Solución**:
1. Ejecutar `npm run build` para ver errores detallados
2. Verificar:
   - Tipos de retorno faltantes en funciones async
   - Desajustes de tipos en props
   - Variables no usadas (eliminar o prefijo con `_`)
   - Falta de await en llamadas async
3. Corregir errores de TypeScript antes de hacer commit

### Problema: Datos faltantes en consultas

**Solución**:
1. Verificar logs de consola para los pasos de consulta
2. Verificar que la base de datos tenga los datos esperados
3. Verificar políticas RLS (Row Level Security) en Supabase
4. Verificar que el usuario esté autenticado para rutas protegidas
5. Verificar filtros de consulta (eq, in, etc.)

---

## Recursos Adicionales

### Archivos de Documentación

- **`README.md`**: Visión general del proyecto e instrucciones de configuración
- **`SCHEMA_APPLICATION.md`**: Guía detallada para aplicar esquema de base de datos
- **`LOGO-IMPLEMENTATION-REPORT.md`**: Detalles de implementación del logo
- **`supabase/schema.sql`**: Esquema completo de base de datos (504 líneas)

### Archivos Clave para Referencias

- **`types/database.ts`**: Todas las definiciones de tipos (550 líneas)
- **`lib/db/courses-queries.ts`**: Patrones de consulta (478 líneas)
- **`lib/supabase/server.ts`**: Cliente Supabase de servidor
- **`lib/supabase/client.ts`**: Cliente Supabase de cliente
- **`next.config.ts`**: Configuración de Next.js
- **`tsconfig.json`**: Configuración de TypeScript

### Documentación Externa

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## Referencia Rápida

### Comandos Más Usados

```bash
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build para producción
npm run lint             # Ejecutar ESLint
```

### Importaciones Más Usadas

```typescript
// Tipos
import type { Course, CourseWithModules, LessonWithRelations } from '@/types/database'

// Consultas
import { getCourseBySlug, getLessonBySlug, getAllCourses } from '@/lib/db/courses-queries'

// Supabase
import { createClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'

// Next.js
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
```

### Tipos Más Importantes

```typescript
LessonWithRelations  // estructura lesson.module.course
CourseWithModules    // Árbol completo de curso
CourseWithInstructor // Curso con info del instructor
```

---

## Notas Finales

Este es un documento vivo. Actualizarlo cuando:
- El esquema de base de datos cambie
- Se establezcan nuevos patrones
- Se adopten nuevas convenciones
- Se descubran y corrijan bugs críticos
- Nuevas funcionalidades requieran nuevos flujos de trabajo

**Recordar**: El objetivo es mantener consistencia, seguridad de tipos, y la estructura de datos `lesson.module.course` en todo el código base.

Cuando tengas dudas:
1. Verifica este archivo
2. Revisa `types/database.ts`
3. Sigue los patrones en `lib/db/courses-queries.ts`
4. Prueba exhaustivamente antes de hacer commit

---

**¡Feliz codificación!** 🚀
