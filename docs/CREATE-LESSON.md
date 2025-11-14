# Guía Rápida: Crear Lecciones en Formato JSON

Esta guía te muestra cómo crear nuevas lecciones usando el sistema moderno de bloques JSON.

## Método 1: Script Automático (Recomendado)

El método más rápido para crear una lección nueva:

```bash
npx tsx scripts/create-lesson.ts
```

El script te preguntará:
- Título de la lección
- Slug (URL amigable)
- ID del módulo
- Descripción
- Duración estimada

Y generará automáticamente:
- ✅ JSON estructurado listo para usar
- ✅ SQL para insertar en Supabase
- ✅ IDs únicos para cada bloque

## Método 2: Copiar Plantilla Manualmente

### Paso 1: Copiar la plantilla

```bash
cp templates/template-lesson.json mi-nueva-leccion.json
```

### Paso 2: Editar el contenido

Abre `mi-nueva-leccion.json` y modifica:

1. **`estimatedReadingTime`**: Tiempo estimado en minutos
2. **`blocks`**: Array de bloques de contenido
3. **`resources`**: Recursos adicionales (opcional)

### Paso 3: Obtener el ID del módulo

Ejecuta en Supabase SQL Editor:

```sql
SELECT id, title, order_index
FROM modules
WHERE course_id = (SELECT id FROM courses WHERE slug = 'tu-curso-slug')
ORDER BY order_index;
```

### Paso 4: Insertar la lección en Supabase

```sql
INSERT INTO lessons (
  module_id,
  title,
  slug,
  description,
  order_index,
  content_json,
  video_duration_minutes,
  is_free_preview,
  created_at,
  updated_at
) VALUES (
  'ID-DEL-MODULO-AQUI',
  'Título de la Lección',
  'titulo-de-la-leccion',
  'Descripción breve de la lección',
  1, -- Orden dentro del módulo
  '{"version":"1.0","estimatedReadingTime":15,"blocks":[...],"resources":[]}'::jsonb,
  15, -- Duración en minutos
  false, -- true si es preview gratuito
  NOW(),
  NOW()
);
```

---

## Tipos de Bloques Disponibles

### 1. Heading (Encabezado)

```json
{
  "id": "heading-1",
  "type": "heading",
  "level": 2,
  "text": "Título de la Sección"
}
```

**Niveles disponibles:** `1`, `2`, `3`

---

### 2. Paragraph (Párrafo)

```json
{
  "id": "para-1",
  "type": "paragraph",
  "text": "Este es un párrafo de texto. Puede contener **negrita** y otros formatos markdown."
}
```

---

### 3. Callout (Cuadro Destacado)

```json
{
  "id": "callout-1",
  "type": "callout",
  "style": "info",
  "title": "Título del Callout",
  "content": "Contenido importante a resaltar"
}
```

**Estilos disponibles:**
- `info` - Azul, para información general
- `warning` - Naranja/Amarillo, para advertencias
- `success` - Verde, para éxitos o confirmaciones
- `tip` - Verde claro, para consejos profesionales

---

### 4. List (Lista)

```json
{
  "id": "list-1",
  "type": "list",
  "style": "bullet",
  "items": [
    "Primer elemento",
    "Segundo elemento",
    "Tercer elemento"
  ]
}
```

**Estilos disponibles:**
- `bullet` - Lista con viñetas
- `numbered` - Lista numerada
- `checklist` - Lista de verificación con checkboxes

---

### 5. Code (Bloque de Código)

```json
{
  "id": "code-1",
  "type": "code",
  "language": "javascript",
  "code": "const bitcoin = 'BTC';\nconsole.log(bitcoin);",
  "showLineNumbers": true
}
```

**Lenguajes soportados:** `javascript`, `python`, `typescript`, `bash`, `sql`, `json`, `html`, `css`, etc.

---

### 6. Image (Imagen)

```json
{
  "id": "image-1",
  "type": "image",
  "url": "https://example.com/image.png",
  "alt": "Descripción de la imagen",
  "caption": "Pie de foto (opcional)"
}
```

---

### 7. Divider (Separador)

```json
{
  "id": "divider-1",
  "type": "divider"
}
```

Crea una línea horizontal separadora.

---

### 8. Video (Reproductor de Video)

```json
{
  "id": "video-1",
  "type": "video",
  "url": "https://www.youtube.com/embed/VIDEO_ID",
  "title": "Título del video",
  "duration": 600
}
```

**Nota:** La URL debe ser en formato embed de YouTube/Vimeo.

---

### 9. Quiz (Cuestionario)

```json
{
  "id": "quiz-1",
  "type": "quiz",
  "question": "¿Cuántos Bitcoins existirán como máximo?",
  "options": [
    { "id": "a", "text": "18 millones" },
    { "id": "b", "text": "21 millones" },
    { "id": "c", "text": "100 millones" },
    { "id": "d", "text": "Infinitos" }
  ],
  "correctAnswer": "b",
  "explanation": "Bitcoin tiene un límite fijo de 21 millones de monedas."
}
```

---

## Recursos Adicionales

Agrega recursos al final del JSON:

```json
{
  "version": "1.0",
  "estimatedReadingTime": 15,
  "blocks": [...],
  "resources": [
    {
      "title": "Documentación Oficial",
      "url": "https://bitcoin.org/es/",
      "type": "documentation"
    },
    {
      "title": "Video Tutorial",
      "url": "https://youtube.com/watch?v=example",
      "type": "video"
    },
    {
      "title": "PDF Descargable",
      "url": "https://example.com/guide.pdf",
      "type": "pdf"
    },
    {
      "title": "Herramienta Online",
      "url": "https://tool.example.com",
      "type": "tool"
    }
  ]
}
```

