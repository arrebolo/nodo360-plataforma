# 🎯 GUÍA RÁPIDA DE DIAGNÓSTICO - ERROR 404 EN VERCEL

## ⚡ ACCIÓN INMEDIATA

**Ejecuta esto ahora en tu Windows:**

```bash
cd C:\Users\alber\nodo360-projects\nodo360-plataforma
node scripts/diagnose-slugs.js
```

Este script te mostrará **exactamente** qué slugs existen en tu base de datos de Supabase.

---

## ✅ VERIFICACIÓN DEL CÓDIGO

He revisado todo el código y **está 100% correcto**:

### 1. Configuración de Rutas ✅
- `app/cursos/[slug]/page.tsx`: `dynamicParams = true` configurado
- `app/cursos/[slug]/[lessonSlug]/page.tsx`: `dynamicParams = true` configurado

### 2. Funciones de Búsqueda ✅
- `getCourseBySlug()`: Busca correctamente por `courses.slug`
- `getLessonBySlug()`: Busca correctamente por `lessons.slug`

### 3. Componentes que Generan Links ✅
- `LessonList.tsx:206`: `href={/cursos/${courseSlug}/${lesson.slug}}`
- `CourseGrid.tsx:26`: `href={/cursos/${course.slug}}`

**Conclusión:** El código no tiene errores. El problema está en los **datos de Supabase**.

---

## 🔍 DIAGNÓSTICO: DOS OPCIONES

### OPCIÓN A: Script Automatizado (Recomendado)

1. Abre CMD o PowerShell en Windows
2. Navega al proyecto:
   ```bash
   cd C:\Users\alber\nodo360-projects\nodo360-plataforma
   ```
3. Ejecuta:
   ```bash
   node scripts/diagnose-slugs.js
   ```

El script te mostrará:
- ✅ Todos los slugs de cursos
- ✅ Todos los slugs de lecciones
- ✅ Si existe "bitcoin-desde-cero/leccion-1-1"
- ✅ Lista de URLs válidas

### OPCIÓN B: Consultas SQL Manuales

1. Ve a: https://supabase.com/dashboard/project/gcahtbecfidroepelcuw/sql
2. Abre: `scripts/DIAGNOSTIC_QUERIES.sql`
3. Ejecuta las queries una por una

---

## 🎯 ESCENARIOS MÁS PROBABLES

### Escenario 1: Slugs Diferentes

**Problema:**
- URL intentada: `/cursos/bitcoin-desde-cero/leccion-1-1`
- Slug real en DB: `/cursos/bitcoin-101/introduccion`

**Solución SQL:**
```sql
-- Actualizar slug del curso
UPDATE courses
SET slug = 'bitcoin-desde-cero'
WHERE id = 'ID_QUE_TE_MUESTRE_EL_SCRIPT';

-- Actualizar slug de la lección
UPDATE lessons
SET slug = 'leccion-1-1'
WHERE id = 'ID_QUE_TE_MUESTRE_EL_SCRIPT';
```

### Escenario 2: Status en Draft

**Problema:**
- Curso/lección existe pero `status = 'draft'`
- Solo se muestran los que tienen `status = 'published'`

**Solución SQL:**
```sql
-- Publicar curso
UPDATE courses
SET status = 'published'
WHERE slug = 'bitcoin-desde-cero';

-- Publicar lección
UPDATE lessons
SET status = 'published'
WHERE slug = 'leccion-1-1';
```

### Escenario 3: No Existen en la DB

**Problema:**
- No hay ningún curso o lección creada

**Solución:**
- Crear el curso y lecciones en Supabase Dashboard
- O usar script de seed para poblar la base de datos

---

## 📊 INTERPRETANDO LA SALIDA DEL SCRIPT

### ✅ Salida Esperada (TODO BIEN):

```
✅ Encontrados 1 cursos:
────────────────────────────────────────────
ID: abc-123
Título: Bitcoin desde Cero
Slug: "bitcoin-desde-cero"
Status: published
URL esperada: /cursos/bitcoin-desde-cero
────────────────────────────────────────────

✅ CURSO: Bitcoin desde Cero (slug: "bitcoin-desde-cero")
────────────────────────────────────────────
  ID: xyz-789
  Título: Lección 1.1 - Introducción
  Slug: "leccion-1-1"
  Status: published
  URL esperada: /cursos/bitcoin-desde-cero/leccion-1-1
```

Si ves esto, ¡todo está correcto! El problema sería otro (ver sección "Troubleshooting Avanzado").

### ❌ Salida con Problema (SLUGS NO COINCIDEN):

