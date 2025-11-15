# 🔍 DIAGNÓSTICO COMPLETO DE SLUGS - NODO360 PLATAFORMA

## 📋 RESUMEN EJECUTIVO

Este documento contiene el diagnóstico completo del problema de 404 en rutas de lecciones en Vercel, a pesar de tener `dynamicParams = true` configurado correctamente.

**Hipótesis Principal:** Los slugs en la base de datos de Supabase no coinciden con las URLs esperadas.

---

## 🛠️ HERRAMIENTAS DE DIAGNÓSTICO CREADAS

### 1. Script Node.js: `scripts/diagnose-slugs.js`
Script automatizado que consulta Supabase y muestra todos los slugs.

**Ejecutar en tu Windows:**
```bash
node scripts/diagnose-slugs.js
```

### 2. Consultas SQL: `scripts/DIAGNOSTIC_QUERIES.sql`
Queries SQL para ejecutar directamente en Supabase Dashboard.

**Ejecutar en:**
https://supabase.com/dashboard/project/gcahtbecfidroepelcuw/sql

---

## 🔎 ANÁLISIS DE CÓDIGO DE BÚSQUEDA

### ✅ Funciones Revisadas en `lib/db/queries.ts`:

#### `getCourseBySlug()` (línea 57-91)
```typescript
.from('courses')
.select('*')
.eq('slug', slug)           // ✅ Busca por slug
.eq('status', 'published')  // ✅ Solo publicados
.single()                   // ✅ Devuelve null si no encuentra
```
**Veredicto:** Lógica correcta ✅

#### `getLessonBySlug()` (línea 498-551)
```typescript
.from('lessons')
.select('*')
.eq('slug', lessonSlug)     // ✅ Busca por slug
.single()                   // ✅ Devuelve null si no encuentra

// Verifica que pertenezca al curso correcto:
if (moduleCourseSlug !== courseSlug) {
  return null
}
```
**Veredicto:** Lógica correcta ✅

⚠️ **NOTA:** No filtra por `status = 'published'` en lecciones. Esto podría causar problemas si hay lecciones en draft.

---

## 📊 PASOS PARA EJECUTAR DIAGNÓSTICO

### Opción A: Script en Windows (Recomendado)

1. Abre PowerShell o CMD en el proyecto:
   ```bash
   cd C:\Users\alber\nodo360-projects\nodo360-plataforma
   ```

2. Ejecuta el script de diagnóstico:
   ```bash
   node scripts/diagnose-slugs.js
   ```

3. El script mostrará:
   - ✅ Todos los cursos con sus slugs
   - ✅ Todas las lecciones con sus slugs
   - ✅ Verificación específica de `/cursos/bitcoin-desde-cero/leccion-1-1`
   - ✅ Lista de URLs válidas

### Opción B: Consultas SQL en Supabase Dashboard

1. Accede a: https://supabase.com/dashboard/project/gcahtbecfidroepelcuw/sql

2. Copia y ejecuta las queries de `scripts/DIAGNOSTIC_QUERIES.sql`

3. Ejecuta en este orden:
   - Query 1: Listar todos los cursos
   - Query 2: Listar todas las lecciones
   - Query 3a: Verificar curso "bitcoin-desde-cero"
   - Query 3b: Verificar lección "leccion-1-1"
   - Query 4: Buscar variaciones de slugs
   - Query 5: Verificar integridad
   - Query 6: Generar URLs válidas

---

## ⚠️ PROBLEMAS POTENCIALES IDENTIFICADOS

### 1. **Slugs No Coinciden con URLs**
**Síntoma:** El curso o lección existen pero con slug diferente.

**Ejemplo:**
- URL esperada: `/cursos/bitcoin-desde-cero`
- Slug real en DB: `bitcoin-101` o `curso-bitcoin`

**Solución:** Ver sección "Correcciones SQL" más abajo.

### 2. **Lecciones en Estado Draft**
**Síntoma:** La lección existe pero no está publicada.

**Verificación SQL:**
```sql
SELECT id, title, slug, status
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
  AND l.slug = 'leccion-1-1';
```

**Solución:** Si `status != 'published'`, actualizar:
```sql
UPDATE lessons
SET status = 'published'
WHERE slug = 'leccion-1-1';
```

