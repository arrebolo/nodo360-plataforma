# 🚨 INSTRUCCIONES URGENTES - DIAGNÓSTICO DE SLUGS

## ✅ SCRIPT CORREGIDO

El script `scripts/diagnose-slugs.js` ha sido corregido eliminando las referencias a la columna `lessons.status` que no existe.

---

## ⚡ OPCIÓN A: EJECUTAR SCRIPT EN WINDOWS (RECOMENDADO)

El script corregido ya funciona. Ejecútalo en tu Windows:

```bash
cd C:\Users\alber\nodo360-projects\nodo360-plataforma
node scripts/diagnose-slugs.js
```

**Esto te mostrará:**
- ✅ Todos los cursos con sus slugs
- ✅ Todas las lecciones con sus slugs
- ✅ Si existe "bitcoin-desde-cero/leccion-1-1"
- ✅ URLs válidas basadas en slugs reales

---

## ⚡ OPCIÓN B: CONSULTAS SQL DIRECTAS (MÁS RÁPIDO)

Si no puedes ejecutar el script, usa estas consultas SQL en Supabase:

### 1. Accede a Supabase SQL Editor:
https://supabase.com/dashboard/project/gcahtbecfidroepelcuw/sql

### 2. Ejecuta estas queries en orden:

#### Query 1: ¿Existe el curso "bitcoin-desde-cero"?
```sql
SELECT id, title, slug, status
FROM courses
WHERE slug = 'bitcoin-desde-cero';
```

**Resultado esperado:**
- Si devuelve 1 fila: ✅ El curso existe
- Si devuelve 0 filas: ❌ El curso NO existe o tiene otro slug

---

#### Query 2: Listar TODAS las lecciones del curso
```sql
SELECT
  l.id,
  l.title,
  l.slug,
  l.order_index,
  m.title as modulo_titulo,
  CONCAT('/cursos/bitcoin-desde-cero/', l.slug) as url_completa
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
ORDER BY m.order_index, l.order_index;
```

**Esto te mostrará:**
- ✅ Todas las lecciones del curso
- ✅ Sus slugs reales
- ✅ Las URLs que funcionarían

---

#### Query 3: ¿Existe la lección "leccion-1-1"?
```sql
SELECT
  l.id,
  l.title,
  l.slug,
  CONCAT('/cursos/bitcoin-desde-cero/', l.slug) as url_completa
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
  AND l.slug = 'leccion-1-1';
```

**Resultado esperado:**
- Si devuelve 1 fila: ✅ La lección existe con ese slug
- Si devuelve 0 filas: ❌ La lección NO existe o tiene otro slug

---

#### Query 4: Buscar slugs similares
```sql
SELECT
  l.slug,
  l.title,
  CONCAT('/cursos/bitcoin-desde-cero/', l.slug) as url_completa
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
  AND (l.slug ILIKE '%1-1%' OR l.slug ILIKE '%leccion%')
ORDER BY l.order_index;
```

**Esto busca variaciones como:**
- `1-1`, `leccion-1`, `leccion-1.1`, etc.

---

## 🔧 CORRECCIONES SEGÚN RESULTADOS

### ESCENARIO 1: El curso NO existe

**Si Query 1 devuelve 0 filas:**

```sql
-- Ver qué cursos existen
SELECT slug, title FROM courses ORDER BY slug;
```

**Luego decide:**
- Opción A: Actualizar el slug del curso existente
- Opción B: Crear el curso con slug correcto

---

### ESCENARIO 2: El curso existe pero la lección NO

**Si Query 2 muestra lecciones pero con slugs diferentes:**

Ejemplo: La lección se llama `"1-1"` en vez de `"leccion-1-1"`

**Corrección SQL:**
```sql
UPDATE lessons
SET slug = 'leccion-1-1'
WHERE id = 'REEMPLAZA_CON_EL_ID_DE_LA_QUERY_2';
```

---

### ESCENARIO 3: No hay lecciones en el curso

**Si Query 2 devuelve 0 filas:**

Esto significa que el curso existe pero no tiene lecciones. Necesitas:
1. Crear las lecciones en Supabase Dashboard
2. O verificar que los módulos estén correctamente asociados

---

### ESCENARIO 4: Todo existe pero con formato diferente

**Ejemplo de Query 2:**
```
slug: "1-1"          ← Real
slug: "leccion-1-1"  ← Esperado
```

**Corrección masiva:**
```sql
-- Añadir prefijo "leccion-" a todas las lecciones del curso
UPDATE lessons l
SET slug = CONCAT('leccion-', l.slug)
FROM modules m, courses c
WHERE l.module_id = m.id
  AND m.course_id = c.id
  AND c.slug = 'bitcoin-desde-cero'
  AND l.slug NOT LIKE 'leccion-%';
```

---

## 📋 CHECKLIST RÁPIDO

Ejecuta en orden y marca:

- [ ] Query 1: ¿Existe curso "bitcoin-desde-cero"? → Resultado: ______
- [ ] Query 2: ¿Cuántas lecciones tiene? → Resultado: ______
- [ ] Query 3: ¿Existe lección "leccion-1-1"? → Resultado: ______
- [ ] Query 4: ¿Qué slugs similares existen? → Resultado: ______
- [ ] Aplicada corrección SQL (si fue necesaria)
- [ ] Verificado que ahora funciona

---

## 📊 FORMATO DE REPORTE

**Copia y pégame los resultados en este formato:**

```
QUERY 1 - Curso "bitcoin-desde-cero":
[Pega el resultado aquí]

QUERY 2 - Lecciones del curso:
[Pega el resultado aquí]

QUERY 3 - Lección "leccion-1-1":
[Pega el resultado aquí]

QUERY 4 - Slugs similares:
[Pega el resultado aquí]
```

Con esa información generaré el SQL exacto para corregir.

---

## 🆘 SOLUCIÓN RÁPIDA SI TODO FALLA

Si las queries no devuelven datos o no estás seguro, ejecuta esto para ver **TODO**:

```sql
-- Ver TODOS los cursos
SELECT slug, title FROM courses;

-- Ver TODAS las lecciones de TODOS los cursos
SELECT
  c.slug as curso_slug,
  l.slug as leccion_slug,
  l.title as leccion_titulo,
  CONCAT('/cursos/', c.slug, '/', l.slug) as url_completa
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
ORDER BY c.slug, l.order_index;
```

Esto te mostrará TODO lo que hay en la base de datos.

---

## ✅ PRÓXIMOS PASOS

1. **AHORA:** Ejecuta las 4 queries en Supabase SQL Editor
2. **Copia** los resultados
3. **Compárteme** los resultados
4. **Generaré** el SQL exacto para corregir
5. **Aplica** la corrección
6. **Redeploya** en Vercel
7. **Prueba** las URLs

---

**Archivo de queries completo:** `scripts/DIAGNOSTIC_QUERIES_FIXED.sql`

🚀 Ejecuta las queries y compárteme los resultados.