```
✅ Encontrados 1 cursos:
────────────────────────────────────────────
ID: abc-123
Título: Bitcoin desde Cero
Slug: "curso-bitcoin-101"  ⚠️ NO ES "bitcoin-desde-cero"
Status: published
────────────────────────────────────────────

❌ NO se encontró curso con slug "bitcoin-desde-cero"
   Slugs disponibles de cursos:
   - "curso-bitcoin-101"
```

**Acción:** Ejecutar la corrección SQL del Escenario 1.

---

## 🔧 CORRECCIONES PASO A PASO

### 1. Identifica el ID del Registro

Del output del script, copia el ID del curso/lección que necesitas actualizar:
```
ID: abc-123  ← COPIA ESTE
```

### 2. Ejecuta la Corrección SQL

Ve a Supabase SQL Editor y ejecuta:

```sql
-- Ejemplo: Actualizar curso
UPDATE courses
SET slug = 'bitcoin-desde-cero'
WHERE id = 'abc-123';  -- ← REEMPLAZA CON EL ID REAL

-- Ejemplo: Actualizar lección
UPDATE lessons
SET slug = 'leccion-1-1'
WHERE id = 'xyz-789';  -- ← REEMPLAZA CON EL ID REAL
```

### 3. Verifica la Actualización

Vuelve a ejecutar el script:
```bash
node scripts/diagnose-slugs.js
```

### 4. Redeploya en Vercel

```bash
git add .
git commit -m "fix: update slugs in database"
git push
```

O simplemente redeploya manualmente en Vercel Dashboard.

---

## 🆘 TROUBLESHOOTING AVANZADO

### Si los slugs están correctos pero sigue dando 404:

#### 1. Verifica Variables de Entorno en Vercel

Ve a: Vercel Dashboard > Project > Settings > Environment Variables

Debe tener:
```
NEXT_PUBLIC_SUPABASE_URL = https://gcahtbecfidroepelcuw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
```

#### 2. Verifica Logs de Vercel

Ve a: Vercel Dashboard > Project > Logs

Busca errores como:
- "Supabase connection failed"
- "fetch error"
- "database error"

#### 3. Verifica Políticas RLS en Supabase

Ve a: Supabase Dashboard > Authentication > Policies

Las tablas `courses` y `lessons` deben tener políticas que permitan **lectura anónima**:

```sql
-- Política de lectura para cursos
CREATE POLICY "Allow anonymous read courses"
ON courses FOR SELECT
USING (true);

-- Política de lectura para lecciones
CREATE POLICY "Allow anonymous read lessons"
ON lessons FOR SELECT
USING (true);

-- Política de lectura para módulos
CREATE POLICY "Allow anonymous read modules"
ON modules FOR SELECT
USING (true);
```

#### 4. Limpia Cache de Vercel

En Vercel Dashboard:
- Ve a Deployments
- Click en el deployment actual
- Click en "..." > "Redeploy"
- Marca "Use existing Build Cache" = OFF

---

## 📝 CHECKLIST COMPLETO

Marca cada paso conforme lo completes:

- [ ] Ejecutado `node scripts/diagnose-slugs.js` en Windows
- [ ] Identificados los slugs reales en la base de datos
- [ ] Comparados con URLs esperadas (`/cursos/bitcoin-desde-cero/leccion-1-1`)
- [ ] Aplicadas correcciones SQL si los slugs no coinciden
- [ ] Verificado que `status = 'published'` en cursos y lecciones
- [ ] Verificadas variables de entorno en Vercel
- [ ] Verificadas políticas RLS en Supabase
- [ ] Redeployado en Vercel
- [ ] Probado URLs en producción
- [ ] ✅ TODO FUNCIONA

---

## 📞 PRÓXIMOS PASOS

1. **AHORA:** Ejecuta `node scripts/diagnose-slugs.js`
2. **Copia la salida completa** del script
3. **Si encuentras discrepancias:** Aplica las correcciones SQL
4. **Si los slugs coinciden:** Ve a "Troubleshooting Avanzado"
5. **Comparte conmigo:**
   - La salida completa del script
   - Logs de Vercel (si aplica)
   - Screenshots del error 404

Con esa información podré darte la solución exacta.

---

## 📚 ARCHIVOS CREADOS

| Archivo | Descripción |
|---------|-------------|
| `scripts/diagnose-slugs.js` | Script automatizado de diagnóstico |
| `scripts/DIAGNOSTIC_QUERIES.sql` | Queries SQL para ejecutar manualmente |
| `scripts/DIAGNOSTIC_REPORT.md` | Reporte técnico completo |
| `scripts/README_DIAGNOSTIC.md` | Esta guía rápida |

---

**¿Necesitas ayuda?** Ejecuta el script y compárteme la salida completa. 🚀
