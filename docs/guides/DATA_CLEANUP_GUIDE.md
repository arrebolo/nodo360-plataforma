# 🧹 DATA CLEANUP GUIDE - Limpieza de Contenido Corrupto en Lecciones

**Fecha:** 2025-11-17
**Autor:** Claude Code (AI Senior Developer)
**Versión:** 1.0.0
**Issue:** Lecciones con código TypeScript/JSX mezclado en el contenido HTML

---

## 📊 RESUMEN EJECUTIVO

| Problema | Causa | Solución | Urgencia |
|----------|-------|----------|----------|
| Código fuente visible en lecciones | Contenido corrupto en BD | Limpieza de datos SQL | 🔴 CRÍTICA |
| Build OK pero páginas muestran código | Campo `content` tiene TypeScript | Queries de migración | 🔴 URGENTE |

### Veredicto
🚨 **PROBLEMA DE DATOS EN SUPABASE - REQUIERE LIMPIEZA MANUAL**

---

## 🔍 PROBLEMA IDENTIFICADO

### Descripción del Issue

El problema NO es del código de la aplicación (que está correcto), sino de los **DATOS en Supabase**.

**Ubicación del problema:** Tabla `lessons`, campo `content`

**Contenido actual (INCORRECTO):**
```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lección 1.1: Introducción a Blockchain',
  description: 'Aprende los conceptos básicos...'
}

export default function Leccion11BlockchainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Introducción a Blockchain</h1>
      <p>Blockchain es una tecnología...</p>
      <h2>¿Qué es un bloque?</h2>
      <p>Un bloque contiene...</p>
    </div>
  )
}
```

**Contenido esperado (CORRECTO):**
```html
<div class="container mx-auto px-4 py-8">
  <h1>Introducción a Blockchain</h1>
  <p>Blockchain es una tecnología...</p>
  <h2>¿Qué es un bloque?</h2>
  <p>Un bloque contiene...</p>
</div>
```

### ¿Cómo Ocurrió Esto?

**Escenario probable:**
1. Alguien copió el código completo de un archivo de componente
2. Lo pegó en el campo `content` de Supabase
3. El sistema lo guardó tal cual (con imports, exports, etc.)
4. Cuando la lección renderiza, muestra todo el código como texto

---

## 🔬 QUERIES DE DIAGNÓSTICO

### Query 1: Verificar Lecciones Afectadas

```sql
-- Encontrar lecciones que tienen código TypeScript en el contenido
SELECT
  l.id,
  l.slug,
  l.title,
  m.title as module_title,
  c.title as course_title,
  LENGTH(l.content) as content_length,
  CASE
    WHEN l.content LIKE '%import type%' THEN '🔴 TYPESCRIPT CODE'
    WHEN l.content LIKE '%export default%' THEN '🔴 JSX CODE'
    WHEN l.content LIKE '%function%Page()%' THEN '🔴 COMPONENT CODE'
    WHEN l.content IS NULL THEN '⚪ NULL'
    WHEN TRIM(l.content) = '' THEN '⚪ EMPTY'
    ELSE '✅ LOOKS OK'
  END as status,
  SUBSTRING(l.content, 1, 100) as preview
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
ORDER BY
  CASE
    WHEN l.content LIKE '%import type%' THEN 1
    WHEN l.content LIKE '%export default%' THEN 2
    WHEN l.content LIKE '%function%Page()%' THEN 3
    ELSE 4
  END,
  c.title,
  m.order_index,
  l.order_index;
```

**Resultado esperado:**
```
| title         | status           | preview                              |
|---------------|------------------|--------------------------------------|
| Lección 1.1   | 🔴 TYPESCRIPT CODE | import type { Metadata } from 'next'... |
| Lección 1.2   | ✅ LOOKS OK       | <h1>Contenido aquí</h1>...          |
```

---

### Query 2: Ver Contenido Completo de Lección Específica

```sql
-- Ver el contenido COMPLETO de una lección específica
SELECT
  l.title,
  l.slug,
  l.content,
  l.content_json,
  l.video_url
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE l.slug = 'leccion-1-1'
  AND c.slug = 'fundamentos-blockchain';
```

**Usar para:**
- Ver exactamente qué está guardado en la BD
- Identificar dónde empieza el HTML real
- Decidir si se puede automatizar la limpieza

---

### Query 3: Estadísticas de Lecciones Afectadas

```sql
-- Contar cuántas lecciones están afectadas
SELECT
  COUNT(*) as total_lessons,
  COUNT(CASE WHEN content LIKE '%import type%' OR content LIKE '%export default%' THEN 1 END) as corrupted_lessons,
  COUNT(CASE WHEN content IS NULL OR TRIM(content) = '' THEN 1 END) as empty_lessons,
  COUNT(CASE WHEN content IS NOT NULL AND content NOT LIKE '%import%' AND content NOT LIKE '%export%' THEN 1 END) as ok_lessons
FROM lessons;
```

