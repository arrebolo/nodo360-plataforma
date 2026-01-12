# REPORTE DE AUDITORIA - Creacion de Cursos Nodo360

## Resumen Ejecutivo

- **Puntuacion general:** 68/150 puntos
- **Estado actual:** Funcional MVP
- **Prioridad de mejoras:**
  1. Upload de imagenes directo (actualmente solo URLs)
  2. Editor de contenido WYSIWYG para lecciones
  3. Preview del curso antes de publicar
  4. Drag & drop para reordenar modulos/lecciones
  5. Sistema de quizzes integrado en creacion

---

## Estado Actual por Area

### A) Formulario de Creacion de Cursos (35/50 puntos)

| Feature | Estado | Descripcion | Prioridad |
|---------|--------|-------------|-----------|
| Titulo y slug | ✅ | Auto-genera slug desde titulo | - |
| Descripcion corta | ✅ | Con contador de caracteres (160 max) | - |
| Descripcion larga | ✅ | Textarea basico | - |
| Nivel (beginner/intermediate/advanced) | ✅ | Select funcional | - |
| Estado (draft/published/archived) | ✅ | Select funcional | - |
| Precio y is_free/is_premium | ✅ | Toggles y campo condicional | - |
| URL thumbnail | 🟡 | Solo URL externa, sin upload | Alta |
| URL banner | 🟡 | Solo URL externa, sin upload | Alta |
| Validacion cliente | ✅ | Con toast de errores | - |
| Validacion servidor | ✅ | Verifica slug unico | - |
| Categorias/tags | ❌ | No implementado | Media |
| Duracion estimada | ❌ | No se calcula automaticamente | Baja |
| Preview antes de publicar | ❌ | No existe | Alta |
| Requisitos previos | ❌ | Campo no existe | Media |
| Lo que aprenderas | ❌ | Campo no existe | Media |

**Componentes involucrados:**
- `components/courses/CourseFormCore.tsx` - Formulario modular nuevo
- `components/admin/CourseForm.tsx` - Formulario legacy
- `lib/courses/course-utils.ts` - Validaciones y utilidades
- `lib/courses/course-actions.ts` - Server actions

---

### B) Gestion de Modulos (22/30 puntos)

| Feature | Estado | Descripcion | Prioridad |
|---------|--------|-------------|-----------|
| Crear modulo | ✅ | Titulo y descripcion | - |
| Editar modulo | ✅ | Funcional | - |
| Eliminar modulo | ✅ | Con boton de confirmacion | - |
| Reordenar modulos | 🟡 | Solo con botones arriba/abajo | Alta |
| Slug automatico | ✅ | Genera desde titulo | - |
| Conteo de lecciones | ✅ | Muestra en listado | - |
| Drag & drop | ❌ | No implementado | Alta |
| Duplicar modulo | ❌ | No implementado | Media |
| Icono/imagen modulo | ❌ | No existe campo | Baja |

**Componentes involucrados:**
- `app/(private)/admin/cursos/[id]/modulos/page.tsx`
- `app/(private)/admin/cursos/[id]/modulos/nuevo/page.tsx`
- `components/admin/ReorderModuleButtons.tsx`
- `components/admin/DeleteModuleButton.tsx`

---

### C) Contenido de Lecciones (20/30 puntos)

| Feature | Estado | Descripcion | Prioridad |
|---------|--------|-------------|-----------|
| Crear leccion | ✅ | Campos basicos | - |
| Titulo y slug | ✅ | Auto-genera slug | - |
| Descripcion | ✅ | Textarea simple | - |
| Contenido (texto) | 🟡 | Textarea plano, sin WYSIWYG | Alta |
| Video URL (YouTube) | ✅ | Campo de URL | - |
| Duracion video | ✅ | Campo manual | - |
| Vista previa gratuita | ✅ | Checkbox funcional | - |
| Reordenar lecciones | 🟡 | Solo botones arriba/abajo | Alta |
| Drag & drop | ❌ | No implementado | Alta |
| Editor Markdown | ❌ | Solo textarea plano | Alta |
| Upload de archivos | ❌ | No implementado | Media |
| Recursos adjuntos | ❌ | No implementado | Media |
| Quiz por leccion | ❌ | No integrado en creacion | Media |
| Transcripcion video | ❌ | No implementado | Baja |

**Componentes involucrados:**
- `components/admin/LessonForm.tsx`
- `app/(private)/admin/cursos/[id]/modulos/[moduleId]/lecciones/page.tsx`
- `app/(private)/admin/cursos/[id]/modulos/[moduleId]/lecciones/nueva/page.tsx`
- `components/admin/ReorderLessonButtons.tsx`
- `components/admin/DeleteLessonButton.tsx`

---

### D) Flujo de Publicacion (10/20 puntos)