### 3. **Curso en Estado Draft**
**Verificación SQL:**
```sql
SELECT id, title, slug, status
FROM courses
WHERE slug = 'bitcoin-desde-cero';
```

**Solución:** Si `status != 'published'`, actualizar:
```sql
UPDATE courses
SET status = 'published'
WHERE slug = 'bitcoin-desde-cero';
```

### 4. **Slugs Vacíos o NULL**
**Verificación SQL:**
```sql
-- Cursos sin slug
SELECT id, title FROM courses WHERE slug IS NULL OR slug = '';

-- Lecciones sin slug
SELECT id, title FROM lessons WHERE slug IS NULL OR slug = '';
```

**Solución:** Generar slugs automáticamente (ver sección siguiente).

### 5. **Slugs Duplicados**
**Verificación SQL:**
```sql
-- Cursos duplicados
SELECT slug, COUNT(*) FROM courses GROUP BY slug HAVING COUNT(*) > 1;

-- Lecciones duplicadas en mismo curso
SELECT c.slug, l.slug, COUNT(*)
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
GROUP BY c.slug, l.slug
HAVING COUNT(*) > 1;
```

**Solución:** Renombrar slugs duplicados añadiendo sufijos.

---

## 🔧 CORRECCIONES SQL COMUNES

### Opción 1: Actualizar Slug de Curso

Si el curso existe pero con slug diferente:

```sql
UPDATE courses
SET slug = 'bitcoin-desde-cero'
WHERE id = 'ID_DEL_CURSO';
```

### Opción 2: Actualizar Slug de Lección

Si la lección existe pero con slug diferente:

```sql
UPDATE lessons
SET slug = 'leccion-1-1'
WHERE id = 'ID_DE_LA_LECCION';
```

### Opción 3: Generar Slugs Automáticamente

Si tienes cursos/lecciones sin slugs:

```sql
-- Para cursos: convertir título a slug
UPDATE courses
SET slug = LOWER(
  REPLACE(
    REPLACE(title, ' ', '-'),
    'á', 'a'
  )
)
WHERE slug IS NULL OR slug = '';

-- Para lecciones: generar slug basado en orden
UPDATE lessons l
SET slug = CONCAT('leccion-', m.order_index, '-', l.order_index)
FROM modules m
WHERE l.module_id = m.id
  AND (l.slug IS NULL OR l.slug = '');
```

### Opción 4: Publicar Todos los Cursos y Lecciones

Si están en draft:

```sql
-- Publicar cursos
UPDATE courses SET status = 'published' WHERE status != 'published';

-- Publicar lecciones
UPDATE lessons SET status = 'published' WHERE status != 'published';
```

---

## 🔍 VERIFICACIÓN POST-CORRECCIÓN

Después de aplicar correcciones, verifica:

### 1. En Supabase Dashboard
```sql
-- Verificar curso específico
SELECT id, title, slug, status FROM courses WHERE slug = 'bitcoin-desde-cero';

-- Verificar lección específica
SELECT l.id, l.title, l.slug, l.status, c.slug as curso_slug
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero' AND l.slug = 'leccion-1-1';
```

### 2. En Vercel (después de deploy)
```bash
# Probar URLs:
https://tu-dominio.vercel.app/cursos/bitcoin-desde-cero
https://tu-dominio.vercel.app/cursos/bitcoin-desde-cero/leccion-1-1
```

### 3. En Local (Windows)
```bash
npm run dev

# Abrir navegador:
http://localhost:3000/cursos/bitcoin-desde-cero
http://localhost:3000/cursos/bitcoin-desde-cero/leccion-1-1
```

---

## 📝 POSIBLES ESCENARIOS Y SOLUCIONES

### Escenario A: "No existe el curso con ese slug"

**Diagnóstico:**
```sql
SELECT slug, title FROM courses ORDER BY slug;
```

**Soluciones:**
1. Crear el curso con el slug correcto
2. Actualizar el slug del curso existente
3. Cambiar las URLs en el código para usar el slug correcto

### Escenario B: "No existe la lección con ese slug"

**Diagnóstico:**
```sql
SELECT l.slug, l.title, c.slug as curso_slug
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
ORDER BY m.order_index, l.order_index;
```

**Soluciones:**
1. Crear la lección con el slug correcto
2. Actualizar el slug de la lección existente
3. Cambiar las URLs en el código para usar el slug correcto

