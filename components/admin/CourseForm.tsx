// components/admin/CourseForm.tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

// Opciones de nivel y categoria (exportadas para uso en listado)
export const LEVEL_OPTIONS = [
  { value: 'basic', label: 'Basico' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
]

export const CATEGORY_OPTIONS = [
  { value: 'bitcoin', label: 'Bitcoin' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'defi', label: 'DeFi' },
  { value: 'nfts', label: 'NFTs' },
  { value: 'security', label: 'Seguridad' },
  { value: 'web3', label: 'Web3 general' },
]

export type CourseFormValues = {
  id?: string
  title: string
  slug: string
  subtitle: string
  description: string
  duration_label: string
  is_premium: boolean
  is_certifiable: boolean
  published_at: string | null
  difficulty_level: string
  topic_category: string
  path_id: string | null
}

export interface LearningPathOption {
  id: string
  name: string
  slug: string
  is_active?: boolean
}

export interface LearningPathSummary {
  id: string
  slug: string
  name: string
  is_active?: boolean
}

interface CourseFormProps {
  initialData?: CourseFormValues
  mode: 'create' | 'edit'
  paths?: LearningPathOption[]
  assignedPaths?: LearningPathSummary[]
}

// Funcion para generar slug limpio
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9]+/g, '-')     // caracteres raros a guion
    .replace(/^-+|-+$/g, '')         // quita guiones extremos
}