**Resultado esperado:**
```
| total_lessons | corrupted_lessons | empty_lessons | ok_lessons |
|---------------|-------------------|---------------|------------|
| 15            | 8                 | 2             | 5          |
```

---

## 🧹 QUERIES DE LIMPIEZA

### ⚠️ ADVERTENCIA IMPORTANTE

**ANTES de ejecutar queries de UPDATE:**
1. **BACKUP:** Haz backup de la tabla `lessons` en Supabase
2. **TEST:** Ejecuta primero en 1 lección de prueba
3. **VERIFY:** Verifica que el resultado sea correcto
4. **BATCH:** Limpia lecciones en lotes pequeños

---

### Opción A: Limpieza Manual por Lección (RECOMENDADO)

**Paso 1: Obtener contenido corrupto**
```sql
SELECT id, slug, title, content
FROM lessons
WHERE slug = 'leccion-1-1';
```

**Paso 2: Copiar el contenido a un editor de texto**

**Paso 3: Extraer manualmente el HTML**
- Buscar `return (`
- Copiar todo el JSX dentro del return
- Eliminar imports, exports, function declaration
- Convertir className a class
- Limpiar props de React

**Paso 4: Actualizar la lección**
```sql
UPDATE lessons
SET content = '<div class="container mx-auto px-4 py-8">
  <h1>Introducción a Blockchain</h1>
  <p>Blockchain es una tecnología...</p>
</div>',
updated_at = NOW()
WHERE slug = 'leccion-1-1';
```

**Paso 5: Verificar**
```sql
SELECT slug, SUBSTRING(content, 1, 200)
FROM lessons
WHERE slug = 'leccion-1-1';
```

---

### Opción B: Limpieza Semi-Automatizada (AVANZADO)

**⚠️ Solo usar si entiendes RegEx de PostgreSQL**

```sql
-- PASO 1: Crear una función auxiliar
CREATE OR REPLACE FUNCTION extract_html_from_jsx(jsx_content TEXT)
RETURNS TEXT AS $$
DECLARE
  html_content TEXT;
  start_pos INTEGER;
  end_pos INTEGER;
BEGIN
  -- Buscar 'return (' y extraer contenido
  start_pos := POSITION('return (' IN jsx_content);

  IF start_pos = 0 THEN
    -- No tiene 'return (', intentar con 'return<'
    start_pos := POSITION('return <' IN jsx_content);
  END IF;

  IF start_pos > 0 THEN
    -- Encontrar el cierre del return
    html_content := SUBSTRING(jsx_content FROM start_pos + 8);

    -- Buscar el último ')' antes del cierre de la función
    end_pos := POSITION(')
}' IN html_content);

    IF end_pos > 0 THEN
      html_content := LEFT(html_content, end_pos - 1);
    END IF;

    -- Limpiar espacios
    html_content := TRIM(html_content);

    -- Reemplazar className con class
    html_content := REPLACE(html_content, 'className=', 'class=');

    RETURN html_content;
  ELSE
    -- No se pudo extraer, retornar NULL
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- PASO 2: Probar con UNA lección
SELECT
  slug,
  SUBSTRING(content, 1, 100) as original,
  SUBSTRING(extract_html_from_jsx(content), 1, 100) as extracted
FROM lessons
WHERE slug = 'leccion-1-1';

-- PASO 3: Si se ve bien, actualizar EN BATCH
-- ⚠️ CUIDADO: Primero haz BACKUP
UPDATE lessons
SET
  content = extract_html_from_jsx(content),
  updated_at = NOW()
WHERE content LIKE '%import type%'
  OR content LIKE '%export default%';

-- PASO 4: Limpiar función temporal
DROP FUNCTION IF EXISTS extract_html_from_jsx(TEXT);
```

**⚠️ RIESGOS de esta opción:**
- Puede fallar si el JSX es complejo
- Puede dejar artifacts de JSX
- Requiere revisión manual después
- **NO ejecutar sin backup**

---

### Opción C: Marcar como NULL y Recrear (LIMPIO)

Si el contenido está muy corrupto, mejor marcarlo como NULL y recrear:

```sql
-- PASO 1: Marcar lecciones corruptas como NULL
UPDATE lessons
SET
  content = NULL,
  updated_at = NOW()
WHERE content LIKE '%import type%'
   OR content LIKE '%export default%'
   OR content LIKE '%function%Page()%';

-- PASO 2: Verificar cuántas se marcaron
SELECT COUNT(*)
FROM lessons
WHERE content IS NULL;

-- PASO 3: Luego, manualmente agregar contenido limpio a cada una
```

