import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LessonForm } from '@/components/admin/LessonForm'

interface PageProps {
  params: Promise<{
    courseId: string
    moduleId: string
    lessonId: string
  }>
}

export async function generateMetadata() {
  return {
    title: 'Editar Lección | Instructor Nodo360',
  }
}

export default async function InstructorEditLessonPage({ params }: PageProps) {
  const { courseId, moduleId, lessonId } = await params
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

  // Obtener lección
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  if (!lesson || lesson.module_id !== moduleId) {
    notFound()
  }

  // Obtener módulo
  const { data: module } = await supabase
    .from('modules')
    .select('id, title, course_id')
    .eq('id', moduleId)
    .single()

  if (!module || module.course_id !== courseId) {
    notFound()
  }

  const basePath = `/dashboard/instructor/cursos/${courseId}`

  async function updateLesson(formData: FormData) {
    'use server'

    console.log('✏️ [Instructor Update Lesson] Iniciando actualización de lección:', lessonId)

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

    // Preparar datos de la lección (sin cambiar order_index)
    const lessonData = {
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string || null,
      content: formData.get('content') as string || null,
      video_url: formData.get('video_url') as string || null,
      video_duration_minutes: formData.get('video_duration_minutes')
        ? parseInt(formData.get('video_duration_minutes') as string)
        : null,
      slides_url: formData.get('slides_url') as string || null,
      slides_type: formData.get('slides_type') as string || 'google_slides',
      is_free_preview: formData.get('is_free_preview') === 'on',
    }

    console.log('✏️ [Instructor Update Lesson] Datos:', lessonData)

    const { error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', lessonId)

    if (error) {
      console.error('❌ [Instructor Update Lesson] Error:', error)
      throw new Error('Error al actualizar lección: ' + error.message)
    }

    console.log('✅ [Instructor Update Lesson] Lección actualizada correctamente')

    revalidatePath(`/dashboard/instructor/cursos/${courseId}/modulos/${moduleId}/lecciones`)
    redirect(`/dashboard/instructor/cursos/${courseId}/modulos/${moduleId}/lecciones`)
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
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
          <Link href={`${basePath}/modulos/${moduleId}/lecciones`} className="text-white/60 hover:text-white transition">
            {module.title}
          </Link>
          <span className="text-white/40">/</span>
          <span className="text-white font-medium">{lesson.title}</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`${basePath}/modulos/${moduleId}/lecciones`}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">
            Editar Lección
          </h1>
        </div>

        {/* Form */}
        <LessonForm
          action={updateLesson}
          initialData={lesson}
          courseId={courseId}
          moduleId={moduleId}
        />
      </div>
    </div>
  )
}
