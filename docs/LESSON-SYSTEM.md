# Sistema de Lecciones Modernas - Nodo360

## 🎯 Descripción

Sistema completo de visualización de lecciones con diseño moderno, componentes interactivos y contenido estructurado en JSON.

## 📁 Estructura de Archivos

```
nodo360-plataforma/
├── types/
│   └── lesson-content.ts          # TypeScript types para el schema
├── components/lesson/
│   ├── VideoPlayer.tsx             # Reproductor de video con soporte YouTube/Vimeo
│   ├── LessonCallout.tsx           # Cajas destacadas (tip, warning, info, success, danger)
│   ├── CodeBlock.tsx               # Bloques de código con syntax highlighting
│   ├── InteractiveList.tsx         # Listas con checkboxes interactivos
│   ├── QuizBlock.tsx               # Preguntas interactivas de autoevaluación
│   ├── ProgressBar.tsx             # Barra de progreso de la lección
│   ├── TableOfContents.tsx         # Índice lateral con scroll automático
│   └── LessonRenderer.tsx          # Renderizador principal
├── data/
│   └── example-lesson.json         # Ejemplo de lección en formato JSON
└── app/
    └── demo-lesson/
        └── page.tsx                # Página de demostración
```

## 🚀 Ver la Demostración

```bash
npm run dev
```

Luego visita: `http://localhost:3000/demo-lesson`

## 📝 Schema de Contenido

### Estructura JSON

```json
{
  "version": "1.0",
  "estimatedReadingTime": 15,
  "blocks": [ /* array de bloques */ ],
  "resources": [ /* recursos descargables */ ]
}
```

### Tipos de Bloques Disponibles

#### 1. Video
```json
{
  "id": "video-1",
  "type": "video",
  "url": "https://www.youtube.com/watch?v=...",
  "duration": 632,
  "thumbnail": "https://...",
  "provider": "youtube"
}
```

#### 2. Heading
```json
{
  "id": "heading-1",
  "type": "heading",
  "level": 2,
  "text": "Título de la Sección",
  "anchor": "titulo-seccion"
}
```

#### 3. Paragraph
```json
{
  "id": "para-1",
  "type": "paragraph",
  "text": "Contenido del párrafo..."
}
```

#### 4. Callout (Caja Destacada)
```json
{
  "id": "callout-1",
  "type": "callout",
  "style": "tip",
  "title": "¿Sabías que?",
  "content": "Información importante..."
}
```

Estilos disponibles: `tip`, `warning`, `info`, `success`, `danger`

#### 5. List
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

#### 6. Code Block
```json
{
  "id": "code-1",
  "type": "code",
  "language": "python",
  "filename": "example.py",
  "showLineNumbers": true,
  "code": "print('Hello World')"
}
```

#### 7. Quiz
```json
{
  "id": "quiz-1",
  "type": "quiz",
  "question": "¿Pregunta?",
  "options": [
    {
      "id": "opt-1",
      "text": "Opción 1",
      "correct": true
    }
  ],
  "explanation": "Explicación de la respuesta correcta"
}
```

#### 8. Image
```json
{
  "id": "image-1",
  "type": "image",
  "url": "https://...",
  "alt": "Descripción",
  "caption": "Texto del caption",
  "width": 800,
  "height": 600
}
```

#### 9. Divider
```json
{
  "id": "divider-1",
  "type": "divider"
}
```

## 🎨 Componentes

### LessonRenderer

Componente principal que renderiza todo el contenido:

```tsx
import { LessonRenderer } from '@/components/lesson/LessonRenderer'
import lessonData from './lesson.json'

export default function LessonPage() {
  return (
    <LessonRenderer
      content={lessonData}
      progress={45}
    />
  )
}
```

### Componentes Individuales

Cada componente puede usarse independientemente:

```tsx
import { VideoPlayer } from '@/components/lesson/VideoPlayer'
import { LessonCallout } from '@/components/lesson/LessonCallout'
import { CodeBlock } from '@/components/lesson/CodeBlock'

// Ejemplo
<VideoPlayer block={{
  id: 'v1',
  type: 'video',
  url: 'https://youtube.com/watch?v=...',
  duration: 300
}} />
```

## 🎯 Características

### ✅ Diseño Moderno
- Layout de 2 columnas responsive
- Dark theme consistente
- Animaciones suaves
- Mobile-first

### ✅ Componentes Interactivos
- Listas con checkboxes
- Quizzes con feedback inmediato
- Tabla de contenido con auto-scroll
- Progress bar dinámico

### ✅ Experiencia de Usuario
- Índice lateral sticky
- Recursos descargables
- Tiempo estimado de lectura
- Marcar secciones completadas

### ✅ Multimedia
- Videos embebidos (YouTube, Vimeo, custom)
- Imágenes con captions
- Bloques de código con copy button

## 🔄 Migración de Contenido Actual

Para convertir el HTML/JSX actual a JSON estructurado, puedes:

1. **Manual**: Crear el JSON siguiendo el schema
2. **Semi-automática**: Usar el ejemplo como plantilla
3. **Automática**: (Próximamente) Script de migración

## 📊 Próximas Mejoras

- [ ] Syntax highlighting real (Prism.js o similar)
- [ ] Notas del usuario (guardar en Supabase)
- [ ] Modo presentación
- [ ] Exportar a PDF
- [ ] Búsqueda dentro de la lección
- [ ] Marcadores/bookmarks
- [ ] Modo oscuro/claro toggle

## 🛠️ Uso en Producción

### 1. Guardar contenido en Supabase

Modifica la tabla `lessons` para incluir:

```sql
ALTER TABLE lessons
ADD COLUMN content_json JSONB;
```

### 2. Actualizar página de lecciones

```tsx
// app/cursos/[courseSlug]/[lessonSlug]/page.tsx
import { LessonRenderer } from '@/components/lesson/LessonRenderer'

export default async function LessonPage({ params }) {
  const lesson = await fetchLesson(params.lessonSlug)

  return (
    <LessonRenderer
      content={lesson.content_json}
      progress={lesson.progress || 0}
    />
  )
}
```

## 🎨 Personalización de Estilos

Los colores brand se pueden personalizar en cada componente:

- Naranja: `#ff6b35` → `orange-500`, `orange-600`
- Azul oscuro: `#1a1f2e` → `gray-900`, `gray-950`

## 📱 Responsive Design

- **Desktop**: Layout de 2 columnas con sidebar
- **Tablet**: Sidebar oculto, accesible via menú
- **Mobile**: Layout de 1 columna, optimizado para scroll

## 🔧 Troubleshooting

### El video no carga
- Verifica la URL del video
- Asegúrate de que el provider está configurado correctamente
- Revisa la consola del navegador

### Los estilos no se aplican
- Verifica que Tailwind CSS esté configurado
- Asegúrate de que el path de los componentes esté en `tailwind.config.js`

### Errores de TypeScript
- Ejecuta `npm run build` para verificar tipos
- Asegúrate de importar los tipos correctos de `@/types/lesson-content`

## 📝 Licencia

Parte del proyecto Nodo360
