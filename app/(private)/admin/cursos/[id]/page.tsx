import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin/auth'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { CourseForm } from '@/components/admin/CourseForm'
import { DeleteCourseButton } from '@/components/admin/DeleteCourseButton'
import { PublishCourseButton } from '@/components/admin/PublishCourseButton'
import { CoursePathsSelector } from '@/components/admin/CoursePathsSelector'
import { CourseQuizEditor } from '@/components/admin/CourseQuizEditor'
import Link from 'next/link'
import { ArrowLeft, Layers, Eye, ExternalLink, HelpCircle } from 'lucide-react'

interface EditCoursePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditCoursePageProps) {
  const resolvedParams = await params
  return {
    title: `Editar Curso | Admin Nodo360`,
  }
}

// Server Action: Actualizar curso
async function updateCourse(courseId: string, formData: FormData) {
  'use server'

  console.log('🔍 [Update Course] Actualizando curso:', courseId)

  // Verificar permisos primero
  await requireAdmin()

  // Usar admin client para bypass RLS
  const supabase = createAdminClient()

  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const long_description = (formData.get('long_description') as string) || null
  const level = formData.get('level') as 'beginner' | 'intermediate' | 'advanced'
  const status = formData.get('status') as 'draft' | 'published' | 'archived' | 'coming_soon'
  const is_free = formData.get('is_free') === 'true'
  const is_premium = formData.get('is_premium') === 'true'
  const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null
  const thumbnail_url = (formData.get('thumbnail_url') as string) || null
  const banner_url = (formData.get('banner_url') as string) || null

  const { error } = await supabase
    .from('courses')
    .update({
      title,
      slug,
      description,
      long_description,
      level,
      status,
      is_free,
      is_premium,
      price,
      thumbnail_url,
      banner_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)

  if (error) {
    console.error('❌ [Update Course] Error:', error)
    throw new Error('Error al actualizar curso: ' + error.message)
  }

  console.log('✅ [Update Course] Curso actualizado')
  revalidatePath('/admin/cursos')
  revalidatePath(`/admin/cursos/${courseId}`)
  redirect('/admin/cursos')
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  await requireAdmin()
  const resolvedParams = await params
  const supabase = await createClient()

  // Obtener curso
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !course) {
    notFound()
  }

  const updateAction = updateCourse.bind(null, course.id)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header con título y estado */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">
                {course.title}
              </h1>

              {/* Badge de estado */}
              <span className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
                ${course.status === 'published'
                  ? 'bg-success/20 text-success'
                  : course.status === 'archived'
                    ? 'bg-white/10 text-white/60'
                    : 'bg-warning/20 text-warning'
                }
              `}>
                {course.status === 'published' ? 'Publicado' :
                 course.status === 'archived' ? 'Archivado' :
                 course.status === 'coming_soon' ? 'Próximamente' : 'Borrador'}
              </span>
            </div>

            {/* Botón Eliminar */}
            <DeleteCourseButton
              courseId={course.id}
              courseTitle={course.title}
            />
          </div>

          {/* Fila de acciones principales */}
          <div className="flex flex-wrap items-center gap-3">
            {/* CTA Principal: Gestionar módulos */}
            <Link
              href={`/admin/cursos/${course.id}/modulos`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 hover:-translate-y-0.5 transition-all"
            >
              <Layers className="w-5 h-5" />
              Gestionar módulos
            </Link>

            {/* Botón Publicar/Despublicar */}
            <PublishCourseButton
              courseId={course.id}
              currentStatus={course.status}
            />

            {/* Botón secundario: Preview */}
            <Link
              href={`/cursos/${course.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
            >
              <Eye className="w-5 h-5" />
              Preview
            </Link>

            {/* Ver público (solo si publicado) */}
            {course.status === 'published' && (
              <Link
                href={`/cursos/${course.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 text-white/70 font-medium rounded-xl hover:bg-white/10 hover:text-white transition"
              >
                <ExternalLink className="w-5 h-5" />
                Ver público
              </Link>
            )}

            {/* Link de escape: Volver */}
            <Link
              href="/admin/cursos"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-white/60 hover:text-white transition ml-auto"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a cursos
            </Link>
          </div>
        </div>

        {/* Separador visual */}
        <div className="border-t border-white/10 mb-8" />

        {/* Contenido principal: Formulario + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario principal */}
          <div className="lg:col-span-2">
            <CourseForm action={updateAction} initialData={course} />
          </div>

          {/* Sidebar con opciones adicionales */}
          <div className="space-y-6">
            {/* Selector de rutas de aprendizaje */}
            <CoursePathsSelector courseId={course.id} />
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-white/10 my-8" />

        {/* Quiz Final del Curso */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
          <CourseQuizEditor courseId={course.id} courseName={course.title} />
        </div>
      </div>
    </div>
  )
}