**Ventajas:**
- Limpio y seguro
- No deja artifacts
- Permite recrear contenido bien estructurado

**Desventajas:**
- Requiere más trabajo manual
- Hay que escribir contenido nuevo

---

## 📝 PROCESO RECOMENDADO PASO A PASO

### Fase 1: Diagnóstico (5-10 min)

**1. Identificar lecciones afectadas:**
```sql
SELECT id, slug, title
FROM lessons
WHERE content LIKE '%import type%'
   OR content LIKE '%export default%';
```

**2. Guardar lista de lecciones a limpiar:**
```
leccion-1-1
leccion-1-2
leccion-2-1
...
```

**3. Priorizar:**
- Empezar con lecciones más visitadas
- O hacer todas de un curso primero

---

### Fase 2: Backup (2 min)

**En Supabase Dashboard:**
1. Ir a Table Editor → lessons
2. Export → CSV
3. Guardar como `lessons_backup_2025-11-17.csv`

**O con SQL:**
```sql
-- Crear tabla de backup
CREATE TABLE lessons_backup AS
SELECT * FROM lessons;

-- Verificar
SELECT COUNT(*) FROM lessons_backup;
```

---

### Fase 3: Limpieza (Variable)

**Por cada lección:**

**1. Ver contenido actual:**
```sql
SELECT slug, content
FROM lessons
WHERE slug = 'SLUG_AQUI';
```

**2. Copiar content a editor de texto**

**3. Extraer HTML manualmente:**
- Buscar `return (`
- Copiar JSX dentro
- Convertir a HTML puro
- Eliminar props de React

**4. Actualizar:**
```sql
UPDATE lessons
SET content = 'HTML_LIMPIO_AQUI',
    updated_at = NOW()
WHERE slug = 'SLUG_AQUI';
```

**5. Verificar en navegador:**
- Ir a la lección
- Verificar que se ve bien
- No hay código visible

**6. Siguiente lección**

---

### Fase 4: Verificación Final (5 min)

```sql
-- Verificar que no queden lecciones con código
SELECT COUNT(*)
FROM lessons
WHERE content LIKE '%import type%'
   OR content LIKE '%export default%';

-- Resultado esperado: 0
```

---

## 🔧 HERRAMIENTAS ÚTILES

### Script Node.js para Extracción Automatizada

Si hay muchas lecciones, crear script:

```javascript
// extract-html-from-jsx.js
const fs = require('fs');

function extractHTMLFromJSX(jsxCode) {
  // Buscar return (
  const returnMatch = jsxCode.match(/return\s*\(([\s\S]*?)\n\s*\)/);

  if (!returnMatch) {
    console.error('No se encontró return()');
    return null;
  }

  let html = returnMatch[1].trim();

  // Convertir JSX a HTML
  html = html.replace(/className=/g, 'class=');
  html = html.replace(/htmlFor=/g, 'for=');
  html = html.replace(/\{\/\*.*?\*\/\}/g, ''); // Eliminar comentarios JSX

  return html;
}

// Leer archivo con contenido corrupto
const corruptedContent = fs.readFileSync('lesson-content.txt', 'utf8');

// Extraer HTML
const cleanHTML = extractHTMLFromJSX(corruptedContent);

// Guardar
fs.writeFileSync('lesson-content-clean.html', cleanHTML);

console.log('✅ HTML extraído y guardado en lesson-content-clean.html');
```

**Uso:**
```bash
# Copiar contenido corrupto a archivo
echo "import type..." > lesson-content.txt

# Ejecutar script
node extract-html-from-jsx.js

# Copiar HTML limpio a Supabase
cat lesson-content-clean.html
```

---

## 🚨 PREVENCIÓN FUTURA

### 1. Validación en la App

Agregar validación al guardar lecciones:

