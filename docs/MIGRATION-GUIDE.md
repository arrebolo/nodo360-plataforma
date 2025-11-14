# Guía de Migración al Nuevo Sistema de Lecciones

Esta guía te ayudará a migrar tus lecciones existentes al nuevo sistema basado en JSON con soporte para contenido premium y gratuito.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Ejecutar Scripts SQL](#ejecutar-scripts-sql)
3. [Marcar Cursos como Premium](#marcar-cursos-como-premium)
4. [Migrar Lecciones](#migrar-lecciones)
5. [Verificación](#verificación)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Configuración Inicial

### Requisitos Previos

- Acceso al Dashboard de Supabase
- Permisos de administrador en la base de datos
- Conocimientos básicos de SQL y JSON

### Backup Recomendado

Antes de ejecutar cualquier script, haz un backup de tu base de datos:

1. Ve a Supabase Dashboard → Database → Backups
2. Crea un backup manual con nombre descriptivo: `pre-lesson-migration-{fecha}`

---

## 📝 Ejecutar Scripts SQL

### Paso 1: Abrir SQL Editor

1. Abre el [Dashboard de Supabase](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar Script Principal

1. Abre el archivo `sql/setup-lesson-system.sql`
2. Copia **todo** el contenido
3. Pégalo en el SQL Editor
4. Click en **Run** (o `Ctrl+Enter`)

### Paso 3: Verificar Ejecución

Ejecuta esta consulta para verificar que todo funcionó:

```sql
SELECT * FROM lesson_migration_stats;
```

Deberías ver una tabla con estadísticas de migración por curso.

---

## 🏆 Marcar Cursos como Premium

### Identificar Cursos Premium

Primero, ve cuáles son tus cursos:

```sql
SELECT id, title, slug, is_premium
FROM courses
ORDER BY title;
```

### Marcar un Curso como Premium

Para marcar un curso específico como premium:

```sql
UPDATE courses
SET is_premium = true
WHERE slug = 'nombre-del-curso';
```

**Ejemplo:**
```sql
-- Marcar "Blockchain Avanzado" como premium
UPDATE courses
SET is_premium = true
WHERE slug = 'blockchain-avanzado';
```

### Marcar Múltiples Cursos

```sql
UPDATE courses
SET is_premium = true
WHERE slug IN (
  'blockchain-avanzado',
  'smart-contracts-profesional',
  'defi-masterclass'
);
```

### Verificar Cambios

```sql
SELECT title, slug, is_premium
FROM courses
WHERE is_premium = true;
```

---

## 🔄 Migrar Lecciones

### Entender el Formato JSON

El nuevo sistema usa JSON estructurado. Ejemplo mínimo:

```json
{
  "version": "1.0",
  "estimatedReadingTime": 15,
  "blocks": [
    {
      "id": "heading-1",
      "type": "heading",
      "level": 1,
      "text": "Título de la Lección"
    },
    {
      "id": "para-1",
      "type": "paragraph",
      "text": "Contenido de la lección..."
    }
  ]
}
```

### Método 1: Migración Manual (Recomendado para pocas lecciones)

#### Paso 1: Obtener Lección Actual

```sql
SELECT id, title, content
FROM lessons
WHERE slug = 'nombre-leccion';
```

#### Paso 2: Convertir HTML a JSON

Usa el contenido HTML como referencia y crea el JSON estructurado.

**Ejemplo de conversión:**

HTML original:
```html
<h1>Introducción a Bitcoin</h1>
<p>Bitcoin es una moneda digital...</p>
```

JSON estructurado:
```json
{
  "version": "1.0",
  "estimatedReadingTime": 10,
  "blocks": [
    {
      "id": "heading-1",
      "type": "heading",
      "level": 1,
      "text": "Introducción a Bitcoin"
    },
    {
      "id": "para-1",
      "type": "paragraph",
      "text": "Bitcoin es una moneda digital..."
    }
  ]
}
```

#### Paso 3: Actualizar en Base de Datos

```sql
UPDATE lessons
SET content_json = '{
  "version": "1.0",
  "estimatedReadingTime": 10,
  "blocks": [
    {
      "id": "heading-1",
      "type": "heading",
      "level": 1,
      "text": "Introducción a Bitcoin"
    },
    {
      "id": "para-1",
      "type": "paragraph",
      "text": "Bitcoin es una moneda digital descentralizada..."
    }
  ]
}'::jsonb
WHERE slug = 'introduccion-bitcoin';
```

### Método 2: Usar Ejemplo como Template

Copia el archivo `data/example-lesson-premium.json` como punto de partida:

1. Duplica el archivo
2. Modifica el contenido para tu lección
3. Copia el JSON
4. Insértalo en la base de datos con el UPDATE de arriba

### Tipos de Bloques Disponibles

#### 1. Heading (Encabezado)
```json
{
  "id": "heading-1",
  "type": "heading",
  "level": 2,
  "text": "Título del Encabezado",
  "anchor": "titulo-encabezado"
}
```

#### 2. Paragraph (Párrafo)
```json
{
  "id": "para-1",
  "type": "paragraph",
  "text": "Texto del párrafo..."
}
```

#### 3. Video
```json
{
  "id": "video-1",
  "type": "video",
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "duration": 632,
  "thumbnail": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
  "provider": "youtube"
}
```

#### 4. Callout (Nota Destacada)
```json
{
  "id": "callout-1",
  "type": "callout",
  "style": "tip",
  "title": "Consejo Importante",
  "content": "Texto de la nota..."
}
```

Estilos disponibles: `tip`, `warning`, `info`, `success`, `danger`

#### 5. List (Lista)
```json
{
  "id": "list-1",
  "type": "list",
  "ordered": false,
  "items": [
    "Item 1",
    "Item 2",
    "Item 3"
  ]
}
```

#### 6. Code (Código)
```json
{
  "id": "code-1",
  "type": "code",
  "language": "javascript",
  "filename": "ejemplo.js",
  "showLineNumbers": true,
  "code": "const ejemplo = 'código aquí';"
}
```

#### 7. Quiz
```json
{
  "id": "quiz-1",
  "type": "quiz",
  "question": "¿Pregunta del quiz?",
  "options": [
    {
      "id": "opt-1",
      "text": "Respuesta correcta",
      "correct": true
    },
    {
      "id": "opt-2",
      "text": "Respuesta incorrecta",
      "correct": false
    }
  ],
  "explanation": "Explicación de la respuesta correcta"
}
```

#### 8. Image (Imagen)
```json
{
  "id": "image-1",
  "type": "image",
  "url": "https://example.com/imagen.jpg",
  "alt": "Descripción de la imagen",
  "caption": "Pie de foto opcional"
}
```

#### 9. Divider (Separador)
```json
{
  "id": "divider-1",
  "type": "divider"
}
```

### Recursos Opcionales

Puedes agregar recursos descargables:

```json
{
  "version": "1.0",
  "blocks": [ ... ],
  "resources": [
    {
      "id": "res-1",
      "title": "Guía PDF Completa",
      "description": "Descripción del recurso",
      "type": "pdf",
      "size": "2.4 MB",
      "url": "https://ejemplo.com/recurso.pdf",
      "isPremium": true
    }
  ]
}
```

---

## ✅ Verificación

### Verificar Lecciones Migradas

```sql
-- Ver lecciones con JSON
SELECT id, title, migrated_to_json
FROM lessons
WHERE content_json IS NOT NULL;

-- Estadísticas de migración
SELECT * FROM lesson_migration_stats;

-- Ver contenido JSON de una lección
SELECT
  id,
  title,
  content_json->>'version' as version,
  jsonb_array_length(content_json->'blocks') as num_blocks
FROM lessons
WHERE slug = 'nombre-leccion';
```

### Probar en la Aplicación

1. Ve a una lección migrada en tu aplicación
2. Verifica que se muestre correctamente
3. Prueba la funcionalidad premium (si aplica)
4. Verifica que el botón de comunidad aparezca

### Verificar Cursos Premium

```sql
SELECT
  c.title as curso,
  c.is_premium,
  COUNT(l.id) as total_lecciones,
  COUNT(l.content_json) as lecciones_migradas
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
WHERE c.is_premium = true
GROUP BY c.id, c.title, c.is_premium;
```

---

## 🔧 Solución de Problemas

### Problema: "La lección muestra formato legacy"

**Causa:** La lección no tiene `content_json` o es inválido.

**Solución:**
```sql
-- Verificar si tiene content_json
SELECT id, title, content_json IS NOT NULL as tiene_json
FROM lessons
WHERE slug = 'nombre-leccion';

-- Validar JSON
SELECT
  id,
  title,
  validate_lesson_content_json(content_json) as es_valido
FROM lessons
WHERE slug = 'nombre-leccion';
```

### Problema: "El curso no muestra versión premium"

**Causa:** El curso no está marcado como premium.

**Solución:**
```sql
-- Verificar estado premium
SELECT title, is_premium FROM courses WHERE slug = 'nombre-curso';

-- Marcar como premium
UPDATE courses SET is_premium = true WHERE slug = 'nombre-curso';
```

### Problema: "Error al guardar JSON"

**Causa:** JSON mal formado.

**Solución:** Valida tu JSON en [jsonlint.com](https://jsonlint.com/) antes de insertarlo.

### Problema: "No aparece el botón de comunidad"

**Causa:** Componente no renderizado correctamente.

**Solución:** Verifica que la página use el nuevo `LessonRenderer` o `PremiumLessonRenderer`.

---

## 📊 Consultas Útiles

### Lecciones Pendientes de Migrar

```sql
SELECT
  l.id,
  l.title,
  l.slug,
  m.title as modulo,
  c.title as curso
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE l.content_json IS NULL
ORDER BY c.title, m.order_index, l.order_index;
```

### Progreso de Migración por Curso

```sql
SELECT
  c.title as curso,
  COUNT(l.id) as total,
  COUNT(l.content_json) as migradas,
  ROUND((COUNT(l.content_json)::DECIMAL / COUNT(l.id)) * 100, 2) as porcentaje
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
GROUP BY c.id, c.title
ORDER BY porcentaje DESC;
```

### Lecciones con Más Bloques

```sql
SELECT
  id,
  title,
  jsonb_array_length(content_json->'blocks') as num_bloques
FROM lessons
WHERE content_json IS NOT NULL
ORDER BY num_bloques DESC
LIMIT 10;
```

---

## 🎯 Checklist de Migración

- [ ] Ejecutar script SQL `setup-lesson-system.sql`
- [ ] Verificar que las columnas se crearon correctamente
- [ ] Marcar cursos premium con `UPDATE courses SET is_premium = true`
- [ ] Migrar lección de prueba y verificar visualización
- [ ] Documentar estructura de contenido para tu equipo
- [ ] Migrar lecciones restantes progresivamente
- [ ] Actualizar documentación interna
- [ ] Capacitar al equipo en nuevo formato

---

## 📚 Recursos Adicionales

- [Documentación del Sistema de Lecciones](./LESSON-SYSTEM.md)
- [Ejemplos de Lecciones](../data/)
  - `example-lesson.json` - Lección gratuita completa
  - `example-lesson-premium.json` - Lección premium completa
- [Schema TypeScript](../types/lesson-content.ts)

---

## 💡 Consejos

1. **Migra progresivamente:** No intentes migrar todas las lecciones a la vez
2. **Prueba primero:** Migra 1-2 lecciones de prueba antes de migrar todo un curso
3. **Usa templates:** Copia y modifica los ejemplos existentes
4. **Mantén backup:** El contenido HTML original se mantiene en `content`
5. **Documenta:** Anota cualquier peculiaridad de tus lecciones
6. **Automatiza:** Para migraciones masivas, considera crear un script personalizado

---

¿Necesitas ayuda? Consulta la documentación completa del sistema en `docs/LESSON-SYSTEM.md`
