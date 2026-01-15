import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin/auth'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, Save, Layers, Trash2 } from 'lucide-react'

interface EditModulePageProps {
  params: Promise<{ id: string; moduleId: string }>
}

export async function generateMetadata({ params }: EditModulePageProps) {
  const resolvedParams = await params
  return {
    title: `Editar Módulo | Admin Nodo360`,
  }
}

// Server Action: Actualizar módulo
async function updateModule(courseId: string, moduleId: string, formData: FormData) {
  'use server'

  console.log('🔍 [Update Module] Actualizando módulo:', moduleId)

  await requireAdmin()
  const supabase = createAdminClient()

  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null

  // Generar slug desde título
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { error } = await supabase
    .from('modules')
    .update({
      title,
      description,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', moduleId)

  if (error) {
    console.error('❌ [Update Module] Error:', error)
    throw new Error('Error al actualizar módulo: ' + error.message)
  }

  console.log('✅ [Update Module] Módulo actualizado')
  revalidatePath(`/admin/cursos/${courseId}/modulos`)
  revalidatePath(`/admin/cursos/${courseId}/modulos/${moduleId}`)
  redirect(`/admin/cursos/${courseId}/modulos`)
}

// Server Action: Eliminar módulo
async function deleteModule(courseId: string, moduleId: string) {
  'use server'

  console.log('🔍 [Delete Module] Eliminando módulo:', moduleId)

  await requireAdmin()
  const supabase = createAdminClient()

  // Verificar si tiene lecciones
  const { count } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('module_id', moduleId)

  if (count && count > 0) {
    throw new Error(`No se puede eliminar: el módulo tiene ${count} lección(es). Elimínalas primero.`)
  }

  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId)

  if (error) {
    console.error('❌ [Delete Module] Error:', error)
    throw new Error('Error al eliminar módulo: ' + error.message)
  }

  console.log('✅ [Delete Module] Módulo eliminado')
  revalidatePath(`/admin/cursos/${courseId}/modulos`)
  redirect(`/admin/cursos/${courseId}/modulos`)
}

export default async function EditModulePage({ params }: EditModulePageProps) {
  await requireAdmin()
  const resolvedParams = await params
  const { id: courseId, moduleId } = resolvedParams
  const supabase = await createClient()

  // Obtener curso
  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  // Obtener módulo
  const { data: module } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .eq('course_id', courseId)
    .single()

  if (!module) notFound()

  // Contar lecciones
  const { count: lessonCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('module_id', moduleId)

  const updateAction = updateModule.bind(null, courseId, moduleId)
  const deleteAction = deleteModule.bind(null, courseId, moduleId)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        {/* Navegación */}
        <Link
          href={`/admin/cursos/${course.id}/modulos`}
          className="flex items-center gap-2 text-white/70 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a módulos
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Editar Módulo
            </h1>
            <p className="text-white/70">
              {course.title}
            </p>
          </div>

          {/* Link a lecciones */}
          <Link
            href={`/admin/cursos/${courseId}/modulos/${moduleId}/lecciones`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition"
          >
            <Layers className="w-5 h-5" />
            Gestionar lecciones
            {lessonCount !== null && lessonCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                {lessonCount}
              </span>
            )}
          </Link>
        </div>

        {/* Formulario */}
        <form action={updateAction} className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Título del Módulo *
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={module.title}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 transition"
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
                defaultValue={module.description || ''}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 transition resize-none"
                placeholder="Descripción del módulo (opcional)"
              />
            </div>

            {/* Info adicional */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/50">Orden:</span>
                  <span className="ml-2 text-white">{module.order_index + 1}</span>
                </div>
                <div>
                  <span className="text-white/50">Lecciones:</span>
                  <span className="ml-2 text-white">{lessonCount || 0}</span>
                </div>
                <div>
                  <span className="text-white/50">Slug:</span>
                  <span className="ml-2 text-white font-mono text-xs">{module.slug}</span>
                </div>
                <div>
                  <span className="text-white/50">ID:</span>
                  <span className="ml-2 text-white font-mono text-xs">{module.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between">
            <Link
              href={`/admin/cursos/${course.id}/modulos`}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-brand-light/30 transition"
            >
              <Save className="w-5 h-5" />
              Guardar Cambios
            </button>
          </div>
        </form>

        {/* Zona de peligro */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Zona de peligro</h3>
          <div className="bg-error/10 border border-error/30 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-white">Eliminar módulo</h4>
                <p className="text-sm text-white/60 mt-1">
                  {lessonCount && lessonCount > 0
                    ? `Este módulo tiene ${lessonCount} lección(es). Elimínalas primero.`
                    : 'Esta acción no se puede deshacer.'}
                </p>
              </div>
              <form action={deleteAction}>
                <button
                  type="submit"
                  disabled={lessonCount !== null && lessonCount > 0}
                  className="flex items-center gap-2 px-4 py-2 bg-error/20 text-error border border-error/30 rounded-lg hover:bg-error/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