```typescript
// lib/validate-lesson-content.ts
export function validateLessonContent(content: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Detectar código TypeScript/JSX
  if (content.includes('import ')) {
    errors.push('El contenido no debe incluir imports');
  }

  if (content.includes('export ')) {
    errors.push('El contenido no debe incluir exports');
  }

  if (content.match(/function\s+\w+\s*\(/)) {
    errors.push('El contenido no debe incluir definiciones de funciones');
  }

  if (content.includes('className=')) {
    errors.push('Usa "class=" en lugar de "className="');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

### 2. CMS con Editor WYSIWYG

**Recomendación:** Implementar editor visual para lecciones

**Opciones:**
- TipTap (React)
- Draft.js
- Quill
- TinyMCE

**Beneficio:**
- Usuarios editan visualmente
- Genera HTML limpio automáticamente
- No pueden pegar código por error

---

### 3. Migración a content_json

**Mejor solución a largo plazo:**

```typescript
// Estructura moderna
{
  "type": "lesson",
  "blocks": [
    {
      "type": "heading",
      "level": 1,
      "content": "Introducción a Blockchain"
    },
    {
      "type": "paragraph",
      "content": "Blockchain es una tecnología..."
    },
    {
      "type": "video",
      "url": "https://..."
    }
  ]
}
```

**Ventajas:**
- Estructura clara
- No puede contener código corrupto
- Fácil de validar
- Versionable

---

## 📊 CHECKLIST DE LIMPIEZA

### Pre-limpieza
- [ ] Ejecutar Query 1 (verificar lecciones afectadas)
- [ ] Guardar lista de lecciones a limpiar
- [ ] Hacer backup de tabla `lessons`
- [ ] Verificar backup funcionó

### Durante Limpieza
- [ ] Procesar lección 1
- [ ] Verificar en navegador
- [ ] Procesar lección 2
- [ ] Verificar en navegador
- [ ] ... (repetir para todas)

### Post-limpieza
- [ ] Ejecutar Query 3 (verificar 0 lecciones corruptas)
- [ ] Probar todas las lecciones en navegador
- [ ] Verificar navegación funciona
- [ ] Verificar no hay errores de consola

### Documentación
- [ ] Documentar lecciones limpiadas
- [ ] Anotar tiempo tomado
- [ ] Guardar queries usadas
- [ ] Actualizar procedimientos

---

## 🎯 EJEMPLO COMPLETO: Lección 1.1

### Contenido Actual (Corrupto)

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lección 1.1: Introducción a Blockchain',
}

export default function Leccion11BlockchainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Introducción a Blockchain</h1>
      <p className="mb-4">
        Blockchain es una tecnología revolucionaria que permite...
      </p>
      <h2 className="text-2xl font-bold mb-3">¿Qué es un bloque?</h2>
      <p>
        Un bloque contiene información que se enlaza...
      </p>
    </div>
  )
}
```

### Contenido Limpio (Correcto)

```html
<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-4">Introducción a Blockchain</h1>
  <p class="mb-4">
    Blockchain es una tecnología revolucionaria que permite...
  </p>
  <h2 class="text-2xl font-bold mb-3">¿Qué es un bloque?</h2>
  <p>
    Un bloque contiene información que se enlaza...
  </p>
</div>
```

### Query de Actualización

```sql
UPDATE lessons
SET content = '<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-4">Introducción a Blockchain</h1>
  <p class="mb-4">
    Blockchain es una tecnología revolucionaria que permite...
  </p>
  <h2 class="text-2xl font-bold mb-3">¿Qué es un bloque?</h2>
  <p>
    Un bloque contiene información que se enlaza...
  </p>
</div>',
updated_at = NOW()
WHERE slug = 'leccion-1-1'
  AND id IN (
    SELECT l.id
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE c.slug = 'fundamentos-blockchain'
  );
```

---

## 📈 ESTIMACIÓN DE TIEMPO

| Tarea | Tiempo por Lección | Total (10 lecciones) |
|-------|-------------------|----------------------|
| Diagnóstico | - | 10 min |
| Backup | - | 5 min |
| Extracción manual | 5-10 min | 50-100 min |
| Actualización SQL | 1 min | 10 min |
| Verificación | 2 min | 20 min |
| **TOTAL** | - | **1.5 - 2.5 horas** |

**Con script automatizado:** ~30-45 minutos

---

## 🎯 CONCLUSIÓN

### Problema Real
❌ NO es un error de código de la aplicación
❌ NO es un problema de cache
✅ **ES un problema de DATOS CORRUPTOS en Supabase**

### Solución
1. Diagnosticar lecciones afectadas con SQL
2. Hacer backup de tabla `lessons`
3. Limpiar contenido manualmente o con script
4. Actualizar lecciones en Supabase
5. Verificar en navegador

### Prevención
- Implementar validación de contenido
- Usar CMS con editor visual
- Migrar a `content_json` estructurado

---

**Guía generada por Claude Code**
**Versión:** 1.0.0
**Fecha:** 2025-11-17
**Status:** ✅ LISTA PARA USO

---

## 🙏 PRÓXIMOS PASOS PARA EL USUARIO

1. **Accede a Supabase Dashboard:**
   - SQL Editor

2. **Ejecuta Query 1:**
   - Identifica lecciones corruptas

3. **Haz Backup:**
   - Export tabla lessons o CREATE TABLE backup

4. **Limpia lecciones:**
   - Opción A (manual) - más seguro
   - Opción B (semi-auto) - más rápido pero riesgoso

5. **Verifica:**
   - Prueba lecciones en navegador
   - Confirma que no hay código visible

¿Necesitas ayuda ejecutando alguna de estas queries? ¡Avísame!
