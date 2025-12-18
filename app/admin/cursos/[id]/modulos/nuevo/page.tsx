import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin/auth'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface NuevoModuloPageProps {
  params: Promise<{ id: string }>
}

async function createModule(courseId: string, formData: FormData) {
  'use server'

  console.log('🔍 [Create Module] Creando módulo para curso:', courseId)

  await requireAdmin()

  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null

  // Obtener el order_index más alto (usar admin para bypass RLS)
  const { data: lastModule } = await supabaseAdmin
    .from('modules')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const orderIndex = lastModule ? lastModule.order_index + 1 : 0

  // Generar slug
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  console.log('📊 [Create Module] Datos:', { title, orderIndex, slug })

  // Crear módulo (usar admin para bypass RLS)
  const { data, error } = await supabaseAdmin
    .from('modules')
    .insert({
      course_id: courseId,
      title,
      description,
      order_index: orderIndex,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [Create Module] Error:', error)
    throw new Error('Error al crear módulo: ' + error.message)
  }

  console.log('✅ [Create Module] Módulo creado:', data.id)

  revalidatePath(`/admin/cursos/${courseId}/modulos`)
  // Flujo guiado: redirigir a crear primera lección del módulo
  redirect(`/admin/cursos/${courseId}/modulos/${data.id}/lecciones/nueva`)
}

export default async function NuevoModuloPage({ params }: NuevoModuloPageProps) {
  await requireAdmin()
  const resolvedParams = await params
  const courseId = resolvedParams.id
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  const createAction = createModule.bind(null, course.id)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/admin/cursos/${course.id}/modulos`}
          className="flex items-center gap-2 text-[#C5C7D3] hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a módulos
        </Link>

        <h1 className="text-4xl font-bold text-white mb-2">
          Crear Nuevo Módulo
        </h1>
        <p className="text-[#C5C7D3] mb-8">
          {course.title}
        </p>

        <form action={createAction} className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Título del Módulo *
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3] focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
                placeholder="ej. Introducción a Bitcoin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3] focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition resize-none"
                placeholder="Descripción del módulo (opcional)"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href={`/admin/cursos/${course.id}/modulos`}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-[#ff6b35]/50 transition"
            >
              <Save className="w-5 h-5" />
              Crear Módulo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
