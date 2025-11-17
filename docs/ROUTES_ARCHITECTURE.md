# Arquitectura de Rutas del Sistema de Cursos

**Fecha de última actualización:** 2025-11-16
**Versión:** 2.0.0
**Decisión:** Arquitectura Jerárquica

---

## 📋 Resumen

Este documento describe la estructura oficial de rutas del sistema de cursos de Nodo360. Se adoptó una **arquitectura jerárquica** que refleja la relación natural entre cursos, módulos y lecciones.

### Estructura Oficial

```
/cursos
  └── /[courseSlug]
        ├── (página del curso)
        └── /modulos
              └── /[moduleSlug]
                    ├── (página del módulo)
                    ├── /lecciones
                    │     └── /[lessonSlug]
                    │           └── (página de lección)
                    └── /quiz
                          └── (página de quiz)
```

---

## 🎯 Ejemplos de URLs

### Página de Cursos
```
/cursos
```
**Descripción:** Lista de todos los cursos disponibles

### Página de Curso
```
/cursos/bitcoin-desde-cero
```
**Descripción:** Vista general del curso con módulos y lecciones

### Página de Módulo
```
/cursos/bitcoin-desde-cero/modulos/introduccion
```
**Descripción:** Vista detallada de un módulo con sus lecciones

### Página de Lección
```
/cursos/bitcoin-desde-cero/modulos/introduccion/lecciones/que-es-bitcoin
```
**Descripción:** Contenido de una lección específica

### Página de Quiz
```
/cursos/bitcoin-desde-cero/modulos/introduccion/quiz
```
**Descripción:** Quiz del módulo

---

## 📂 Estructura de Archivos

```
app/cursos/
├── page.tsx                                          # Lista de cursos
├── [courseSlug]/
│   ├── page.tsx                                     # Detalle del curso
│   └── modulos/
│       └── [moduleSlug]/
│           ├── page.tsx                             # Detalle del módulo
│           ├── lecciones/
│           │   └── [lessonSlug]/
│           │       └── page.tsx                     # Contenido de lección
│           └── quiz/
│               └── page.tsx                         # Quiz del módulo
```

---

## 🔧 Tipos TypeScript

### Interfaces de PageProps

```typescript
// app/cursos/page.tsx
interface CursosPageProps {
  // No params
}

// app/cursos/[courseSlug]/page.tsx
interface CoursePageProps {
  params: { courseSlug: string }
}

// app/cursos/[courseSlug]/modulos/[moduleSlug]/page.tsx
interface ModulePageProps {
  params: { courseSlug: string; moduleSlug: string }
}

// app/cursos/[courseSlug]/modulos/[moduleSlug]/lecciones/[lessonSlug]/page.tsx
interface LessonPageProps {
  params: { courseSlug: string; moduleSlug: string; lessonSlug: string }
}

// app/cursos/[courseSlug]/modulos/[moduleSlug]/quiz/page.tsx
interface QuizPageProps {
  params: { courseSlug: string; moduleSlug: string }
  searchParams: { start?: string }
}
```

---

## 🧭 Generación de Enlaces

### ❌ INCORRECTO (Estructura Antigua)

```typescript
// NO usar
<Link href={`/cursos/${courseSlug}/${lessonSlug}`}>

// NO usar
router.push(`/cursos/${courseSlug}/${lessonSlug}`)
```

### ✅ CORRECTO (Estructura Jerárquica)

```typescript
// Enlace a curso
<Link href={`/cursos/${courseSlug}`}>

// Enlace a módulo
<Link href={`/cursos/${courseSlug}/modulos/${moduleSlug}`}>

// Enlace a lección
<Link href={`/cursos/${courseSlug}/modulos/${moduleSlug}/lecciones/${lessonSlug}`}>

// Enlace a quiz
<Link href={`/cursos/${courseSlug}/modulos/${moduleSlug}/quiz`}>

// Navegación programática
router.push(`/cursos/${courseSlug}/modulos/${moduleSlug}/lecciones/${lessonSlug}`)
```

---

## 📝 Componentes Actualizados

Los siguientes componentes fueron actualizados para usar la nueva estructura:

### Componentes de Navegación
- ✅ `components/course/LessonList.tsx`
- ✅ `components/course/CourseSidebar.tsx`
- ✅ `components/course/ModuleAccordion.tsx`

### Componentes de Lección
- ✅ `components/lesson/LessonPageWrapper.tsx`
- ✅ `components/lesson/CompleteButton.tsx`
- ✅ `components/lesson/LessonNavigation.tsx`
- ✅ `components/lesson/OldLessonLayoutFull.tsx`

### Páginas
- ✅ `app/cursos/[courseSlug]/page.tsx` (Botón "Comenzar curso")
- ✅ `app/cursos/[courseSlug]/modulos/[moduleSlug]/page.tsx`
- ✅ `app/cursos/[courseSlug]/modulos/[moduleSlug]/lecciones/[lessonSlug]/page.tsx`

---

## 🔍 Convenciones

### Naming de Slugs

- **courseSlug:** Identificador único del curso (ej: `bitcoin-desde-cero`)
- **moduleSlug:** Identificador único del módulo dentro del curso (ej: `introduccion`)
- **lessonSlug:** Identificador único de la lección dentro del módulo (ej: `que-es-bitcoin`)