| Feature | Estado | Descripcion | Prioridad |
|---------|--------|-------------|-----------|
| Toggle draft/published | ✅ | Via API route | - |
| Duplicar curso | ✅ | Copia basica (sin modulos) | Media |
| Eliminar curso | ✅ | Con confirmacion | - |
| Checklist pre-publicacion | ❌ | No existe | Alta |
| Preview publico | ❌ | No existe | Alta |
| Programar publicacion | ❌ | No implementado | Baja |
| Versionado | ❌ | No implementado | Baja |
| Historial de cambios | ❌ | No implementado | Baja |

**Archivos relevantes:**
- `app/(private)/admin/cursos/[id]/toggle-status/route.ts`
- `app/(private)/admin/cursos/[id]/duplicate/route.ts`
- `components/admin/DeleteCourseButton.tsx`

---

### E) UX/UI General (16/20 puntos)

| Feature | Estado | Descripcion | Prioridad |
|---------|--------|-------------|-----------|
| Navegacion breadcrumbs | ✅ | Implementado | - |
| KPIs dashboard | ✅ | Cursos, modulos, lecciones, inscritos | - |
| Filtros por estado | ✅ | draft/published | - |
| Busqueda de cursos | ❌ | No implementado | Media |
| Paginacion | ❌ | No implementado (carga todos) | Media |
| Dark theme consistente | ✅ | Bien implementado | - |
| Responsive | ✅ | Grid adaptativo | - |
| Loading states | 🟡 | Parcial (botones si, paginas no) | Baja |
| Empty states | ✅ | Bien disenados | - |
| Toasts de feedback | ✅ | Implementado con sonner | - |

---

## Mejoras Recomendadas

### CRITICAS (Implementar antes de produccion)

1. **Upload de imagenes directo**
   - Razon: Pedir URLs es mala UX, los instructores no tienen donde hostear imagenes
   - Esfuerzo: 4-6 horas
   - Impacto: Alto

2. **Editor WYSIWYG para lecciones**
   - Razon: Textarea plano es insuficiente para contenido educativo rico
   - Esfuerzo: 8-12 horas (integrar TipTap o similar)
   - Impacto: Alto

3. **Preview del curso antes de publicar**
   - Razon: El instructor debe ver como se vera su curso antes de publicar
   - Esfuerzo: 4-6 horas
   - Impacto: Alto

4. **Checklist de publicacion**
   - Razon: Evitar publicar cursos incompletos (sin modulos, sin lecciones, sin thumbnail)
   - Esfuerzo: 2-3 horas
   - Impacto: Medio-Alto

### IMPORTANTES (Mejorar experiencia significativamente)

1. **Drag & drop para reordenar**
   - Razon: Botones arriba/abajo son lentos para muchos items
   - Esfuerzo: 4-6 horas (usar dnd-kit o similar)
   - Impacto: Medio

2. **Busqueda y paginacion en listados**
   - Razon: Escalabilidad cuando haya muchos cursos
   - Esfuerzo: 3-4 horas
   - Impacto: Medio

3. **Campos adicionales del curso**
   - Razon: Competidores tienen: requisitos, lo que aprenderas, para quien es
   - Esfuerzo: 2-3 horas (agregar campos a DB y form)
   - Impacto: Medio

4. **Duplicar curso completo**
   - Razon: Actualmente solo copia metadata, no modulos/lecciones
   - Esfuerzo: 3-4 horas
   - Impacto: Medio

5. **Recursos/materiales por leccion**
   - Razon: PDFs, links, archivos descargables
   - Esfuerzo: 4-6 horas
   - Impacto: Medio

### NICE-TO-HAVE (Pulir para version premium)

1. **Auto-save de formularios**
   - Esfuerzo: 2-3 horas

2. **Transcripcion automatica de videos**
   - Esfuerzo: 8+ horas (integracion con servicio externo)

3. **Programar publicacion**
   - Esfuerzo: 3-4 horas

4. **Analytics por curso**
   - Esfuerzo: 6-8 horas

5. **Templates de cursos**
   - Esfuerzo: 4-6 horas

---

## Comparacion con Competidores

| Feature | Nodo360 | Udemy | Teachable | Thinkific | Hotmart |
|---------|---------|-------|-----------|-----------|---------|
| Upload imagenes | ❌ URL | ✅ | ✅ | ✅ | ✅ |
| Editor WYSIWYG | ❌ | ✅ | ✅ | ✅ | ✅ |
| Drag & drop | ❌ | ✅ | ✅ | ✅ | ✅ |
| Preview curso | ❌ | ✅ | ✅ | ✅ | ✅ |
| Quizzes integrados | ❌* | ✅ | ✅ | ✅ | ✅ |
| Certificados | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pricing flexible | 🟡 | ✅ | ✅ | ✅ | ✅ |
| Bundles | ❌ | ✅ | ✅ | ✅ | ✅ |
| Cupones | ❌ | ✅ | ✅ | ✅ | ✅ |
| Multi-instructor | ❌ | ✅ | ✅ | 🟡 | ✅ |
| Gamificacion | ✅ | ❌ | ❌ | 🟡 | ❌ |

*Nodo360 tiene quizzes pero no estan integrados en el flujo de creacion

---

## Plan de Implementacion Sugerido

### Sprint 1 (1 semana) - Fundamentos de UX

