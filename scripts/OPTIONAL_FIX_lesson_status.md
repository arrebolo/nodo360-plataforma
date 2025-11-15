# 🔧 MEJORA OPCIONAL: Filtrar Lecciones por Status

## 📋 PROBLEMA IDENTIFICADO

La función `getLessonBySlug()` en `lib/db/queries.ts` **NO filtra** lecciones por `status = 'published'`.

Esto significa que podría devolver lecciones en estado `draft`, `archived`, etc.

## 🔍 CÓDIGO ACTUAL

```typescript
// lib/db/queries.ts línea 498-551
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons')
    .select(`...`)
    .eq('slug', lessonSlug)
    // ❌ NO HAY FILTRO POR STATUS
    .single()

  // ... resto del código
}
```

## ✅ CÓDIGO MEJORADO

```typescript
// lib/db/queries.ts línea 498-551
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      content_json,
      module:module_id (
        id,
        title,
        course_id,
        course:course_id (
          id,
          title,
          slug,
          is_premium
        )
      )
    `)
    .eq('slug', lessonSlug)
    .eq('status', 'published')  // ✅ AÑADIR ESTA LÍNEA
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    logger.error('[getLessonBySlug] Error:', error)
    throw error
  }

  // Verify the lesson belongs to the correct course
  const moduleCourseSlug = (data.module as any)?.course?.slug
  if (moduleCourseSlug !== courseSlug) {
    logger.debug('getLessonBySlug', { courseSlug, lessonSlug, mismatch: true })
    return null
  }

  logger.debug('getLessonBySlug', { courseSlug, lessonSlug, found: true })
  return data as any
}
```

## 🎯 CUÁNDO APLICAR ESTA MEJORA

### ✅ Aplica esta mejora SI:
- Trabajas con lecciones en múltiples estados (draft, published, archived)
- Quieres asegurar que solo se muestren lecciones publicadas
- Estás teniendo problemas donde lecciones en draft se muestran públicamente

### ⏸️ NO apliques esta mejora SI:
- Todas tus lecciones están siempre en estado 'published'
- Necesitas mostrar lecciones en draft en ciertos contextos
- Prefieres controlar el status en la capa de UI en lugar de la capa de datos

## 📝 CÓMO APLICAR

### Opción A: Editar Manualmente

1. Abre `lib/db/queries.ts`
2. Ve a la línea 533
3. Añade después de `.eq('slug', lessonSlug)`:
   ```typescript
   .eq('status', 'published')
   ```

### Opción B: Usar el Siguiente Comando

```bash
# En Windows PowerShell o CMD
# (Reemplaza la línea completa)
```

O simplemente usa tu editor y añade la línea manualmente.

## ⚖️ PROS Y CONTRAS

### ✅ PROS:
- Seguridad: No se pueden acceder lecciones en draft con URL directa
- Consistencia: Mismo comportamiento que `getCourseBySlug()`
- Claridad: Explícito sobre qué lecciones se devuelven

### ❌ CONTRAS:
- Si necesitas preview de lecciones en draft, necesitarás otra función
- Menos flexible si quieres diferentes lógicas de visibilidad

## 🔄 ALTERNATIVA: Función Separada para Preview

Si necesitas mostrar lecciones en draft a veces (por ejemplo, para instructores), crea una función separada:

```typescript
export async function getLessonBySlugIncludingDraft(
  courseSlug: string,
  lessonSlug: string
) {
  // Misma lógica pero sin filtro de status
}
```

## 📊 COMPARACIÓN

| Aspecto | Sin Filtro (Actual) | Con Filtro (Propuesto) |
|---------|---------------------|------------------------|
| Lecciones publicadas | ✅ Devuelve | ✅ Devuelve |
| Lecciones en draft | ⚠️ Devuelve | ❌ NO devuelve |
| Lecciones archivadas | ⚠️ Devuelve | ❌ NO devuelve |
| Seguridad | ⚠️ Media | ✅ Alta |
| Flexibilidad | ✅ Alta | ⚠️ Media |

## 🎯 RECOMENDACIÓN

**APLICA ESTA MEJORA** si:
1. El diagnóstico muestra que tienes lecciones con `status != 'published'`
2. Quieres asegurar que solo lecciones publicadas son accesibles
3. Seguir el mismo patrón que `getCourseBySlug()` (que sí filtra por status)

**NO APLIQUES** si:
1. Todas tus lecciones siempre están publicadas
2. Ya aplicaste otras correcciones y todo funciona
3. Necesitas flexibilidad para mostrar lecciones en diferentes estados

---

**Nota:** Esta es una mejora opcional, NO es la causa del error 404. La causa del 404 es muy probablemente que los slugs en la base de datos no coinciden con las URLs esperadas.
