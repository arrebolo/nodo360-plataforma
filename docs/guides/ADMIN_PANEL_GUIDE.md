# 📚 Panel de Administración - Nodo360

## ✅ Archivos Creados (Base del Sistema)

### 📂 Estructura de Carpetas

```
app/admin/
├── layout.tsx                    ✅ Layout con sidebar y protección
├── page.tsx                      ✅ Dashboard principal con stats
├── cursos/
│   ├── page.tsx                  ⏳ PENDIENTE: Lista de cursos
│   ├── nuevo/
│   │   └── page.tsx             ⏳ PENDIENTE: Crear curso
│   └── [id]/
│       ├── page.tsx             ⏳ PENDIENTE: Editar curso
│       └── modulos/
│           └── page.tsx         ⏳ PENDIENTE: Gestión de módulos/lecciones

lib/admin/
├── auth.ts                       ✅ Autenticación y permisos admin
├── utils.ts                      ✅ Utilidades (slugs, validaciones, formateo)
└── actions.ts                    ✅ Server Actions (CRUD completo)

components/admin/
├── Sidebar.tsx                   ✅ Sidebar de navegación
├── StatsCard.tsx                 ✅ Card de estadísticas
├── CourseForm.tsx               ⏳ PENDIENTE: Formulario de curso
├── ModuleForm.tsx               ⏳ PENDIENTE: Formulario de módulo
├── LessonForm.tsx               ⏳ PENDIENTE: Formulario de lección
├── RichTextEditor.tsx           ⏳ PENDIENTE: Editor WYSIWYG con Tiptap
├── DeleteConfirmModal.tsx       ⏳ PENDIENTE: Modal de confirmación
└── DragDropList.tsx             ⏳ PENDIENTE: Reordenar con drag & drop
```

## 🎯 Lo que YA Funciona

### 1. Sistema de Autenticación ✅
- **Archivo:** `lib/admin/auth.ts`
- **Funciones:**
  - `requireAdmin()` - Verifica auth + rol admin/instructor
  - `requireSuperAdmin()` - Solo admin (no instructor)
- **Protección:** Todas las rutas `/admin/*` están protegidas en el layout

### 2. Dashboard Principal ✅
- **Archivo:** `app/admin/page.tsx`
- **Features:**
  - Stats cards con totales (cursos, módulos, lecciones, inscritos)
  - Acciones rápidas (crear curso, ver cursos, reportes)
  - Tabla de últimos 5 cursos creados
  - Links a todas las secciones

### 3. Server Actions (CRUD Completo) ✅
- **Archivo:** `lib/admin/actions.ts`
- **Funciones disponibles:**
  - `createCourse()` - Crear curso
  - `updateCourse()` - Actualizar curso
  - `deleteCourse()` - Eliminar curso
  - `createModule()` - Crear módulo (auto-incrementa order_index)
  - `updateModule()` - Actualizar módulo
  - `deleteModule()` - Eliminar módulo
  - `createLesson()` - Crear lección
  - `updateLesson()` - Actualizar lección
  - `deleteLesson()` - Eliminar lección

**Características:**
- Validación de datos antes de guardar
- Verificación de slugs únicos
- Auto-generación de slugs si no se provee
- Auto-incremento de `order_index`
- Logging con emojis (🔍 ✅ ❌)
- Revalidación automática de rutas
- Manejo de errores robusto

### 4. Utilidades ✅
- **Archivo:** `lib/admin/utils.ts`
- **Funciones:**
  - `generateSlug(title)` - Genera slug SEO-friendly
  - `isValidYouTubeUrl(url)` - Valida URLs de YouTube
  - `validateCourseData()` - Valida formulario de curso
  - `validateModuleData()` - Valida formulario de módulo
  - `validateLessonData()` - Valida formulario de lección
  - `formatDate()` - Formatea fechas
  - `formatDuration()` - Formatea duración (ej: 65 min → 1h 5m)

### 5. Componentes UI ✅
- **Sidebar** con navegación y perfil de usuario
- **StatsCard** para métricas con iconos

## ⏳ Siguientes Pasos (Por Implementar)

### FASE 1: CRUD de Cursos (CRÍTICO)

#### 1. Lista de Cursos (`app/admin/cursos/page.tsx`)

```typescript
import { requireAdmin } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Edit, Trash2, Eye } from 'lucide-react'

export default async function CoursesListPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*, modules(count)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Cursos</h1>
        <Link
          href="/admin/cursos/nuevo"
          className="px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white rounded-lg"
        >
          Crear Nuevo Curso
        </Link>
      </div>

      {/* Grid de cursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <div key={course.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
            {/* Thumbnail */}
            {course.thumbnail_url && (
              <img src={course.thumbnail_url} className="w-full h-40 object-cover rounded-lg mb-4" />
            )}

            <h3 className="text-lg font-bold text-white mb-2">{course.title}</h3>
            <p className="text-sm text-white/60 mb-4 line-clamp-2">{course.description}</p>

            {/* Badges */}
            <div className="flex gap-2 mb-4">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                {course.level}
              </span>
              {course.is_free && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  Gratis
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link href={`/admin/cursos/${course.id}`} className="flex-1 btn-secondary">
                <Edit className="w-4 h-4" /> Editar
              </Link>
              <Link href={`/cursos/${course.slug}`} target="_blank" className="btn-secondary">
                <Eye className="w-4 h-4" />
              </Link>
              <button onClick={() => handleDelete(course.id)} className="btn-danger">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### 2. Formulario de Curso (`components/admin/CourseForm.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { generateSlug } from '@/lib/admin/utils'
