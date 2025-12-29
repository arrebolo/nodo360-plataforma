import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { CourseForm } from '@/components/admin/CourseForm'
import { DeleteCourseButton } from '@/components/admin/DeleteCourseButton'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

  const supabase = await createClient()
  await requireAdmin()

  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const long_description = (formData.get('long_description') as string) || null
  const level = formData.get('level') as string
  const status = formData.get('status') as string
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin/cursos"
              className="inline-flex items-center gap-2 text-[#C5C7D3] hover:text-white transition mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a cursos
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">
              Editar Curso
            </h1>
            <p className="text-[#C5C7D3]">
              {course.title}
            </p>
          </div>

          {/* Botón Eliminar */}
          <DeleteCourseButton
            courseId={course.id}
            courseTitle={course.title}
          />
        </div>

        {/* Formulario */}
        <CourseForm action={updateAction} initialData={course} />
      </div>
    </div>
  )
}