### Escenario C: "Todo existe pero sigue dando 404"

**Posibles causas:**
1. Cache de Vercel no actualizado
2. Lecciones/cursos en estado draft
3. Problema de permisos RLS en Supabase

**Soluciones:**
```sql
-- 1. Verificar status
SELECT status FROM courses WHERE slug = 'bitcoin-desde-cero';
SELECT status FROM lessons WHERE slug = 'leccion-1-1';

-- 2. Publicar si están en draft
UPDATE courses SET status = 'published' WHERE slug = 'bitcoin-desde-cero';
UPDATE lessons SET status = 'published' WHERE slug = 'leccion-1-1';

-- 3. Verificar RLS (Row Level Security)
-- Ve a Supabase Dashboard > Authentication > Policies
-- Asegúrate de que las políticas permiten lectura anónima
```

**En Vercel:**
- Redeployar para limpiar cache
- Verificar logs en Vercel Dashboard

---

## 🎯 MEJORA ADICIONAL SUGERIDA

### Añadir Filtro de Status en Lecciones

Actualmente `getLessonBySlug()` no filtra por status. Para evitar mostrar lecciones en draft:

```typescript
// En lib/db/queries.ts línea 498-551
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons')
    .select(`...`)
    .eq('slug', lessonSlug)
    .eq('status', 'published')  // ✅ AÑADIR ESTA LÍNEA
    .single()

  // ... resto del código
}
```

---

## 📞 PRÓXIMOS PASOS

1. **Ejecuta el diagnóstico:**
   ```bash
   node scripts/diagnose-slugs.js
   ```

2. **Identifica la discrepancia:**
   - ¿Existe el curso "bitcoin-desde-cero"?
   - ¿Existe la lección "leccion-1-1"?
   - ¿Cuáles son los slugs reales?

3. **Aplica la corrección SQL correspondiente**

4. **Redeploya en Vercel**

5. **Verifica que las URLs funcionan:**
   - `/cursos/[slug-real-del-curso]`
   - `/cursos/[slug-real-del-curso]/[slug-real-de-leccion]`

---

## 📊 FORMATO DE REPORTE ESPERADO

Después de ejecutar el diagnóstico, espero ver algo como:

```
📊 SLUGS EN BASE DE DATOS:

Cursos:
- [abc123] Bitcoin desde Cero → slug: "bitcoin-101"  ⚠️ NO COINCIDE
- [def456] Ethereum Básico → slug: "ethereum-basico"  ✅

Lecciones del curso bitcoin-101:
- [xyz789] Introducción → slug: "introduccion"  ⚠️ NO COINCIDE
- [aaa111] Qué es Bitcoin → slug: "que-es-bitcoin"  ✅

⚠️ DISCREPANCIAS:
- URL intentada: /cursos/bitcoin-desde-cero
- Slug en DB: "bitcoin-101"
- ❌ NO coincide

✅ CORRECCIONES APLICADAS:
UPDATE courses SET slug = 'bitcoin-desde-cero' WHERE id = 'abc123';
UPDATE lessons SET slug = 'leccion-1-1' WHERE id = 'xyz789';

🔗 URLS CORRECTAS (después de corrección):
- /cursos/bitcoin-desde-cero
- /cursos/bitcoin-desde-cero/leccion-1-1
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Ejecutado script de diagnóstico (`node scripts/diagnose-slugs.js`)
- [ ] Identificados slugs reales en la base de datos
- [ ] Comparados con URLs esperadas
- [ ] Aplicadas correcciones SQL si es necesario
- [ ] Verificado status = 'published' en cursos y lecciones
- [ ] Redeployado en Vercel
- [ ] Probadas URLs en producción
- [ ] Verificado que no hay errores 404

---

## 🆘 SI TODO FALLA

Si después de este diagnóstico el problema persiste, proporcióname:

1. Salida completa de `node scripts/diagnose-slugs.js`
2. Screenshot del error 404 en Vercel
3. Logs de Vercel (Vercel Dashboard > Logs)
4. Confirmación de que las variables de entorno están configuradas en Vercel

---

**Creado:** 2025-11-15
**Versión:** 1.0
**Autor:** Claude Code - Diagnóstico de Rutas 404