- [ ] Implementar upload de imagenes con Supabase Storage
- [ ] Agregar preview del curso (ruta `/admin/cursos/[id]/preview`)
- [ ] Crear checklist de publicacion
- [ ] Agregar campos: requisitos, lo_que_aprenderas, para_quien

### Sprint 2 (1 semana) - Editor de Contenido

- [ ] Integrar TipTap como editor WYSIWYG para lecciones
- [ ] Agregar soporte para imagenes inline en contenido
- [ ] Implementar preview de leccion
- [ ] Agregar recursos/materiales adjuntos

### Sprint 3 (1 semana) - UX Avanzada

- [ ] Implementar drag & drop con dnd-kit
- [ ] Agregar busqueda y paginacion en listados
- [ ] Duplicar curso completo (con modulos y lecciones)
- [ ] Auto-save de formularios

### Sprint 4 (1 semana) - Features Premium

- [ ] Integrar creacion de quizzes en flujo de leccion
- [ ] Agregar analytics basicos por curso
- [ ] Sistema de cupones/descuentos
- [ ] Templates de cursos

---

## Codigo de Referencia para Mejoras Criticas

### 1. Upload de Imagenes (componente)

```tsx
// components/admin/ImageUpload.tsx
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  bucket: string
  folder: string
  currentUrl?: string
  onUpload: (url: string) => void
  label?: string
  aspectRatio?: '16:9' | '1:1' | '4:3'
}

export function ImageUpload({
  bucket,
  folder,
  currentUrl,
  onUpload,
  label = 'Imagen',
  aspectRatio = '16:9'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imagenes')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Maximo 5MB')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const path = `${folder}/${fileName}`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      setPreview(publicUrl)
      onUpload(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/80">
        {label}
      </label>

      <div
        className={`relative border-2 border-dashed border-white/20 rounded-xl
                    hover:border-brand-light/50 transition cursor-pointer
                    ${aspectRatio === '16:9' ? 'aspect-video' :
                      aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[4/3]'}`}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setPreview(null)
                onUpload('')
              }}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-white/40 mb-2" />
                <span className="text-sm text-white/60">Click para subir</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
```

### 2. Checklist de Publicacion

```tsx
// components/admin/PublishChecklist.tsx
interface ChecklistItem {
  label: string
  completed: boolean
  required: boolean
}

export function PublishChecklist({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkCourse() {
      const supabase = createClient()

      // Obtener curso con modulos y lecciones
      const { data: course } = await supabase
        .from('courses')
        .select(`
          *,
          modules:modules(
            id,
            lessons:lessons(count)
          )
        `)
        .eq('id', courseId)
        .single()

      if (!course) return

      const totalModules = course.modules?.length || 0
      const totalLessons = course.modules?.reduce(
        (acc: number, m: any) => acc + (m.lessons?.[0]?.count || 0), 0
      ) || 0

      setItems([
        { label: 'Titulo del curso', completed: !!course.title, required: true },
        { label: 'Descripcion corta', completed: !!course.description, required: true },
        { label: 'Imagen thumbnail', completed: !!course.thumbnail_url, required: true },
        { label: 'Al menos 1 modulo', completed: totalModules > 0, required: true },
        { label: 'Al menos 3 lecciones', completed: totalLessons >= 3, required: true },
        { label: 'Descripcion larga', completed: !!course.long_description, required: false },
        { label: 'Banner del curso', completed: !!course.banner_url, required: false },
      ])
      setLoading(false)
    }
    checkCourse()
  }, [courseId])

  const requiredComplete = items.filter(i => i.required).every(i => i.completed)

  return (
    <div className="bg-dark-surface border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Checklist de Publicacion
      </h3>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center
              ${item.completed ? 'bg-success' : 'bg-white/10'}`}>
              {item.completed && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className={item.completed ? 'text-white' : 'text-white/60'}>
              {item.label}
              {item.required && <span className="text-error ml-1">*</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        {requiredComplete ? (
          <button className="w-full py-3 bg-success text-white rounded-lg font-medium">
            Listo para publicar
          </button>
        ) : (
          <div className="text-sm text-white/60 text-center">
            Completa los items requeridos (*) para publicar
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Notas Finales

### Fortalezas Actuales de Nodo360:
1. Sistema de gamificacion unico (XP, badges, niveles)
2. Rutas de aprendizaje estructuradas
3. Dark theme consistente y moderno
4. Arquitectura Next.js 16 con Server Components
5. Validaciones robustas en formularios

### Deuda Tecnica Identificada:
1. Dos componentes de formulario (CourseForm vs CourseFormCore) - unificar
2. Pagina de edicion usa CourseForm legacy, nuevo usa CourseFormCore
3. Instructor dashboard muy basico vs Admin muy completo
4. No hay tests E2E para flujo de creacion

### Recomendacion Final:
Priorizar Sprint 1 (upload imagenes, preview, checklist) antes de lanzar a mas usuarios. La diferencia entre "funcional" y "profesional" esta principalmente en estos features de UX que los competidores ya tienen.