### Reglas de Slugs

1. Solo usar minúsculas
2. Separar palabras con guiones (`-`)
3. No usar caracteres especiales excepto guiones
4. Máximo 50 caracteres
5. Deben ser únicos dentro de su contexto (módulo/curso)

**Ejemplos válidos:**
- ✅ `bitcoin-desde-cero`
- ✅ `introduccion-a-bitcoin`
- ✅ `que-es-la-blockchain`

**Ejemplos inválidos:**
- ❌ `Bitcoin Desde Cero` (espacios)
- ❌ `introducción-a-bitcoin` (acentos)
- ❌ `que_es_bitcoin` (guiones bajos)

---

## 🎨 Funciones de Datos

Las siguientes funciones en `lib/db/courses-queries.ts` están optimizadas para la nueva estructura:

```typescript
// Obtener curso con módulos y lecciones
getCourseBySlug(courseSlug: string): Promise<CourseWithModules | null>

// Obtener lección específica (incluye validación de módulo)
getLessonBySlug(courseSlug: string, lessonSlug: string): Promise<LessonWithRelations | null>

// Obtener todas las lecciones de un curso (ordenadas)
getAllLessonsForCourse(courseSlug: string): Promise<LessonWithRelations[]>
```

**Estructura de Datos Garantizada:**
```typescript
lesson.module.course  // ✅ SIEMPRE singular
lesson.modules.courses // ❌ NUNCA plural
```

---

## 🚀 Migración

### Archivos Eliminados

- ❌ `app/cursos/[courseSlug]/[lessonSlug]/page.tsx` (Estructura antigua)

### Archivos Nuevos

- ✅ `app/cursos/[courseSlug]/modulos/[moduleSlug]/lecciones/[lessonSlug]/page.tsx`

### Cambios en Props

Los componentes ahora reciben `moduleSlug` adicional:

```typescript
// Antes
interface LessonProps {
  courseSlug: string
  lessonSlug: string
  nextLessonSlug?: string
}

// Ahora
interface LessonProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
  nextLessonSlug?: string
  nextLessonModuleSlug?: string // Para navegación entre módulos
}
```

---

## ⚠️ Casos Especiales

### Navegación entre Módulos

Cuando el usuario completa la última lección de un módulo, la siguiente lección puede estar en otro módulo:

```typescript
// La siguiente lección puede tener diferente moduleSlug
const nextLesson = {
  slug: 'primera-leccion',
  moduleSlug: 'modulo-2', // ⚠️ Diferente del módulo actual
}

// Generar URL correcta
const nextUrl = `/cursos/${courseSlug}/modulos/${nextLesson.moduleSlug}/lecciones/${nextLesson.slug}`
```

### Lecciones sin content_json

Para lecciones antiguas que usan HTML en lugar de JSON:

```typescript
// Usar OldLessonLayoutFull
if (!hasJsonContent(lesson)) {
  return (
    <OldLessonLayoutFull
      lesson={lesson}
      courseSlug={courseSlug}
      moduleSlug={moduleSlug}
      previousLesson={prevLesson}
      nextLesson={nextLesson}
    />
  )
}
```

---

## 📊 Ventajas de la Arquitectura Jerárquica

1. **Semántica Clara:** Las URLs reflejan la jerarquía real de contenido
2. **Escalable:** Fácil agregar niveles (ej: secciones dentro de lecciones)
3. **SEO Friendly:** URLs descriptivas y estructuradas
4. **Mantenible:** Código más organizado y predecible
5. **Compatible con Analytics:** Fácil trackear navegación por nivel
6. **Sin Conflictos:** Los slugs son únicos dentro de su contexto

---

## 🧪 Testing

### Verificar Rutas

```bash
# Buscar usos de estructura antigua
grep -r "/cursos/\${courseSlug}/\${lessonSlug}" .

# Buscar params incorrectos
grep -r "params\.slug[^:]" app/

# Verificar todos los componentes de navegación
grep -r "href=.*cursos" components/
```

### URLs a Probar

1. Lista de cursos: `/cursos`
2. Detalle de curso: `/cursos/bitcoin-desde-cero`
3. Detalle de módulo: `/cursos/bitcoin-desde-cero/modulos/introduccion`
4. Lección: `/cursos/bitcoin-desde-cero/modulos/introduccion/lecciones/que-es-bitcoin`
5. Quiz: `/cursos/bitcoin-desde-cero/modulos/introduccion/quiz`

---

## 📚 Referencias

- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [URL Structure Best Practices](https://developers.google.com/search/docs/crawling-indexing/url-structure)
- Decisión de arquitectura: Ver `ROUTE_PARAMS_FIX_SUMMARY.md`

---

## 🔄 Historial de Cambios

### v2.0.0 (2025-11-16)
- ✅ Implementada arquitectura jerárquica
- ✅ Eliminada estructura plana antigua
- ✅ Actualizados 11 componentes
- ✅ Actualizadas 3 páginas principales
- ✅ Añadido soporte para navegación entre módulos

### v1.0.0 (Anterior)
- ❌ Estructura plana: `/cursos/[courseSlug]/[lessonSlug]`
- ❌ Conflictos potenciales de slugs
- ❌ URLs menos descriptivas
