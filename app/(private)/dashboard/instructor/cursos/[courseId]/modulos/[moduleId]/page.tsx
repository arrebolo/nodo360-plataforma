import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, Save, Layers, Trash2 } from 'lucide-react'

interface EditModulePageProps {
  params: Promise<{ courseId: string; moduleId: string }>
}

export async function generateMetadata() {
  return {
    title: 'Editar Módulo | Instructor Nodo360',
  }
}

// Server Action: Actualizar módulo
async function updateModule(courseId: string, moduleId: string, formData: FormData) {
  'use server'

  console.log('🔍 [Instructor Update Module] Actualizando módulo:', moduleId)

  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar que es dueño del curso
  const { data: course } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single()

  if (!course || course.instructor_id !== user.id) {
    throw new Error('No tienes permisos para modificar este curso')
  }

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
    console.error('❌ [Instructor Update Module] Error:', error)
    throw new Error('Error al actualizar módulo: ' + error.message)
  }

  console.log('✅ [Instructor Update Module] Módulo actualizado')
  revalidatePath(`/dashboard/instructor/cursos/${courseId}/modulos`)
  revalidatePath(`/dashboard/instructor/cursos/${courseId}/modulos/${moduleId}`)
  redirect(`/dashboard/instructor/cursos/${courseId}/modulos`)
}

// Server Action: Eliminar módulo
async function deleteModule(courseId: string, moduleId: string) {
  'use server'

  console.log('🔍 [Instructor Delete Module] Eliminando módulo:', moduleId)

  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar que es dueño del curso
  const { data: course } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single()

  if (!course || course.instructor_id !== user.id) {
    throw new Error('No tienes permisos para modificar este curso')
  }

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
    console.error('❌ [Instructor Delete Module] Error:', error)
    throw new Error('Error al eliminar módulo: ' + error.message)
  }

  console.log('✅ [Instructor Delete Module] Módulo eliminado')
  revalidatePath(`/dashboard/instructor/cursos/${courseId}/modulos`)
  redirect(`/dashboard/instructor/cursos/${courseId}/modulos`)
}

export default async function EditModulePage({ params }: EditModulePageProps) {
  const { courseId, moduleId } = await params
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Obtener curso
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  // Verificar permisos
  const isOwner = course.instructor_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    redirect('/dashboard')
  }

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

  const basePath = `/dashboard/instructor/cursos/${courseId}`
  const updateAction = updateModule.bind(null, courseId, moduleId)
  const deleteAction = deleteModule.bind(null, courseId, moduleId)

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/dashboard/instructor/cursos" className="text-white/60 hover:text-white transition">
            Mis Cursos
          </Link>
          <span className="text-white/40">/</span>
          <Link href={`${basePath}/modulos`} className="text-white/60 hover:text-white transition">
            {course.title}
          </Link>
          <span className="text-white/40">/</span>
          <span className="text-white font-medium">{module.title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href={`${basePath}/modulos`}
              className="flex items-center gap-2 text-white/60 hover:text-white transition mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a módulos
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">
              Editar Módulo
            </h1>
            <p className="text-white/60">
              {course.title}
            </p>
          </div>

          {/* Link a lecciones */}
          <Link
            href={`${basePath}/modulos/${moduleId}/lecciones`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition text-sm"
          >
            <Layers className="w-4 h-4" />
            Gestionar lecciones
            {lessonCount !== null && lessonCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {lessonCount}
              </span>
            )}
          </Link>
        </div>

        {/* Formulario */}
        <form action={updateAction} className="space-y-6">
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Título del Módulo *
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={module.title}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 transition"
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 transition resize-none"
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
              href={`${basePath}/modulos`}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition text-sm"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition text-sm"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </form>

        {/* Zona de peligro */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Zona de peligro</h3>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
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
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