import { createCourse, updateCourse } from '@/lib/admin/actions'
import { toast } from 'sonner'

interface CourseFormProps {
  course?: any // Para edición
  onSuccess?: () => void
}

export default function CourseForm({ course, onSuccess }: CourseFormProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(course?.title || '')
  const [slug, setSlug] = useState(course?.slug || '')

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!course) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)

    const result = course
      ? await updateCourse(course.id, formData)
      : await createCourse(formData)

    if (result.success) {
      toast.success(course ? 'Curso actualizado' : 'Curso creado')
      onSuccess?.()
    } else {
      toast.error(result.error || 'Error al guardar')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Título *
        </label>
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Slug *
        </label>
        <input
          type="text"
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
        />
        <p className="text-xs text-white/40 mt-1">URL: /cursos/{slug}</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Descripción *
        </label>
        <textarea
          name="description"
          defaultValue={course?.description}
          required
          rows={3}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
        />
      </div>

      {/* Level */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Nivel *
        </label>
        <select
          name="level"
          defaultValue={course?.level || 'beginner'}
          required
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
        >
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
      </div>

      {/* Is Free */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="is_free"
          id="is_free"
          defaultChecked={course?.is_free}
          className="w-5 h-5"
        />
        <label htmlFor="is_free" className="text-white/70">
          Curso gratuito
        </label>
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Guardando...' : (course ? 'Actualizar' : 'Crear Curso')}
        </button>
      </div>
    </form>
  )
}
```

### FASE 2: RichTextEditor (IMPORTANTE)

#### Instalar dependencias:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link
```

#### Crear `components/admin/RichTextEditor.tsx`:

```typescript
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className="bg-white/10 border border-white/20 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex gap-2 p-2 border-b border-white/10">
        <button onClick={() => editor?.chain().focus().toggleBold().run()}>
          Bold
        </button>
        {/* Más botones... */}
      </div>

      {/* Editor */}
      <div className="prose prose-invert max-w-none p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
```

### FASE 3: Gestión de Módulos y Lecciones

Ver la documentación completa en el código de las Server Actions.

## 🔒 Seguridad Implementada

1. **Protección de rutas:** Todas las rutas `/admin/*` requieren autenticación
2. **Verificación de rol:** Solo usuarios con rol `admin` o `instructor`
3. **Server Actions:** Todas las mutaciones verifican permisos
4. **Validación de datos:** Antes de guardar en BD
5. **Slugs únicos:** Verificación automática

## 📝 Próximos Pasos (Ordenados por Prioridad)

1. ✅ **COMPLETADO:** Base del sistema admin
2. ⏳ **Crear página de lista de cursos** (`/admin/cursos`)
3. ⏳ **Crear formulario de curso** (nuevo y editar)
4. ⏳ **Integrar RichTextEditor para `long_description` y `content`**
5. ⏳ **Crear página de gestión de módulos** (`/admin/cursos/[id]/modulos`)
6. ⏳ **Crear formularios de módulo y lección**
7. ⏳ **Añadir modal de confirmación para eliminar**
8. ⏳ **Implementar drag & drop para reordenar** (opcional)

## 🚀 Para Probar el Dashboard

```bash
npm run dev
```

Luego visita: `http://localhost:3000/admin`

**Importante:** Necesitas tener un usuario con `role = 'admin'` o `role = 'instructor'` en la tabla `users`.

## 📦 Dependencias Pendientes

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link
npm install @dnd-kit/core @dnd-kit/sortable  # Para drag & drop (opcional)
```

## ✨ Features Implementados

- ✅ Dashboard con estadísticas en tiempo real
- ✅ Sidebar de navegación con perfil
- ✅ Sistema de autenticación y autorización
- ✅ Server Actions para CRUD completo
- ✅ Validaciones de formularios
- ✅ Auto-generación de slugs
- ✅ Auto-incremento de order_index
- ✅ Logging detallado con emojis
- ✅ Revalidación automática de cache

## 📚 Recursos Adicionales

- **Tiptap:** https://tiptap.dev/docs
- **DnD Kit:** https://docs.dndkit.com/
- **Supabase Auth:** https://supabase.com/docs/guides/auth

---

**Estado:** Base funcional creada ✅
**Siguiente paso:** Implementar páginas de CRUD de cursos
**Estimación:** 2-3 horas para completar CRUD básico