**Tipos disponibles:** `documentation`, `video`, `pdf`, `tool`, `article`

---

## Mejores Prácticas

### IDs Únicos

Cada bloque debe tener un ID único dentro de la lección:

```json
"id": "tipo-numero"
```

Ejemplos:
- `heading-1`, `heading-2`, `heading-3`
- `para-1`, `para-2`, `para-3`
- `callout-1`, `callout-2`
- `list-1`, `list-2`

### Estructura Lógica

Organiza tu contenido en este orden:

1. **Introducción** (heading 2 + párrafo)
2. **Contenido principal** (headings 2/3 + párrafos + listas)
3. **Ejemplos prácticos** (code + callouts)
4. **Ejercicios** (quizzes + checklists)
5. **Resumen** (heading 2 + lista de puntos clave)

### Tiempo de Lectura

Estima el tiempo basándote en:
- **200 palabras por minuto** para lectura
- **+2 minutos** por cada bloque de código
- **+1 minuto** por cada quiz
- **+1 minuto** por cada imagen compleja

### Callouts Efectivos

Usa callouts estratégicamente:

- **Info (azul)**: Conceptos teóricos, definiciones
- **Tip (verde claro)**: Consejos profesionales, mejores prácticas
- **Warning (naranja)**: Advertencias, precauciones, errores comunes
- **Success (verde)**: Confirmaciones, logros completados

### Progresión Didáctica

1. Empieza con lo simple
2. Construye sobre conceptos previos
3. Usa ejemplos antes de teoría compleja
4. Termina con ejercicios prácticos

---

## Ejemplo Completo

```json
{
  "version": "1.0",
  "estimatedReadingTime": 10,
  "blocks": [
    {
      "id": "heading-1",
      "type": "heading",
      "level": 2,
      "text": "¿Qué es una Wallet de Bitcoin?"
    },
    {
      "id": "para-1",
      "type": "paragraph",
      "text": "Una wallet (billetera) de Bitcoin es una herramienta que te permite almacenar, enviar y recibir Bitcoin de forma segura."
    },
    {
      "id": "callout-1",
      "type": "callout",
      "style": "tip",
      "title": "Punto Clave",
      "content": "Una wallet no almacena tus Bitcoins, sino las claves privadas que te permiten acceder a ellos en la blockchain."
    },
    {
      "id": "heading-2",
      "type": "heading",
      "level": 3,
      "text": "Tipos de Wallets"
    },
    {
      "id": "list-1",
      "type": "list",
      "style": "bullet",
      "items": [
        "Hot Wallets: Conectadas a internet (móviles, web)",
        "Cold Wallets: Offline (hardware wallets, paper wallets)",
        "Custodial: Un tercero controla las claves",
        "Non-custodial: Tú controlas las claves"
      ]
    },
    {
      "id": "divider-1",
      "type": "divider"
    },
    {
      "id": "quiz-1",
      "type": "quiz",
      "question": "¿Qué almacena realmente una wallet de Bitcoin?",
      "options": [
        { "id": "a", "text": "Los Bitcoins en sí" },
        { "id": "b", "text": "Las claves privadas" },
        { "id": "c", "text": "El historial de transacciones" },
        { "id": "d", "text": "Tu identidad" }
      ],
      "correctAnswer": "b",
      "explanation": "Una wallet almacena las claves privadas que te permiten controlar tus Bitcoins en la blockchain."
    }
  ],
  "resources": [
    {
      "title": "Comparación de Wallets",
      "url": "https://bitcoin.org/es/elige-tu-monedero",
      "type": "tool"
    }
  ]
}
```

---

## Validación del JSON

Antes de insertar en Supabase, valida tu JSON:

```bash
# Verificar sintaxis JSON
cat mi-leccion.json | jq .

# Validar que tenga todos los campos requeridos
npx tsx scripts/validate-lesson.ts mi-leccion.json
```

---

## Actualizar una Lección Existente

```sql
UPDATE lessons
SET
  content_json = '{"version":"1.0",...}'::jsonb,
  updated_at = NOW()
WHERE id = 'LESSON-ID-AQUI';
```

---

## Troubleshooting

### Error: "JSON inválido"
- Verifica que todos los strings estén entre comillas dobles
- Asegúrate de que no falten comas
- Valida con un linter JSON online

### Error: "content_json no se muestra"
- Verifica que la lección tenga `content_json` no nulo
- Confirma que `hasJsonContent()` retorna `true`
- Revisa la consola del navegador para logs

### La lección usa OldLessonLayout
- La función `hasJsonContent()` está retornando `false`
- Verifica que el JSON tenga la estructura correcta:
  - `version: "1.0"`
  - `blocks: [...]` (array con al menos 1 bloque)

---

## Recursos Útiles

- **Plantilla completa:** `templates/template-lesson.json`
- **Script helper:** `scripts/create-lesson.ts`
- **Validador:** `scripts/validate-lesson.ts`
- **Ejemplos:** Lección "¿Qué es Bitcoin?" en Supabase

---

## Próximos Pasos

1. ✅ Usa el script `create-lesson.ts` para tu primera lección
2. ✅ Revisa la lección "¿Qué es Bitcoin?" como referencia
3. ✅ Crea 2-3 lecciones de prueba
4. ✅ Familiarízate con los diferentes tipos de bloques
5. ✅ Desarrolla tu propio estilo didáctico

¡Ya estás listo para crear lecciones increíbles! 🚀