export function CourseForm({ initialData, mode, paths, assignedPaths }: CourseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData?.slug))
  const [status, setStatus] = useState<'draft' | 'published'>(
    initialData?.published_at ? 'published' : 'draft'
  )

  const [form, setForm] = useState<CourseFormValues>({
    id: initialData?.id,
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    subtitle: initialData?.subtitle ?? '',
    description: initialData?.description ?? '',
    duration_label: initialData?.duration_label ?? '',
    is_premium: initialData?.is_premium ?? false,
    is_certifiable: initialData?.is_certifiable ?? false,
    published_at: initialData?.published_at ?? null,
    difficulty_level: initialData?.difficulty_level ?? '',
    topic_category: initialData?.topic_category ?? '',
    path_id: initialData?.path_id ?? null,
  })

  const isEdit = mode === 'edit'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement
    const { name, value, type } = target
    const checked = type === 'checkbox' ? target.checked : false

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }

      // Auto-slug solo cuando cambia el titulo y el usuario no ha tocado el slug
      if (name === 'title' && !slugTouched) {
        next.slug = slugify(value)
      }

      return next
    })
  }

  // Handler especifico para slug (marca como tocado)
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true)
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit
        ? `/api/admin/courses/${form.id}`
        : '/api/admin/courses'

      const method = isEdit ? 'PUT' : 'POST'

      // Mapear status a published_at
      const formData = {
        ...form,
        published_at: status === 'published'
          ? (form.published_at || new Date().toISOString())
          : null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error guardando el curso')
      }

      console.log('[CourseForm] Curso guardado:', data)

      // Flujo guiado: al crear curso nuevo, redirigir a crear primer módulo
      if (!isEdit && data.course?.id) {
        router.push(`/admin/cursos/${data.course.id}/modulos/nuevo`)
      } else {
        router.push('/admin/cursos')
      }
      router.refresh()
    } catch (err: any) {
      console.error('[CourseForm] Error:', err)
      setError(err.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold text-[#FAF4ED]">
          {isEdit ? 'Editar curso' : 'Crear nuevo curso'}
        </h1>
        <button
          type="button"
          onClick={() => router.push('/admin/cursos')}
          className="text-[13px] text-[#5A9FD4] hover:text-[#7AB8E8]"
        >
          Volver al listado
        </button>
      </div>

      {error && (
        <div className="text-sm text-[#E15B5B] border border-[rgba(225,91,91,0.3)] bg-[rgba(225,91,91,0.1)] rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="grid gap-5">
        {/* Titulo */}
        <div>
          <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
            Titulo *
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            onBlur={() => {
              // Si el slug esta vacio, generarlo automaticamente
              if (!form.slug && form.title) {
                setForm((prev) => ({ ...prev, slug: slugify(prev.title) }))
              }
            }}
            className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition"
            placeholder="Fundamentos de Bitcoin"
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
            Slug (URL) *
          </label>
          <div className="flex gap-2">
            <input
              name="slug"
              value={form.slug}
              onChange={handleSlugChange}
              onBlur={() => setSlugTouched(true)}
              className="flex-1 rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition font-mono"
              placeholder="fundamentos-de-bitcoin"
              required
            />
            <button
              type="button"
              onClick={() => {
                setForm((prev) => ({ ...prev, slug: slugify(prev.title) }))
                setSlugTouched(false)
              }}
              className="px-3 py-2 rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#373531] text-[12px] text-[#D7D3CE] hover:bg-[#3B3936] transition"
            >
              Auto
            </button>
          </div>
          <p className="text-[11px] text-[#6F665C] mt-1">
            URL: /cursos/{form.slug || 'slug'}
          </p>
        </div>

        {/* Subtitulo */}
        <div>
          <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
            Subtitulo
          </label>
          <input
            name="subtitle"
            value={form.subtitle}
            onChange={handleChange}
            className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition"
            placeholder="Introduccion clara y sencilla a Bitcoin"
          />
        </div>

        {/* Descripcion */}
        <div>
          <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
            Descripcion
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition min-h-[120px] resize-y"
            placeholder="Describe el contenido y objetivos del curso..."
          />
        </div>

        {/* Duracion */}
        <div>
          <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
            Duracion estimada
          </label>
          <input
            name="duration_label"
            value={form.duration_label}
            onChange={handleChange}
            className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition"
            placeholder="~20 min"
          />
        </div>

        {/* Nivel y Categoria */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
              Nivel de dificultad
            </label>
            <select
              name="difficulty_level"
              value={form.difficulty_level}
              onChange={handleChange}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
            >
              <option value="">Sin nivel definido</option>
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
              Categoria / Tema
            </label>
            <select
              name="topic_category"
              value={form.topic_category}
              onChange={handleChange}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
            >
              <option value="">Sin categoria</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ruta de aprendizaje */}
        {paths && paths.length > 0 && (
          <div className="bg-[rgba(59,116,159,0.08)] border border-[rgba(59,116,159,0.2)] rounded-[14px] p-4">
            <h3 className="text-[14px] font-semibold text-[#FAF4ED] mb-1">
              Ruta de aprendizaje
            </h3>
            <p className="text-[12px] text-[#D7D3CE] mb-3">
              Asigna este curso a una ruta principal. Puedes gestionar rutas avanzadas desde el panel de rutas.
            </p>

            <select
              name="path_id"
              value={form.path_id ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  path_id: e.target.value || null,
                }))
              }
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
            >
              <option value="">Sin ruta asignada</option>
              {paths
                .filter((p) => p.is_active !== false)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.slug})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6 py-2">
          <label className="inline-flex items-center gap-2 text-[14px] text-[#D7D3CE] cursor-pointer">
            <input
              type="checkbox"
              name="is_premium"
              checked={form.is_premium}
              onChange={handleChange}
              className="w-4 h-4 rounded border-[rgba(250,244,237,0.2)] bg-[#2C2A28] text-[#F7931A] focus:ring-[#F7931A] focus:ring-offset-0"
            />
            <span>Curso premium</span>
          </label>

          <label className="inline-flex items-center gap-2 text-[14px] text-[#D7D3CE] cursor-pointer">
            <input
              type="checkbox"
              name="is_certifiable"
              checked={form.is_certifiable}
              onChange={handleChange}
              className="w-4 h-4 rounded border-[rgba(250,244,237,0.2)] bg-[#2C2A28] text-[#4CAF7A] focus:ring-[#4CAF7A] focus:ring-offset-0"
            />
            <span>Genera certificado</span>
          </label>
        </div>

        {/* Estado del curso */}
        <div className="bg-[rgba(38,36,33,0.5)] border border-[rgba(250,244,237,0.1)] rounded-[14px] p-4">
          <label className="block text-[13px] font-medium text-[#D7D3CE] mb-3">
            Estado del curso
          </label>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg border transition ${
              status === 'draft'
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-[rgba(250,244,237,0.15)] bg-[#2C2A28] hover:bg-[#373531]'
            }`}>
              <input
                type="radio"
                name="status"
                value="draft"
                checked={status === 'draft'}
                onChange={() => setStatus('draft')}
                className="w-4 h-4 text-amber-500 bg-[#2C2A28] border-[rgba(250,244,237,0.2)] focus:ring-amber-500 focus:ring-offset-0"
              />
              <span className={`text-[13px] ${status === 'draft' ? 'text-amber-400' : 'text-[#D7D3CE]'}`}>
                📝 Borrador
              </span>
            </label>
            <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg border transition ${
              status === 'published'
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-[rgba(250,244,237,0.15)] bg-[#2C2A28] hover:bg-[#373531]'
            }`}>
              <input
                type="radio"
                name="status"
                value="published"
                checked={status === 'published'}
                onChange={() => setStatus('published')}
                className="w-4 h-4 text-emerald-500 bg-[#2C2A28] border-[rgba(250,244,237,0.2)] focus:ring-emerald-500 focus:ring-offset-0"
              />
              <span className={`text-[13px] ${status === 'published' ? 'text-emerald-400' : 'text-[#D7D3CE]'}`}>
                ✅ Publicado
              </span>
            </label>
          </div>
          <p className="text-[11px] text-[#6F665C] mt-3">
            {status === 'draft'
              ? 'El curso no sera visible para los alumnos. Solo los administradores podran verlo.'
              : 'El curso estara disponible publicamente para inscripciones.'}
          </p>
        </div>
      </div>

      {/* Rutas de aprendizaje asignadas (solo en modo edicion) */}
      {mode === 'edit' && (
        <section className="mt-6 pt-5 border-t border-[rgba(250,244,237,0.1)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-[#FAF4ED]">
              Rutas de aprendizaje
            </h3>
            <a
              href="/admin/rutas"
              className="text-[12px] text-[#5A9FD4] hover:text-[#7AB8E8] hover:underline"
            >
              Gestionar rutas
            </a>
          </div>

          {assignedPaths && assignedPaths.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignedPaths.map((p) => (
                <a
                  key={p.id}
                  href={`/admin/rutas/${p.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(250,244,237,0.15)] bg-[rgba(59,116,159,0.12)] px-3 py-1.5 text-[12px] text-[#FAF4ED] hover:bg-[rgba(59,116,159,0.2)] transition"
                >
                  <span>{p.name}</span>
                  <span className="text-[10px] text-[#6F665C]">({p.slug})</span>
                  {p.is_active === false && (
                    <span className="text-[9px] text-[#E15B5B]">(inactiva)</span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-[rgba(38,36,33,0.5)] border border-[rgba(250,244,237,0.08)] rounded-lg p-4 text-center">
              <p className="text-[13px] text-[#6F665C]">
                Este curso todavia no esta asignado a ninguna ruta.
              </p>
              <a
                href="/admin/rutas"
                className="inline-block mt-2 text-[12px] text-[#5A9FD4] hover:text-[#7AB8E8] hover:underline"
              >
                Anadir desde el panel de rutas
              </a>
            </div>
          )}
        </section>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-semibold bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] text-[#1F1E1B] shadow-[0_8px_20px_rgba(247,147,26,0.35)] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(247,147,26,0.55)] disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear curso'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin/cursos')}
          className="px-5 py-2.5 rounded-full border border-[rgba(250,244,237,0.2)] text-[14px] text-[#D7D3CE] hover:bg-[rgba(250,244,237,0.05)] transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
